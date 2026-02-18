# FlowGateX — User Booking Documentation

> Complete reference for the event booking system covering the end-to-end flow from event discovery through ticket purchase, QR code generation, and ticket management.

---

## Table of Contents

1. [Overview](#overview)
2. [Booking Flow Summary](#booking-flow-summary)
3. [Stage-by-Stage Walkthrough](#stage-by-stage-walkthrough)
4. [Cart System](#cart-system)
5. [Payment Processing](#payment-processing)
6. [Ticket Generation & QR Codes](#ticket-generation--qr-codes)
7. [Post-Booking Management](#post-booking-management)
8. [Data Models](#data-models)
9. [Service Layer](#service-layer)
10. [Known Issues & Limitations](#known-issues--limitations)

---

## Overview

The FlowGateX booking engine handles the complete lifecycle of event ticket purchases. It uses **atomic Firestore transactions** to prevent overselling, **SHA-256 signed QR codes** for tamper-proof tickets, and **real-time cart synchronization** across devices via Zustand + Firestore.

**Key Technologies:**

- **State Management:** Zustand (persisted to localStorage + Firestore)
- **Payment Gateway:** Razorpay (primary), Cashfree (secondary)
- **QR Generation:** `qrcode.react` library
- **PDF Export:** `jspdf` + `html2canvas`
- **Form Validation:** React Hook Form + Zod

---

## Booking Flow Summary

```
Discovery → Select Event → Choose Tickets → Add to Cart → Checkout → Payment → Confirmation → QR Ticket
```

### Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Events Page  │────→│ Event Detail │────→│   Cart Page  │
│ /events      │     │ /events/:id  │     │ /cart        │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                    Quick Book Modal          ┌────▼────┐
                    (Express Path)           │ Checkout │
                            │                │ /checkout│
                            │                └────┬─────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Payment    │────→│   Success    │
                     │  (Razorpay)  │     │ /booking-    │
                     └──────────────┘     │  success     │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │  My Tickets  │
                                          │ /my-tickets  │
                                          └──────────────┘
```

---

## Stage-by-Stage Walkthrough

### Stage 1: Event Discovery (`/events`)

**Component:** `EventsPage.tsx` → `EventGrid.tsx` → `EventCard.tsx`

Users browse events through a responsive grid layout with filtering capabilities.

**Filter Options:**

| Filter       | Type         | Options                          |
| ------------ | ------------ | -------------------------------- |
| Category     | Multi-select | 12 event categories              |
| Date Range   | Date picker  | Start/end date                   |
| Price Range  | Slider       | Min/max price                    |
| Location     | Text input   | City or venue                    |
| Format       | Select       | Single-day, multi-day, recurring |
| Availability | Toggle       | Hide sold-out events             |

**Search:** Fuzzy search powered by Fuse.js across event titles, descriptions, and tags.

**Event Card Information:**

- Cover image thumbnail
- Title (truncated at 50 characters)
- Date & time formatted as "MMM DD, YYYY • HH:MM AM/PM"
- Venue name with location icon
- Category badge
- Starting price (e.g., "From ₹499")
- Capacity indicator (progress bar)
- Two action buttons: "View Details" and "Book Now"

---

### Stage 2: Event Details (`/events/:id`)

**Component:** `EventDetailsPage.tsx` → `EventDetails.tsx`

**Sections:**

| Tab          | Content                                         |
| ------------ | ----------------------------------------------- |
| **Overview** | Description, highlights, organizer info, agenda |
| **Venue**    | Google Maps embed, address, parking, transport  |
| **Speakers** | Speaker profiles, bio, session topics           |
| **Tickets**  | Available tiers with pricing and availability   |

**Actions Available:**

- Add to favorites (heart icon)
- Share event (WhatsApp, Facebook, Twitter, LinkedIn)
- Add to calendar (.ics download)
- Select ticket tier and quantity
- Add to cart

---

### Stage 3: Ticket Selection

**Component:** `TicketSelection.tsx`

Users select from available ticket tiers:

```
┌────────────────────────────────────────┐
│ 🎫 General Admission         ₹499     │
│    Available: 156/300                   │
│    Sale ends: Mar 15, 2026              │
│    [−] 1 [+]          [Add to Cart]    │
├────────────────────────────────────────┤
│ 🎫 VIP Access                ₹1,499   │
│    Available: 23/50                     │
│    Sale ends: Mar 10, 2026              │
│    [−] 1 [+]          [Add to Cart]    │
├────────────────────────────────────────┤
│ 🎫 Backstage Pass            ₹4,999   │
│    Available: 5/10                      │
│    SELLING FAST!                        │
│    [−] 1 [+]          [Add to Cart]    │
└────────────────────────────────────────┘
```

**Validation Rules:**

- Minimum quantity: 1
- Maximum quantity: limited by `availableCount` and per-user limits
- Sale window check: tickets only purchasable within defined sale dates
- Sold-out tiers are displayed but disabled

---

### Stage 4: Cart Management (`/cart`)

**Component:** `CartPage.tsx` → `Cart.tsx`

**Features:**

- View all items with event details and ticket tier
- Update quantity per item
- Remove items
- Apply promo code
- View price breakdown (subtotal, discount, tax, service fee, total)
- Cart persistence: Zustand store synced to Firestore via `useCartSync` hook

**Cart Item Data:**

```typescript
interface CartItem {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventImage: string;
  venue: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
  addedAt: string;
  availableCount: number;
  originalPrice: number;
}
```

**Promo Code Application:**

1. User enters promo code
2. `promoService.validatePromoCode(code, eventId)` checks validity
3. If valid: discount applied (percentage or flat), shown in price breakdown
4. If invalid: error toast with reason (expired, max uses, wrong event)

---

### Stage 5: Checkout (`/checkout`)

**Component:** `CheckoutPage.tsx` → `Checkout.tsx`

**Checkout Steps:**

1. **Review Order** — Final item review with pricing
2. **Attendee Details** — Name, email, phone for each ticket
3. **Payment Method** — Select Razorpay or Cashfree
4. **Confirm** — Final confirmation before payment

**Price Breakdown:**

```
Subtotal:           ₹2,997.00
Promo (SAVE20):    -₹599.40
Service Fee:         ₹36.00  (₹12 × 3 tickets)
Tax (GST 18%):      ₹431.57
─────────────────────────────
Total:             ₹2,865.17
```

---

### Stage 6: Payment Processing

**Primary Gateway:** Razorpay (client-side checkout)

**Payment Flow:**

```
User clicks "Pay Now" →
  Razorpay checkout modal opens →
    User completes payment (card/UPI/netbanking/wallet) →
      Razorpay returns payment response →
        Frontend verifies payment signature →
          Cloud Function validates server-side →
            If success: Create booking + tickets
            If failure: Show error, allow retry
```

**Fallback:** If Razorpay is unavailable, Cashfree is used as secondary gateway. In development mode (`VITE_MOCK_MODE=true`), a mock payment service simulates the flow.

---

### Stage 7: Booking Confirmation (`/booking-success`)

**Component:** `BookingSuccessPage.tsx`

**On successful payment:**

1. **Booking created** in Firestore `bookings` collection
2. **Transaction recorded** in `transactions` collection
3. **Tickets generated** in `tickets` collection with QR codes
4. **Inventory decremented** atomically in Firestore transaction
5. **Confirmation page** displayed with canvas confetti animation

**Displayed Information:**

- Booking ID and status
- Event details summary
- Payment receipt
- QR code tickets (downloadable)
- Add to calendar button
- Share booking button

---

## Cart System

### State Architecture

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│ Zustand Cart│◄──►│ localStorage │    │   Firestore    │
│    Store    │    │ (persistence)│    │  cart/{uid}    │
└──────┬──────┘    └──────────────┘    └───────┬────────┘
       │                                        │
       └────────────────────────────────────────┘
              useCartSync (bidirectional)
```

**Sync Logic (`useCartSync` hook):**

- On mount: Load cart from Firestore → merge with local state
- On local change: Debounce 500ms → write to Firestore
- On Firestore change: Update Zustand store (skip if source is self)
- Prevents infinite sync loops with source tracking

### Cart Store Actions

| Action                                 | Description                              |
| -------------------------------------- | ---------------------------------------- |
| `addItem(item)`                        | Add item or increment quantity if exists |
| `removeItem(eventId, tierId)`          | Remove specific item                     |
| `updateQuantity(eventId, tierId, qty)` | Set quantity                             |
| `clearCart()`                          | Empty entire cart                        |
| `setPromoCode(code, discount)`         | Apply promo discount                     |
| `getTotalItems()`                      | Computed: total ticket count             |
| `getTotalPrice()`                      | Computed: total before discounts         |

---

## Ticket Generation & QR Codes

### QR Code Structure

Each ticket contains a SHA-256 signed QR code with the following payload:

```json
{
  "ticketId": "tkt_abc123",
  "userId": "user_xyz789",
  "eventId": "evt_def456",
  "transactionId": "txn_ghi012",
  "bookingId": "bkg_jkl345",
  "timestamp": "2026-02-17T10:30:00.000Z",
  "gateAccessLevel": 1
}
```

**Encoding:** Payload → JSON.stringify → SHA-256 hash appended → Base64 encode → QR code render

**Verification at gate:**

1. QR scanned by ESP32-CAM or web scanner
2. Base64 decoded
3. SHA-256 signature verified
4. Ticket status checked in Firestore (unused → valid)
5. If valid: ticket marked as `used`, gate opens
6. If already used: rejected with first-scan timestamp

### Ticket PDF Export

Users can download tickets as PDF using `jspdf` + `html2canvas`:

- Event name and details
- QR code image
- Ticket tier and price
- Booking reference number
- Attendee name

---

## Post-Booking Management

### My Tickets Page (`/my-tickets`)

**Component:** `MyTicketsPage.tsx`

- View all purchased tickets
- Filter by upcoming/past/cancelled
- Download individual ticket PDFs
- View QR codes

### Ticket Detail Page (`/tickets/:ticketId`)

**Component:** `TicketDetailPage.tsx`

- Full ticket details with large QR code
- Event information
- Booking and payment reference
- Check-in status

### My Bookings Page (`/dashboard/bookings`)

**Component:** `MyBookingsPage.tsx`

- View booking history with status
- Filter by status (confirmed, cancelled, refunded)
- Request refund (if eligible)
- View transaction details

### Refund Process

```
User requests refund →
  refundService.checkEligibility(bookingId) →
    If eligible (within refund window, event not started):
      Confirmation dialog →
        refundService.processRefund(bookingId) →
          Booking status → 'refunded'
          Transaction status → 'refunded'
          Tickets invalidated
          Inventory restored (atomic)
          Refund initiated to payment gateway
    If not eligible:
      Show reason (past refund window, event completed)
```

---

## Data Models

### Booking

```typescript
interface Booking {
  id: string;
  userId: string;
  eventId: string;
  tickets: BookingTicket[];
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  serviceFee: number;
  finalAmount: number;
  promoCode?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Ticket

```typescript
interface Ticket {
  id: string;
  bookingId: string;
  eventId: string;
  userId: string;
  tierId: string;
  tierName: string;
  price: number;
  qrCode: string; // Base64 encoded QR payload
  status: 'valid' | 'used' | 'cancelled' | 'expired';
  checkedInAt?: Timestamp;
  attendeeName: string;
  attendeeEmail: string;
  createdAt: Timestamp;
}
```

### Transaction

```typescript
interface Transaction {
  id: string;
  bookingId: string;
  userId: string;
  eventId: string;
  amount: number;
  currency: string;
  gateway: 'razorpay' | 'cashfree' | 'mock';
  gatewayTransactionId: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  serviceFee: number;
  taxAmount: number;
  createdAt: Timestamp;
}
```

---

## Service Layer

### Booking Service (`src/features/booking/services/bookingService.ts`)

| Method                     | Description                                |
| -------------------------- | ------------------------------------------ |
| `createBooking(data)`      | Create booking with atomic inventory check |
| `getBooking(bookingId)`    | Fetch booking by ID                        |
| `getUserBookings(userId)`  | List user's bookings                       |
| `cancelBooking(bookingId)` | Cancel a booking                           |

### Cart Service (`src/features/booking/services/cartService.ts`)

| Method                               | Description              |
| ------------------------------------ | ------------------------ |
| `syncCartToFirestore(userId, items)` | Write cart to Firestore  |
| `getCartFromFirestore(userId)`       | Read cart from Firestore |
| `clearFirestoreCart(userId)`         | Clear remote cart        |

### Inventory Service (`src/features/booking/services/inventoryService.ts`)

| Method                                    | Description                       |
| ----------------------------------------- | --------------------------------- |
| `checkAvailability(eventId, tierId, qty)` | Check ticket availability         |
| `reserveTickets(eventId, tierId, qty)`    | Atomically decrement inventory    |
| `releaseTickets(eventId, tierId, qty)`    | Restore inventory on cancellation |

### Ticket Service (`src/features/booking/services/ticketService.ts`)

| Method                     | Description                           |
| -------------------------- | ------------------------------------- |
| `generateTickets(booking)` | Create ticket documents with QR codes |
| `getTicket(ticketId)`      | Fetch ticket by ID                    |
| `getUserTickets(userId)`   | List user's tickets                   |
| `validateTicket(ticketId)` | Server-side ticket validation         |
| `markAsUsed(ticketId)`     | Mark ticket as used (check-in)        |

### Promo Service (`src/features/booking/services/promoService.ts`)

| Method                             | Description             |
| ---------------------------------- | ----------------------- |
| `validatePromoCode(code, eventId)` | Check promo validity    |
| `applyPromoCode(code, bookingId)`  | Apply promo to booking  |
| `incrementUsage(code)`             | Track promo usage count |

### Transaction Service (`src/features/booking/services/transactionService.ts`)

| Method                        | Description                     |
| ----------------------------- | ------------------------------- |
| `createTransaction(data)`     | Record payment transaction      |
| `getTransaction(txnId)`       | Fetch transaction details       |
| `getUserTransactions(userId)` | List user's transaction history |

### Refund Service (`src/features/booking/services/refundService.ts`)

| Method                        | Description                    |
| ----------------------------- | ------------------------------ |
| `checkEligibility(bookingId)` | Check if booking is refundable |
| `processRefund(bookingId)`    | Execute refund cascade         |

---

## Known Issues & Limitations

| Issue                  | Details                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| Cart expiry            | Cart items don't auto-expire; stale availability data possible           |
| Multi-device sync race | Rapid edits on multiple devices may cause brief inconsistencies          |
| Partial refunds        | Full refund only; partial refund per ticket not yet supported            |
| Payment retry          | If payment fails mid-flow, inventory reservation may need manual release |
| Offline booking        | Booking requires network; no offline queue for purchases                 |
| Currency               | Only INR (₹) supported; multi-currency planned                           |
| Waitlist               | Basic capacity tracking exists but full waitlist flow is not implemented |
