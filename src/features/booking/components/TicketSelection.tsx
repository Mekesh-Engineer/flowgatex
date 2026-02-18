import { Box, Typography, Button, Stack } from '@mui/material';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { TicketTier } from '@/features/events/types/event.types';

interface TicketSelectionProps {
  tiers: TicketTier[];
  onAddToCart: (tierId: string, tierName: string, price: number, quantity: number) => void;
}

function TicketSelection({ tiers, onAddToCart }: TicketSelectionProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (tierId: string, delta: number, maxAvailable: number) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const newValue = Math.max(0, Math.min(current + delta, maxAvailable, 10));
      return { ...prev, [tierId]: newValue };
    });
  };

  const handleAddToCart = (tier: TicketTier) => {
    const qty = quantities[tier.id] || 0;
    if (qty > 0) {
      onAddToCart(tier.id, tier.name, tier.price, qty);
      setQuantities((prev) => ({ ...prev, [tier.id]: 0 }));
    }
  };

  /** Compute available count defensively: use 'available' field, or derive from quantity - sold */
  const getAvailable = (tier: TicketTier) =>
    tier.available ?? Math.max(0, (tier.quantity ?? 0) - (tier.sold ?? 0));

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Select Tickets
      </Typography>

      <Stack spacing={2}>
        {tiers.map((tier) => {
          const quantity = quantities[tier.id] || 0;
          const tierAvailable = getAvailable(tier);
          const isAvailable = tierAvailable > 0;

          return (
            <Box
              key={tier.id}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isAvailable ? 'divider' : 'error.main',
                opacity: isAvailable ? 1 : 0.6,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography fontWeight={600}>{tier.name}</Typography>
                  {tier.description && (
                    <Typography variant="body2" color="text.secondary">
                      {tier.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {tierAvailable} available
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary.main">
                  {formatCurrency(tier.price)}
                </Typography>
              </Box>

              {isAvailable ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => updateQuantity(tier.id, -1, tierAvailable)}
                      disabled={quantity === 0}
                      sx={{ minWidth: 36 }}
                    >
                      <Minus size={16} />
                    </Button>
                    <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                      {quantity}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => updateQuantity(tier.id, 1, tierAvailable)}
                      disabled={quantity >= tierAvailable || quantity >= 10}
                      sx={{ minWidth: 36 }}
                    >
                      <Plus size={16} />
                    </Button>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAddToCart(tier)}
                    disabled={quantity === 0}
                  >
                    Add to Cart
                  </Button>
                </Box>
              ) : (
                <Typography color="error.main" fontWeight={500}>
                  Sold Out
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default TicketSelection;
