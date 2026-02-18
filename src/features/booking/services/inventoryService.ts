import {
  doc,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { getDb } from '@/services/firebase';
import { logger } from '@/lib/logger';

const EVENTS_COLLECTION = 'events';

interface TicketTierUpdate {
  tierId: string;
  quantity: number;
}

/**
 * Atomically check availability and decrement ticket stock for an event.
 * Uses a Firestore transaction to prevent overselling.
 *
 * @throws Error if any tier doesn't have enough availability.
 */
export async function decrementTicketAvailability(
  eventId: string,
  tiers: TicketTierUpdate[]
): Promise<void> {
  const eventRef = doc(getDb(), EVENTS_COLLECTION, eventId);

  await runTransaction(getDb(), async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists()) {
      throw new Error(`Event ${eventId} not found`);
    }

    const eventData = eventSnap.data();
    const ticketTypes: any[] = eventData.ticketTypes ?? eventData.ticketTiers ?? [];

    // Validate availability for every requested tier
    for (const { tierId, quantity } of tiers) {
      const tier = ticketTypes.find((t: any) => t.id === tierId);
      if (!tier) throw new Error(`Ticket tier ${tierId} not found`);

      const available =
        (tier.quantityAvailable ?? tier.quantity ?? 0) -
        (tier.quantitySold ?? tier.sold ?? 0);
      if (available < quantity) {
        throw new Error(
          `Only ${available} tickets left for "${tier.name || tierId}".`
        );
      }
    }

    // All checks passed — apply decrements
    const updatedTiers = ticketTypes.map((tier: any) => {
      const match = tiers.find((t) => t.tierId === tier.id);
      if (!match) return tier;
      return {
        ...tier,
        quantitySold: (tier.quantitySold ?? tier.sold ?? 0) + match.quantity,
        sold: (tier.sold ?? tier.quantitySold ?? 0) + match.quantity,
      };
    });

    transaction.update(eventRef, {
      ticketTypes: updatedTiers,
      ticketTiers: updatedTiers,
    });
  });

  logger.log(`🎟️ Ticket inventory decremented for event: ${eventId}`);
}

/**
 * Restore ticket availability (e.g. after a refund or cancellation).
 */
export async function restoreTicketAvailability(
  eventId: string,
  tiers: TicketTierUpdate[]
): Promise<void> {
  const eventRef = doc(getDb(), EVENTS_COLLECTION, eventId);

  await runTransaction(getDb(), async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists()) {
      throw new Error(`Event ${eventId} not found`);
    }

    const eventData = eventSnap.data();
    const ticketTypes: any[] = eventData.ticketTypes ?? eventData.ticketTiers ?? [];

    const updatedTiers = ticketTypes.map((tier: any) => {
      const match = tiers.find((t) => t.tierId === tier.id);
      if (!match) return tier;
      return {
        ...tier,
        quantitySold: Math.max(0, (tier.quantitySold ?? tier.sold ?? 0) - match.quantity),
        sold: Math.max(0, (tier.sold ?? tier.quantitySold ?? 0) - match.quantity),
      };
    });

    transaction.update(eventRef, {
      ticketTypes: updatedTiers,
      ticketTiers: updatedTiers,
    });
  });

  logger.log(`🎟️ Ticket inventory restored for event: ${eventId}`);
}

/**
 * Check if sufficient tickets are available (read-only, no lock).
 * Returns an array of unavailable tiers (empty means all available).
 */
export async function checkAvailability(
  eventId: string,
  tiers: TicketTierUpdate[]
): Promise<{ tierId: string; tierName: string; available: number; requested: number }[]> {
  const eventSnap = await getDoc(doc(getDb(), EVENTS_COLLECTION, eventId));
  if (!eventSnap.exists()) {
    throw new Error(`Event ${eventId} not found`);
  }

  const eventData = eventSnap.data();
  // DEBUG: Log the entire structure to check for corruption
  console.log('Available Ticket Types Raw:', eventData.ticketTypes);
  console.log('Legacy Ticket Tiers Raw:', eventData.ticketTiers);
  console.log('Full Event Data:', eventData);

  const ticketTypes: any[] = eventData.ticketTypes || eventData.ticketTiers || [];
  const unavailable: { tierId: string; tierName: string; available: number; requested: number }[] = [];

  for (const { tierId, quantity } of tiers) {
    // Try to find by ID
    let tier = ticketTypes.find((t: any) => t.id === tierId);
    
    // If not found by ID, try finding by name (fallback)
    if (!tier) {
         tier = ticketTypes.find((t: any) => t.name === tierId);
    }

    if (!tier) {
      // Still not found? Maybe the data structure is different? 
      // Try finding where 'tierId' matches (sometimes stored as just 'id')
      tier = ticketTypes.find((t: any) => t.tierId === tierId);
    }

    if (!tier) {
      // Still not found? Log warning and mark unavailable
      logger.warn(`Tier not found: ${tierId} in event ${eventId}. Available tiers: ${ticketTypes.map((t:any) => t.id || t.name).join(', ')}`);
      // Use a more descriptive name if possible, otherwise use ID
      unavailable.push({ 
        tierId, 
        tierName: `Unknown Tier (${tierId})`, 
        available: 0, 
        requested: quantity 
      });
      continue;
    }

    const available =
      (tier.quantityAvailable ?? tier.quantity ?? 0) -
      (tier.quantitySold ?? tier.sold ?? 0);
    
    if (available < quantity) {
      unavailable.push({
        tierId,
        tierName: tier.name || tierId,
        available: Math.max(0, available),
        requested: quantity,
      });
    }
  }

  return unavailable;
}
