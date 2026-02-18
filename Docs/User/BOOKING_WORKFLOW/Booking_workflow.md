# FlowGateX Event Ticket Booking Engine — Complete User Workflow

## 🎫 End-to-End Booking Journey: From Discovery to Ticket Generation

---

## **WORKFLOW OVERVIEW**

This document outlines the complete user flow for the FlowGateX event ticket booking system, from initial event discovery through ticket purchase, payment processing, and final QR code ticket generation with Supabase persistence.

**Key Workflow Stages:**

1. Event Catalog & Discovery
2. Event Selection (Two Pathways)
3. Cart Management
4. Checkout & Order Summary
5. Promo Code Application
6. Payment Processing (Cashfree Integration)
7. Transaction Verification
8. Ticket Generation & QR Encoding
9. Ticket Storage & Retrieval (Supabase)

---

## **STAGE 1: EVENT CATALOG PAGE — Entry Point**

### **Page Components:**

**Event Ticket Cards Display:**

- **Layout:** Grid view (responsive: 3 columns desktop, 2 tablet, 1 mobile)
- **Card Information:**
  - Event cover image (optimized thumbnail)
  - Event title (truncated at 50 characters)
  - Event date & time (formatted: "MMM DD, YYYY • HH:MM AM/PM")
  - Venue name with location icon
  - Category badge (e.g., Music, Sports, Conference)
  - Available ticket tiers (count display: "3 tiers available")
  - Starting price (e.g., "From ₹499")
  - Capacity indicator (visual progress bar: "234/300 booked")

**Interactive Elements on Each Card:**

- **Hover Effect:** Card elevation with shadow, slight scale (1.02x)
- **Favorite Icon:** Heart icon (top-right corner) to save event to wishlist
- **"Sold Out" Overlay:** Grayed out with "SOLD OUT" badge if capacity reached

**Two Action Buttons per Card:**

### **BUTTON 1: "View Details"**

- **Visual Style:** Secondary button (outlined, cyan border)
- **Position:** Bottom-left of card
- **Icon:** Eye icon + "View Details" text
- **Function:** Navigates to full event detail page

### **BUTTON 2: "Book Now"**

- **Visual Style:** Primary button (solid cyan background, white text)
- **Position:** Bottom-right of card
- **Icon:** Ticket icon + "Book Now" text
- **Function:** Opens quick booking modal (for express checkout)

---

## **STAGE 2A: PATHWAY 1 — View Details → Event Detail Page**

### **Navigation:**

User clicks **"View Details"** button → Smooth page transition to Event Detail Page

### **Event Detail Page Components:**

**Hero Section:**

- **Large Cover Image/Video:** Full-width banner (aspect ratio 16:9)
- **Event Title:** H1 heading with gradient text effect
- **Breadcrumb Navigation:** Home > Events > [Category] > [Event Name]
- **Share Buttons:** Social media sharing (WhatsApp, Facebook, Twitter, LinkedIn)
- **Add to Calendar:** .ics file download button

**Event Information Tabs:**

1. **Overview Tab:**
   - Event description (rich text with formatting)
   - Event highlights (bullet points)
   - Organizer information with avatar and bio
   - Event agenda/schedule (timeline visualization)

2. **Venue Tab:**
   - Embedded Google Maps with venue location
   - Venue name and full address
   - Nearby landmarks
   - Parking information
   - Public transport options

3. **Speakers/Performers Tab:** (if applicable)
   - Speaker/performer profiles with photos
   - Bio and credentials
   - Session topics

4. **Gallery Tab:**
   - Event images (lightbox gallery)
   - Previous event highlights
   - Venue photos

**Ticket Tiers Section:**

- **Display:** Card-based layout for each tier
- **Tier Information per Card:**
  - Tier name (e.g., "VIP Pass", "General Admission", "Student Discount")
  - Price (large, bold: ₹1,499)
  - Original price (if discounted, strikethrough: ~~₹2,000~~)
  - Discount badge (e.g., "25% OFF")
  - Benefits/inclusions list (checkmark icons)
    - Access level (e.g., "Front Row Seating")
    - Perks (e.g., "Meet & Greet Pass")
    - Food/beverage inclusion
  - Quantity available (e.g., "47 tickets left")
  - Sale period (if limited time offer)
  - Quantity selector (dropdown: 1-10 tickets per purchase)

**Prominent "Book Now" Button:**

- **Position:** Sticky floating action button (bottom-right corner on scroll)
- **Styling:** Large, pulsing cyan button with ticket icon
- **Text:** "Book Now" or "Add to Cart"
- **Behavior:** Opens ticket tier selection modal (if not already selected) or directly adds selected tier to cart

**Additional Detail Page Elements:**

- **Reviews & Ratings:** Star rating system with user reviews
- **FAQs:** Accordion-style frequently asked questions
- **Terms & Conditions:** Link to booking policies, cancellation terms
- **Related Events:** Horizontal scrollable carousel of similar events

### **Action: User Clicks "Book Now" on Detail Page**

**Trigger:** Book button clicked with selected ticket tier and quantity

**Process:**

1. **Validation Check:**
   - Verify tier availability (check against current Supabase inventory)
   - Validate quantity (max 10 per transaction)
   - Check if user is authenticated (if not, prompt login/signup)

2. **Cart Addition:**
   - Create cart item object:
     ```javascript
     {
       cartItemId: generateUniqueId(),
       eventId: "event_123",
       eventTitle: "Tech Summit 2026",
       eventDate: "2026-03-15T10:00:00Z",
       ticketTierId: "tier_456",
       tierName: "VIP Pass",
       quantity: 2,
       pricePerTicket: 1499,
       subtotal: 2998,
       eventImage: "url_to_thumbnail",
       addedAt: timestamp,
       userId: currentUser.id
     }
     ```

3. **State Management:**
   - Add item to Zustand cart store (local state)
   - Sync to Supabase `cart` table (cloud persistence)
   - Update cart badge counter in navigation bar

4. **User Feedback:**
   - **Success Toast Notification:**
     - Position: Top-right corner
     - Message: "✓ 2x VIP Pass added to cart"
     - Duration: 3 seconds
     - Action button: "View Cart" (optional)
   - **Cart Icon Animation:** Badge number increments with bounce effect
   - **Haptic Feedback:** (mobile) Brief vibration

5. **Cart Persistence:**
   - Item remains in cart across sessions (Supabase sync)
   - Expires after 15 minutes of inactivity (inventory hold released)
   - User notified if inventory changes while in cart

---

## **STAGE 2B: PATHWAY 2 — Direct Book from Catalog Page**

### **User Action:**

User clicks **"Book Now"** button directly on event card in catalog page

### **Quick Booking Modal:**

**Modal Popup (Overlay):**

- **Backdrop:** Semi-transparent dark overlay (80% opacity)
- **Modal Size:** 600px width (responsive on mobile: full-width)
- **Close Options:** X button (top-right) or click outside modal

**Modal Content:**

1. **Event Summary Section:**
   - Event thumbnail image (150x150px)
   - Event title
   - Date, time, venue (condensed)

2. **Ticket Tier Selection:**
   - **Radio Button List:** Select one tier
   - For each tier:
     - Tier name with icon
     - Price display
     - Brief benefits summary (collapsed, expandable)
     - Quantity available indicator
   - **"View Full Details" Link:** Opens event detail page in new tab

3. **Quantity Selector:**
   - **Dropdown or Stepper:** Select quantity (1-10)
   - **Real-time Price Update:** Subtotal updates on quantity change
   - **Availability Check:** "Only 5 tickets left!" warning if low stock

4. **Quick Summary:**
   - Selected tier name
   - Quantity: 2x
   - Subtotal: ₹2,998

5. **Action Buttons:**
   - **"Add to Cart" (Primary):** Same process as Pathway 1 (cart addition)
   - **"Cancel" (Secondary):** Close modal without action

### **After Adding to Cart (Same as Pathway 1):**

- Success toast notification
- Cart badge update
- Item synced to Supabase
- Modal auto-closes after 1 second

---

## **STAGE 3: CART MANAGEMENT**

### **Accessing the Cart:**

**User Navigation:**

- Click cart icon in navigation bar (top-right)
- Or click "View Cart" from toast notification
- Or navigate via "Cart" menu item

### **Cart Page Components:**

**Page Layout:** Two-column layout (desktop), single column (mobile)

**LEFT COLUMN: Cart Items List**

**For Each Cart Item Card:**

**Item Display:**

- **Event Thumbnail:** 120x120px image (left side)
- **Event Information:**
  - Event title (clickable → redirects to event detail page)
  - Date & time
  - Venue name
  - Tier name with badge (e.g., "VIP Pass")
  - Price per ticket: ₹1,499

**Quantity Adjustment:**

- **Stepper Controls:**
  - Minus button (-)
  - Current quantity (editable number input)
  - Plus button (+)
- **Constraints:**
  - Minimum: 1 (if user tries to reduce below 1, trigger delete confirmation)
  - Maximum: 10 or remaining availability, whichever is lower
- **Real-time Updates:**
  - Subtotal recalculates on quantity change
  - Supabase cart record updates
  - Inventory hold adjusts (release/reserve additional tickets)

**Item Actions:**

- **Delete/Remove Button:**
  - Icon: Trash bin
  - Confirmation modal: "Remove [Event Name] from cart?"
  - On confirm: Remove from Zustand store + Supabase, release inventory hold

**Item Status Indicators:**

- **"Low Stock" Warning:** (if availability < quantity selected)
  - Banner: "⚠️ Only 3 tickets left! Reduce quantity or complete checkout soon."
- **"Price Changed" Alert:** (if event price updated since adding to cart)
  - Banner: "ℹ️ Price updated from ₹1,499 to ₹1,299. You save ₹400!"
- **"Expired" Error:** (if inventory hold expired)
  - Banner: "❌ Item expired. Availability may have changed. Please re-add to cart."

**Empty Cart State:**

- Illustration: Empty shopping cart image
- Message: "Your cart is empty"
- Call-to-action: "Browse Events" button → redirects to catalog

**RIGHT COLUMN: Order Summary (Sticky Sidebar)**

**Summary Breakdown:**

1. **Items List (Condensed):**
   - Event name x Quantity: ₹Subtotal
   - Example: "Tech Summit 2026 x 2: ₹2,998"

2. **Pricing Calculation:**

   ```
   Subtotal:              ₹2,998
   Service Fee (@₹1/ticket): ₹2
   ─────────────────────────────
   Total:                 ₹3,000
   ```

3. **Promo Code Section:**
   - **Input Field:** "Enter promo code"
   - **Apply Button:** Validates and applies discount
   - **Success/Error Messages:**
     - Success: "✓ Code 'SUMMER20' applied! -₹600 discount"
     - Error: "❌ Invalid code" or "Code expired" or "Minimum order ₹5,000 required"
   - **Discount Display (if applied):**
     ```
     Subtotal:              ₹2,998
     Service Fee:               ₹2
     Promo Discount (20%):   -₹600
     ─────────────────────────────
     Total:                 ₹2,400
     ```

4. **Total Amount (Large, Bold):**
   - Highlighted in cyan color
   - Font size: 32px

5. **"Proceed to Checkout" Button:**
   - **Style:** Large primary button (full-width, cyan)
   - **Text:** "Proceed to Checkout" with arrow icon
   - **Disabled State:** If cart empty or validation errors

**Cart Expiration Timer:**

- **Countdown Display:** "Items reserved for 14:32 minutes"
- **Visual:** Circular progress indicator (depleting)
- **Warning at 5 minutes:** Color changes to red, pulsing animation
- **On Expiration:** Auto-remove items, show modal: "Cart expired. Items released."

**Save for Later Feature:**

- **"Save for Later" Link:** Below checkout button
- **Functionality:** Moves items to wishlist, releases inventory hold
- **Restoration:** User can move back to cart from wishlist

---

## **STAGE 4: CHECKOUT PAGE**

### **Navigation:**

User clicks **"Proceed to Checkout"** → Redirected to `/checkout` route

**Security Check:**

- User must be authenticated (login enforced)
- Cart must have at least 1 item
- All items must pass availability validation

### **Checkout Page Structure:**

**Three-Step Progress Indicator (Top of Page):**

1. **Review Cart** ← (You are here)
2. Payment
3. Confirmation

**Main Content: Two-Column Layout**

---

### **LEFT COLUMN: Checkout Form & Cart Review**

**Section 1: Cart Items Review**

**Purpose:** Final review before payment (read-only with edit capability)

**For Each Cart Item:**

- **Compact Display:**
  - Event thumbnail (80x80px)
  - Event title, date, tier
  - Quantity: [2x] (editable via inline stepper)
  - Subtotal: ₹2,998
- **Edit Actions:**
  - **Change Quantity:** Inline stepper (updates order summary live)
  - **Remove Item:** Trash icon (with confirmation)
- **Last Chance Warnings:**
  - "⚠️ Only 2 tickets left at this price!" (if low stock)

**Quick Actions:**

- **"Add More Events" Link:** Returns to catalog page (cart preserved)

---

**Section 2: Attendee Information Form**

**Purpose:** Collect user details for ticket generation and communication

**Form Fields:**

1. **Primary Contact (Pre-filled if user profile exists):**
   - Full Name\* (text input, validation: 2-50 chars)
   - Email Address\* (email input, validation: valid email format)
   - Phone Number\* (tel input with country code dropdown, validation: 10 digits)

2. **Ticket Distribution:**
   - **Option 1:** "All tickets for me" (default)
     - Uses primary contact info for all tickets
   - **Option 2:** "Assign tickets to different attendees"
     - Expands form to collect name + email for each ticket
     - Example: If 3 tickets, show 3 sub-forms

3. **Additional Information (Optional):**
   - Special Requests (textarea, max 500 chars)
   - Dietary Restrictions (if event includes food)
   - Accessibility Requirements

**Validation:**

- Real-time validation with error messages below fields
- All required fields marked with red asterisk (\*)
- Form cannot proceed if validation fails

---

**Section 3: Promo Code Application**

**Purpose:** Allow discount code entry/modification before payment

**Components:**

1. **Promo Code Input:**
   - **Input Field:** "Enter promo code" placeholder
   - **Apply Button:** Cyan button, "Apply Code"
   - **Clear Button:** (if code applied) "Remove" button

2. **Validation Flow:**

   ```
   User enters code → Click "Apply" → API call to Supabase
   → Check promo code validity:
      - Code exists?
      - Not expired?
      - Usage limit not reached?
      - Minimum order value met?
      - Applicable to selected events?
   → If valid: Apply discount, update order summary
   → If invalid: Show error message
   ```

3. **Promo Code Types & Behavior:**

   **Type A: Percentage Discount**
   - Example: "SUMMER20" = 20% off total
   - Calculation:
     ```
     Subtotal: ₹2,998
     Discount (20%): -₹600
     Service Fee: ₹2
     Total: ₹2,400
     ```

   **Type B: Flat Discount**
   - Example: "SAVE500" = ₹500 off
   - Calculation:
     ```
     Subtotal: ₹2,998
     Discount (Flat): -₹500
     Service Fee: ₹2
     Total: ₹2,500
     ```

   **Type C: 100% Discount (Free Ticket)**
   - Example: "EARLYBIRD100" = 100% off
   - **Special Rule:** Processing fee still applies
   - Calculation:
     ```
     Subtotal: ₹2,998
     Discount (100%): -₹2,998
     Service Fee: ₹1 (mandatory processing)
     Total: ₹1
     ```
   - **User Notification:**
     - Banner: "🎉 Free ticket applied! Pay only ₹1 processing fee."

   **Type D: Specific Event Free Ticket**
   - Example: "VIPFREE" = Free VIP pass for specific event only
   - Applies only to matching event in cart
   - Other items charged normally

4. **Applied Code Display:**
   - **Success Banner:** Green background
   - Code name in badge: "SUMMER20"
   - Discount amount: "You saved ₹600!"
   - **Remove Button:** X icon to clear code

5. **Code Restrictions Display:**
   - **Error Messages:**
     - "Code expired on Feb 10, 2026"
     - "Minimum order value: ₹5,000"
     - "Valid only for 'Music' category events"
     - "Maximum uses reached"
     - "Code not applicable to sale items"

---

**Section 4: Terms & Conditions Acceptance**

- **Checkbox:** "I agree to the [Terms & Conditions] and [Cancellation Policy]"
  - Links open modal/new tab with full terms
- **Required:** Cannot proceed without checking
- **GDPR Compliance Checkbox:** (if applicable)
  - "I consent to receiving event updates via email/SMS"

---

### **RIGHT COLUMN: Order Summary (Sticky)**

**Live-Updating Summary Panel**

**Header:** "Order Summary"

**Itemized Breakdown:**

1. **Events List:**

   ```
   Tech Summit 2026
   VIP Pass x 2                    ₹2,998

   Music Festival 2026
   General Admission x 1            ₹799
   ```

2. **Calculations:**

   ```
   Subtotal (3 tickets):         ₹3,797
   Service Fee (₹1 x 3):             ₹3
   ─────────────────────────────────────
   Subtotal before discount:     ₹3,800

   Promo Discount (SUMMER20):     -₹760
   ─────────────────────────────────────
   TOTAL AMOUNT:                 ₹3,040
   ```

3. **Special Cases:**

   **100% Discount Applied:**

   ```
   Subtotal:                     ₹2,998
   Promo Discount (100%):       -₹2,998
   Service Fee (Processing):        ₹1
   ─────────────────────────────────────
   TOTAL AMOUNT:                    ₹1
   ```

**Visual Highlights:**

- **Total Amount:** Large, bold, cyan color (48px font)
- **Savings Banner:** (if discount applied)
  - "🎉 You saved ₹760 on this order!"
  - Green background, prominent display

**Security Badges:**

- **Payment Security Icons:**
  - SSL Secure (padlock icon)
  - Cashfree badge
  - 256-bit encryption badge
- **Refund Policy Link:** "100% refund available" with info icon

**"Proceed to Payment" Button:**

- **Style:** Full-width, large, cyan primary button
- **Text:** "Pay ₹3,040" (dynamic amount)
- **Icon:** Lock icon + arrow
- **Disabled States:**
  - Gray out if form incomplete
  - Show tooltip: "Complete all required fields"

**Edit Cart Link:**

- Below payment button
- "← Back to Cart" (returns to cart page)

---

## **STAGE 5: PROMO CODE VALIDATION LOGIC (Detailed)**

### **Promo Code Data Structure (Supabase — `promo_codes` table):**

```javascript
{
  promo_code_id: "promo_abc123",
  code: "SUMMER20",
  type: "percentage", // or "flat", "free_ticket"
  value: 20, // 20% or ₹20 or 100 for free
  applicable_events: ["event_123", "event_456"], // empty = all events
  applicable_categories: ["Music", "Sports"], // empty = all categories
  applicable_tiers: ["tier_789"], // empty = all tiers
  min_order_value: 1000, // minimum ₹1000 order
  max_discount: 500, // cap discount at ₹500 (for percentage codes)
  max_uses: 100, // total usage limit
  uses_per_user: 1, // per-user limit
  current_uses: 47, // track usage
  valid_from: "2026-02-01T00:00:00Z",
  valid_until: "2026-02-28T23:59:59Z",
  active: true,
  exclude_sale_items: false, // cannot combine with already discounted items
  description: "20% off Summer Events",
  created_by: "admin_uid",
  created_at: timestamp
}
```

### **Validation Workflow:**

**Step 1: Code Lookup**

```javascript
// User enters: "SUMMER20"
const { data: promoData, error } = await supabase
  .from('promo_codes')
  .select('*')
  .eq('code', codeUppercase)
  .single();

if (error || !promoData) {
  return { valid: false, error: 'Invalid promo code' };
}
```

**Step 2: Active Status Check**

```javascript
if (!promoData.active) {
  return { valid: false, error: 'This promo code is no longer active' };
}
```

**Step 3: Date Validation**

```javascript
const now = new Date();
const validFrom = new Date(promoData.valid_from);
const validUntil = new Date(promoData.valid_until);

if (now < validFrom) {
  return { valid: false, error: `Code valid from ${validFrom.toLocaleDateString()}` };
}
if (now > validUntil) {
  return { valid: false, error: 'Code expired' };
}
```

**Step 4: Usage Limit Check**

```javascript
const { max_uses, current_uses } = promoData;
if (current_uses >= max_uses) {
  return { valid: false, error: 'Code usage limit reached' };
}
```

**Step 5: Per-User Usage Check**

```javascript
const { data: userUsage } = await supabase
  .from('promo_usage')
  .select('id')
  .eq('user_id', currentUser.id)
  .eq('promo_code_id', promoData.promo_code_id);

if (userUsage.length >= promoData.uses_per_user) {
  return { valid: false, error: "You've already used this code" };
}
```

**Step 6: Minimum Order Value Check**

```javascript
const cartSubtotal = calculateCartSubtotal(cartItems);
if (cartSubtotal < promoData.min_order_value) {
  return {
    valid: false,
    error: `Minimum order value: ₹${promoData.min_order_value}`,
  };
}
```

**Step 7: Event/Category Applicability Check**

```javascript
const { applicable_events, applicable_categories } = promoData;

if (applicable_events.length > 0) {
  const cartEventIds = cartItems.map(item => item.eventId);
  const hasApplicableEvent = cartEventIds.some(id => applicable_events.includes(id));

  if (!hasApplicableEvent) {
    return { valid: false, error: 'Code not applicable to selected events' };
  }
}

// Similar check for categories...
```

**Step 8: Calculate Discount**

```javascript
const { type, value, max_discount } = promoData;

let discountAmount = 0;

switch (type) {
  case 'percentage':
    discountAmount = (cartSubtotal * value) / 100;
    if (max_discount && discountAmount > max_discount) {
      discountAmount = max_discount;
    }
    break;

  case 'flat':
    discountAmount = Math.min(value, cartSubtotal);
    break;

  case 'free_ticket':
    if (value === 100) {
      discountAmount = cartSubtotal;
      // Service fee still applies (₹1 minimum)
    }
    break;
}

return {
  valid: true,
  discountAmount,
  finalTotal: cartSubtotal + serviceFee - discountAmount,
};
```

**Step 9: Apply to Order Summary**

- Update Zustand store with promo code details
- Recalculate order total
- Display success message with savings amount

**Step 10: Reserve Code (Prevent Concurrent Use)**

- Temporarily increment `current_uses` in Supabase
- If payment fails, decrement back
- If payment succeeds, finalize in `promo_usage` table

---

## **STAGE 6: PAYMENT PROCESSING (Cashfree Integration)**

### **User Action:**

User clicks **"Pay ₹3,040"** button on checkout page

### **Pre-Payment Validation:**

**Server-Side Checks (Supabase Edge Functions):**

1. **Revalidate Cart:**
   - Check inventory availability for all items
   - Verify prices haven't changed
   - Confirm promo code still valid

2. **User Authentication:**
   - Verify Supabase Auth JWT token
   - Check user account status (not suspended)

3. **Amount Verification:**
   - Recalculate total server-side
   - Match with client-sent amount (prevent tampering)

4. **Create Supabase Transaction Record:**
   ```javascript
   {
     transaction_id: "txn_xyz789",
     user_id: "user_abc123",
     items: [...cartItems],
     subtotal: 3797,
     service_fee: 3,
     promo_code: "SUMMER20",
     discount_amount: 760,
     total_amount: 3040,
     status: "pending",
     created_at: timestamp,
     payment_gateway: "cashfree"
   }
   ```

---

### **Cashfree SDK Initialization:**

**Step 1: Create Cashfree Order (Server-Side)**

```javascript
// Supabase Edge Function
const cashfreeResponse = await fetch('https://api.cashfree.com/pg/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  },
  body: JSON.stringify({
    order_id: transactionId,
    order_amount: 3040.0, // Amount in ₹
    order_currency: 'INR',
    customer_details: {
      customer_id: user.id,
      customer_name: user.displayName,
      customer_email: user.email,
      customer_phone: user.phone,
    },
    order_meta: {
      return_url: `https://flowgatex.com/payment/callback?order_id={order_id}`,
      notify_url: `https://flowgatex.com/api/cashfree/webhook`,
    },
    order_note: `Tickets for ${cartItems.length} event(s)`,
  }),
});

const cashfreeOrder = await cashfreeResponse.json();
// Return payment_session_id to client
return { paymentSessionId: cashfreeOrder.payment_session_id };
```

---

**Step 2: Launch Cashfree Checkout (Client-Side)**

```javascript
import { load } from '@cashfreepayments/cashfree-js';

const cashfree = await load({ mode: 'production' }); // or 'sandbox' for testing

const checkoutOptions = {
  paymentSessionId: paymentSessionId,
  returnUrl: `https://flowgatex.com/payment/callback?order_id=${transactionId}`,
  redirectTarget: '_modal', // Open as overlay modal
};

// Launch Cashfree Checkout
cashfree.checkout(checkoutOptions);
```

---

**Step 3: Cashfree Checkout Modal Experience**

**Modal Appearance:**

- **Overlay:** Dark backdrop covering entire page
- **Modal Size:** 500px width (responsive)
- **Header:** FlowGateX logo + "Secure Payment"
- **Amount Display:** Large, bold: ₹3,040
- **Order Details:** "3 tickets for 2 events"

**Payment Options:**

1. **UPI:**
   - Enter UPI ID (e.g., user@paytm)
   - Or scan QR code via UPI app
   - UPI Collect (push request to UPI app)
2. **Cards:**
   - Card number input (with Visa/Mastercard/Amex/RuPay logo detection)
   - Expiry date (MM/YY)
   - CVV
   - Cardholder name
   - "Save card for future" checkbox (tokenization)

3. **Net Banking:**
   - Bank selection dropdown (all major banks)
   - Redirect to bank portal

4. **Wallets:**
   - Paytm, PhonePe, Amazon Pay, etc.
   - One-click if wallet linked

5. **EMI:**
   - Available on select cards
   - Tenure selection (3/6/9/12 months)

6. **Buy Now Pay Later (BNPL):**
   - LazyPay, ZestMoney integration via Cashfree

**Security Indicators:**

- SSL padlock icon
- "Secured by Cashfree" badge
- PCI DSS compliant badge

**User Actions:**

- **"Pay Now" Button:** Submit payment
- **"Cancel" Button:** Close modal (payment not processed)

---

### **Payment Processing States:**

**State 1: Processing**

- **Display:** Loading spinner overlay on modal
- **Text:** "Processing payment... Please wait."
- **Duration:** 3-10 seconds (depends on payment method)
- **Backend:**
  - Cashfree verifies payment with bank/UPI
  - Transaction status tracked in real-time via webhooks

**State 2A: Payment Success**

- Cashfree redirects to return URL or triggers JS callback:
  ```javascript
  {
    order_id: "txn_xyz789",
    order_status: "PAID",
    payment_session_id: "session_abc456",
    cf_payment_id: "pay_abc456"
  }
  ```

**State 2B: Payment Failure**

- **Display:** Error screen within Cashfree modal
- **Message:** "Payment failed. Please try again."
- **Reasons:**
  - Insufficient funds
  - Bank declined
  - Incorrect card details
  - Transaction timeout
- **Action:** User can retry with different method or close modal

---

## **STAGE 7: PAYMENT VERIFICATION & TRANSACTION CONFIRMATION**

### **Post-Payment Workflow (After Cashfree Success):**

**Step 1: Payment Verification (Server-Side — Critical Security Step)**

**Purpose:** Prevent payment tampering/fake success responses

```javascript
// Supabase Edge Function: verifyCashfreePayment
const verifyResponse = await fetch(`https://api.cashfree.com/pg/orders/${orderId}/payments`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  },
});

const paymentData = await verifyResponse.json();

// Validate payment status server-side
if (paymentData[0]?.payment_status !== 'SUCCESS') {
  throw new Error('Payment verification failed');
}

// Payment verified → Proceed with booking
```

**Webhook Verification (Cashfree Webhook Signature):**

```javascript
// Validate incoming Cashfree webhook signature
const webhookSignature = request.headers['x-webhook-signature'];
const webhookTimestamp = request.headers['x-webhook-timestamp'];

const signedPayload = `${webhookTimestamp}${JSON.stringify(request.body)}`;
const expectedSignature = crypto
  .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
  .update(signedPayload)
  .digest('base64');

if (expectedSignature !== webhookSignature) {
  throw new Error('Webhook signature mismatch — potential fraud');
}
```

---

**Step 2: Update Transaction Status in Supabase**

```javascript
const { error } = await supabase
  .from('transactions')
  .update({
    status: 'completed',
    cashfree_order_id: orderId,
    cashfree_payment_id: paymentData[0].cf_payment_id,
    payment_method: paymentData[0].payment_method,
    paid_at: new Date().toISOString(),
    verified_at: new Date().toISOString(),
  })
  .eq('transaction_id', transactionId);
```

---

**Step 3: Generate Booking Record**

```javascript
const bookingId = generateUniqueId();

const { error } = await supabase.from('bookings').insert({
  booking_id: bookingId,
  user_id: user.id,
  transaction_id: transactionId,
  events: cartItems.map(item => ({
    eventId: item.eventId,
    eventTitle: item.eventTitle,
    eventDate: item.eventDate,
    tierId: item.ticketTierId,
    tierName: item.tierName,
    quantity: item.quantity,
    pricePerTicket: item.pricePerTicket,
  })),
  total_amount: finalTotal,
  status: 'confirmed',
  created_at: new Date().toISOString(),
});
```

---

**Step 4: Generate Individual Tickets (One per Ticket Purchased)**

**For Each Ticket:**

```javascript
for (let i = 0; i < cartItem.quantity; i++) {
  const ticketId = generateUniqueId();

  // Create QR code data payload
  const qrPayload = {
    ticketId,
    userId: user.id,
    eventId: cartItem.eventId,
    transactionId,
    bookingId,
    tierName: cartItem.tierName,
    attendeeName: attendeeInfo.name,
    attendeeEmail: attendeeInfo.email,
    eventDate: cartItem.eventDate,
    issuedAt: Date.now(),
    gateAccessLevel: cartItem.gateAccessLevel, // for IoT gate validation
  };

  // Generate cryptographic signature (SHA-256)
  const signature = await generateSHA256Hash(JSON.stringify(qrPayload));

  // Encode payload + signature as Base64
  const qrDataEncoded = btoa(
    JSON.stringify({
      ...qrPayload,
      signature,
    })
  );

  // Generate QR code image
  const qrCodeDataURL = await QRCode.toDataURL(qrDataEncoded, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Store ticket in Supabase
  await supabase.from('tickets').insert({
    ticket_id: ticketId,
    user_id: user.id,
    event_id: cartItem.eventId,
    booking_id: bookingId,
    transaction_id: transactionId,
    tier_id: cartItem.ticketTierId,
    tier_name: cartItem.tierName,
    attendee_name: attendeeInfo.name,
    attendee_email: attendeeInfo.email,
    qr_code_data: qrDataEncoded,
    qr_code_image: qrCodeDataURL, // Base64 image
    status: 'valid', // valid | used | cancelled | expired
    generated_at: new Date().toISOString(),
    expires_at: cartItem.eventDate, // Ticket expires after event
    regenerated_count: 0, // Track if user regenerates ticket
  });
}
```

---

**Step 5: Update Promo Code Usage (if applied)**

```javascript
if (promoCode) {
  // Increment usage counter
  await supabase.rpc('increment_promo_usage', { promo_id: promoCodeId });

  // Log user-specific usage
  await supabase.from('promo_usage').insert({
    user_id: user.id,
    promo_code_id: promoCodeId,
    transaction_id: transactionId,
    discount_amount: discountAmount,
    used_at: new Date().toISOString(),
  });
}
```

---

**Step 6: Update Event Inventory**

```javascript
// Decrement ticket availability for each tier using Supabase RPC
for (const item of cartItems) {
  await supabase.rpc('decrement_ticket_inventory', {
    p_event_id: item.eventId,
    p_tier_id: item.ticketTierId,
    p_quantity: item.quantity,
  });
}
```

---

**Step 7: Clear Cart**

```javascript
// Remove all items from user's cart in Supabase
await supabase.from('cart').delete().eq('user_id', user.id);

// Clear Zustand cart store
clearCart();
```

---

**Step 8: Send Confirmation Email (via Supabase Edge Functions + Resend/SendGrid)**

**Email Content:**

- **Subject:** "🎉 Booking Confirmed: [Event Name]"
- **Body:**
  - Booking confirmation message
  - Order summary (events, quantities, prices)
  - Total paid amount
  - QR code images attached (one per ticket)
  - "Add to Calendar" link
  - Event details (date, time, venue)
  - Cancellation policy link
  - Support contact information

**Attachment:** PDF ticket with QR code

---

**Step 9: Send SMS Confirmation (Optional — via Twilio/MSG91)**

```
FlowGateX: Booking confirmed! 3 tickets for Tech Summit 2026.
Total: ₹3,040
View tickets: https://flowgatex.com/bookings/bkg_123
```

---

## **STAGE 8: SUCCESS CONFIRMATION MODAL & CELEBRATION**

### **Client-Side Success Display:**

**After Payment Verification Completes:**

**Step 1: Close Cashfree Modal**

- Cashfree checkout auto-dismisses on successful payment and redirects to return URL

**Step 2: Trigger Canvas Confetti Animation**

```javascript
import confetti from 'canvas-confetti';

// Fire confetti from multiple points
confetti({
  particleCount: 150,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#00D4FF', '#6B4CE6', '#00FF88'],
});

// Additional bursts for extra celebration
setTimeout(() => {
  confetti({
    particleCount: 100,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
  });
  confetti({
    particleCount: 100,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
  });
}, 250);
```

**Confetti Animation Duration:** 3-5 seconds

---

**Step 3: Display Success Modal**

**Modal Overlay:**

- **Backdrop:** Semi-transparent with subtle blur effect
- **Modal Size:** 600px width (centered)
- **Animation:** Scale in with bounce effect

**Modal Content:**

**Header Section:**

- **Icon:** Large checkmark in circle (animated: scale + rotate)
  - Color: Neon green (#00FF88)
  - Size: 80x80px
- **Heading:** "🎉 Payment Successful!"
  - Font size: 36px, bold
  - Color: Cyan gradient

**Message Section:**

- **Text:** "Your booking is confirmed! Tickets have been sent to your email."
- **Booking Reference:**
  - "Booking ID: BKG-2026-A1B2C3"
  - Copy button (clipboard icon)

**Order Summary (Compact):**

```
Tech Summit 2026 (VIP Pass x 2)
Music Festival 2026 (GA x 1)
───────────────────────────────
Total Paid: ₹3,040
Payment ID: pay_abc456xyz789
```

**Ticket Preview:**

- **Mini QR Code Thumbnails:** 3 QR codes displayed (if 3 tickets purchased)
- **Hover:** Enlarge QR code preview

---

**Action Buttons (Primary Options):**

**Button 1: "View Tickets"**

- **Style:** Primary button (cyan, full-width on mobile)
- **Icon:** Ticket icon
- **Action:** Navigate to `/my-tickets` or `/bookings/[bookingId]`
- **Destination:** Ticket detail page with full QR codes

**Button 2: "Download Tickets (PDF)"**

- **Style:** Secondary button (outlined)
- **Icon:** Download icon
- **Action:** Trigger PDF generation with all QR codes
- **File Name:** `FlowGateX_Tickets_BKG-A1B2C3.pdf`
- **Content:** Professional PDF with:
  - Booking details
  - Each ticket on separate page
  - Large QR code (centered)
  - Ticket ID, attendee name, event details
  - Barcode backup (optional)
  - Terms & conditions footer

**Button 3: "Print Tickets"**

- **Style:** Secondary button
- **Icon:** Printer icon
- **Action:** Open browser print dialog with ticket page
- **Format:** Optimized print layout (one ticket per page)

---

**Additional Options (Links):**

**Link 1: "Add to Google Calendar"**

- **Icon:** Calendar icon
- **Action:** Generate .ics file with event details
- **Data Included:**
  - Event name, date, time
  - Venue address
  - Ticket details in description
  - Reminder set for 1 day before event

**Link 2: "Share on Social Media"**

- **Icons:** Twitter, Facebook, WhatsApp
- **Pre-filled Text:** "Just booked tickets for [Event Name] via FlowGateX! 🎉"
- **Privacy:** User controls sharing (opt-in)

**Link 3: "Continue Shopping"**

- Redirects to event catalog page
- Modal closes

**Close Button:**

- X icon (top-right corner)
- Or "Close" link at bottom

---

## **STAGE 9: TICKET STORAGE & RETRIEVAL (Supabase)**

### **Supabase Database Table Structure:**

**`tickets` Table:**

```
tickets
  - ticket_id: "tkt_xyz789"         (PK, text)
  - user_id: "user_abc123"           (FK → auth.users)
  - event_id: "event_456"            (FK → events)
  - booking_id: "bkg_123"            (FK → bookings)
  - transaction_id: "txn_789"        (FK → transactions)
  - tier_id: "tier_vip"              (FK → tiers)
  - tier_name: "VIP Pass"            (text)
  - attendee_name: "John Doe"        (text)
  - attendee_email: "john@ex.com"    (text)
  - qr_code_data: "base64_payload"   (text)
  - qr_code_image: "data:image/..."  (text)
  - status: "valid"                  (enum: valid|used|cancelled|expired)
  - generated_at: timestamp
  - used_at: null | timestamp
  - expires_at: timestamp
  - regenerated_count: 0             (integer)
  - event_title: "Tech Summit 2026"  (text)
  - event_date: timestamp
  - venue_name: "Convention Center"  (text)
  - venue_address: "123 Main St"     (text)
  - event_image: "url_to_image"      (text)
```

---

### **My Tickets Page (`/my-tickets`):**

**Purpose:** Central hub for users to view all their booked tickets

**Page Layout:**

**Header Section:**

- Page Title: "My Tickets"
- Filter Tabs:
  - **Upcoming** (default) — Events in the future, valid tickets
  - **Past** — Events that have occurred
  - **Cancelled** — Refunded or cancelled tickets
- Search Bar: "Search by event name"

**Ticket List View:**

**For Each Booking (Group by booking):**

**Booking Card:**

- **Booking Header:**
  - Booking ID (small, gray text)
  - Booking date (e.g., "Booked on Feb 12, 2026")
  - Total amount paid
  - Payment method badge (Cashfree logo)

**Event Information:**

- Event thumbnail image (left side)
- Event title (bold, large)
- Date & time with countdown (e.g., "In 23 days, 5 hours")
- Venue name with location icon
- Tier badge (e.g., "VIP Pass")

**Ticket Count:**

- "3 tickets" with icon

**Action Buttons:**

**Button 1: "View All Tickets"**

- **Expand/Collapse:** Shows all QR codes for this booking
- **Expanded View:**
  - **For Each Ticket in Booking:**
    - Ticket ID
    - Attendee name
    - Large QR code (300x300px)
    - Status badge (Valid/Used/Expired)
    - "Download" button (individual ticket PDF)
    - "Regenerate QR" button (if lost/compromised)
      - Creates new QR with new signature
      - Invalidates old QR
      - Increments `regenerated_count`

**Button 2: "Download All Tickets"**

- Downloads multi-page PDF with all tickets in booking

**Button 3: "Add to Calendar"**

- .ics file download

**Button 4: "Get Directions"**

- Opens Google Maps with venue address

**Ticket Status Indicators:**

**Status: "Valid" (Green)**

- ✓ Ready to use
- QR code is active

**Status: "Used" (Gray)**

- ✓ Already scanned at event entrance
- Timestamp: "Used on Mar 15, 2026 at 10:23 AM"
- Gate ID: "Gate 1 - Main Entrance"

**Status: "Expired" (Red)**

- Event date has passed
- QR code no longer valid

**Status: "Cancelled" (Orange)**

- Refund processed
- Ticket invalidated
- Refund amount displayed

---

### **Individual Ticket Detail Page (`/tickets/{ticketId}`):**

**Purpose:** Full-screen QR code display for scanning at venue

**Page Layout (Optimized for Mobile):**

**Full-Screen QR Code Display:**

- **QR Code:** Large, centered (80% of screen width)
- **Auto-Brightness:** Screen brightness auto-increases for better scanning
- **Keep Screen Awake:** Prevent auto-lock while on this page

**Ticket Information (Below QR):**

- Ticket ID (small text)
- Attendee name (bold)
- Event title
- Date & time
- Venue
- Tier name

**Status Banner (Top):**

- Color-coded based on ticket status
- Valid: Green banner ("✓ Valid Ticket")
- Used: Gray banner ("Already Scanned")
- Expired: Red banner ("Ticket Expired")

**Action Buttons (Bottom):**

- **"Download Ticket":** PDF download
- **"Share Ticket":** Generate shareable link (with privacy controls)
- **"Regenerate QR":** If compromised

**Offline Support:**

- Ticket data cached locally (service worker)
- QR code viewable without internet
- "Offline" indicator if no connection

---

### **QR Code Encoding Details:**

**QR Payload Structure:**

```javascript
{
  ticketId: "tkt_xyz789",
  userId: "user_abc123",
  eventId: "event_456",
  transactionId: "txn_789",
  bookingId: "bkg_123",
  tierName: "VIP Pass",
  attendeeName: "John Doe",
  attendeeEmail: "john@example.com",
  eventDate: "2026-03-15T10:00:00Z",
  issuedAt: 1707950400000, // Unix timestamp
  gateAccessLevel: 1, // 0=General, 1=VIP, 2=All-Access
  signature: "sha256_hash_of_above_fields"
}
```

**Encoding Process:**

1. Serialize payload to JSON string
2. Generate SHA-256 hash of payload (using crypto.subtle.digest)
3. Append signature to payload
4. Encode entire object as Base64 string
5. Generate QR code image from Base64 string

**Decoding Process (at IoT Gate):**

1. ESP32-CAM scans QR code
2. Decode Base64 string → JSON object
3. Extract signature
4. Recompute SHA-256 hash from payload fields
5. Compare computed hash with extracted signature
6. If MATCH → Validate against Supabase
7. If MISMATCH → Reject as tampered

**Security Features:**

- **Tamper Detection:** Any modification to payload invalidates signature
- **One-Time Use:** Supabase tracks `used_at` timestamp
- **Expiry:** Ticket automatically expires after event date
- **Revocation:** Admin can manually invalidate ticket (status → cancelled)

---

### **Ticket Regeneration Workflow:**

**Use Case:** User loses phone, suspects QR code was screenshot by someone else

**Process:**

1. User clicks "Regenerate QR Code" on ticket detail page
2. **Confirmation Modal:**
   - Warning: "This will invalidate your current QR code. Any screenshots or downloads will no longer work."
   - "Are you sure?" with Yes/No buttons
3. On confirmation:
   - Generate new QR payload with new `issuedAt` timestamp
   - Generate new SHA-256 signature
   - Update Supabase ticket record:
     ```javascript
     await supabase
       .from('tickets')
       .update({
         qr_code_data: newQRDataEncoded,
         qr_code_image: newQRCodeDataURL,
         regenerated_count: ticket.regenerated_count + 1,
         regenerated_at: new Date().toISOString(),
         previous_qr_invalidated: true,
       })
       .eq('ticket_id', ticketId);
     ```
   - Log regeneration in audit trail
4. Display new QR code immediately
5. Email new ticket to user

**Old QR Code Behavior:**

- ESP32-CAM validation detects mismatch with Supabase
- Returns error: "This QR code has been invalidated. Please use the latest ticket."

---

## **ADDITIONAL FEATURES & EDGE CASES**

### **1. Session Timeout Handling:**

**Cart Expiration:**

- Items in cart reserved for 15 minutes
- Visual countdown timer on cart page
- At 5 minutes: Warning notification
- At expiration: Items released, user notified

**Checkout Page Timeout:**

- If user stays on checkout page >10 minutes without action:
  - Warning modal: "Still there? Your cart will expire in 5 minutes."
  - Option to extend session or proceed to payment

---

### **2. Concurrent Purchase Prevention:**

**Scenario:** User opens checkout in multiple tabs/devices

**Solution:**

- Supabase Row Level Security (RLS) and database transactions prevent duplicate bookings
- If payment initiated in Tab 1, Tab 2 shows:
  - "Payment in progress in another session"
  - Option to cancel other session or wait

---

### **3. Payment Failure Recovery:**

**Scenario:** Payment fails after user entered details

**User Flow:**

1. Error displayed in Cashfree modal
2. Option to retry with same cart
3. If user closes modal:
   - Cart remains intact
   - Transaction marked as "failed" in Supabase
   - User can retry from checkout page
   - Email sent: "We noticed you didn't complete your purchase"

---

### **4. Refund Workflow:**

**Initiated by User:**

- Navigate to "My Tickets" → Select booking → "Request Refund"
- Refund policy check (e.g., 24 hours before event)
- If eligible:
  - Refund request created in Supabase
  - Admin reviews (auto-approve if within policy)
  - Cashfree Refund API called
  - Tickets invalidated
  - User notified via email

**Cashfree Refund API:**

```javascript
const refundResponse = await fetch('https://api.cashfree.com/pg/orders/refunds', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  },
  body: JSON.stringify({
    order_id: orderId,
    refund_amount: refundableAmount,
    refund_id: `refund_${bookingId}`,
    refund_note: 'Customer requested refund',
  }),
});
```

**Initiated by Admin/Organizer:**

- Admin dashboard → Event cancellation
- Bulk refund triggered for all tickets
- Automated Cashfree refunds
- Notifications sent to all attendees

---

### **5. Order History & Receipts:**

**Access:** User profile → "Order History"

**For Each Transaction:**

- Transaction ID
- Date & time
- Events purchased
- Amount paid
- Payment method
- "Download Receipt" button (PDF invoice)
- "View Tickets" link

---

### **6. Error States & User Guidance:**

**Network Error:**

- Retry button with exponential backoff
- "Check your internet connection" message

**Inventory Sold Out (During Checkout):**

- "Sorry, [Event Name] tickets are sold out."
- "Would you like to join the waitlist?"

**Price Change (During Checkout):**

- "Price updated since you added to cart."
- Show old vs new price
- Option to proceed or remove item

**Promo Code Issues:**

- Clear, specific error messages (not generic "Invalid code")
- Suggestions: "Try code 'SAVE10' instead"

---

## **TECHNICAL IMPLEMENTATION NOTES**

### **State Management (Zustand):**

**Cart Store:**

```javascript
const useCartStore = create((set, get) => ({
  items: [],
  promoCode: null,
  discountAmount: 0,

  addItem: item =>
    set(state => ({
      items: [...state.items, item],
    })),

  removeItem: cartItemId =>
    set(state => ({
      items: state.items.filter(i => i.cartItemId !== cartItemId),
    })),

  updateQuantity: (cartItemId, newQuantity) =>
    set(state => ({
      items: state.items.map(i =>
        i.cartItemId === cartItemId
          ? { ...i, quantity: newQuantity, subtotal: i.pricePerTicket * newQuantity }
          : i
      ),
    })),

  applyPromoCode: (code, discount) =>
    set({
      promoCode: code,
      discountAmount: discount,
    }),

  clearCart: () => set({ items: [], promoCode: null, discountAmount: 0 }),
}));
```

---

### **Supabase Row Level Security (RLS) Policies:**

**`cart` Table:**

```sql
-- Users can only read/write their own cart
CREATE POLICY "cart_owner_policy" ON cart
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**`tickets` Table:**

```sql
-- Users can only read their own tickets
CREATE POLICY "tickets_read_policy" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role (Edge Functions) can insert/update
CREATE POLICY "tickets_write_policy" ON tickets
  FOR ALL USING (auth.role() = 'service_role');
```

**`transactions` Table:**

```sql
-- Users can read their own transactions
CREATE POLICY "transactions_read_policy" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create transactions (server validates amount)
CREATE POLICY "transactions_insert_policy" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role can update
CREATE POLICY "transactions_update_policy" ON transactions
  FOR UPDATE USING (auth.role() = 'service_role');
```

---

### **Performance Optimizations:**

**Image Optimization:**

- Event images served via Supabase Storage with CDN
- Responsive images (multiple sizes)
- Lazy loading for below-fold content

**Code Splitting:**

- Checkout page loaded asynchronously (React.lazy)
- Cashfree SDK loaded on-demand

**Database Indexing:**

```sql
-- Composite indexes for cart queries
CREATE INDEX idx_cart_user_created ON cart (user_id, created_at);

-- Indexes for ticket queries
CREATE INDEX idx_tickets_user_status_date ON tickets (user_id, status, expires_at);

-- Index for promo code lookups
CREATE INDEX idx_promo_codes_code ON promo_codes (code);
```

---

## **USER EXPERIENCE ENHANCEMENTS**

**Progressive Web App (PWA) Features:**

- **Offline Ticket Viewing:** Cached QR codes viewable without internet
- **Add to Home Screen:** Install FlowGateX as native-like app
- **Push Notifications:**
  - Reminder: "Your event starts in 2 hours!"
  - Update: "Gate location changed to Main Entrance"

**Accessibility:**

- **Screen Reader Support:** ARIA labels on all interactive elements
- **Keyboard Navigation:** Full tab navigation for checkout flow
- **High Contrast Mode:** Support for OS-level accessibility settings
- **Text Scaling:** Responsive to user font size preferences

**Multi-Language Support:**

- Language selector in app header
- Localized currency formatting
- Translated error messages

---

## **MONITORING & ANALYTICS**

**Conversion Funnel Tracking:**

1. Event view
2. Add to cart
3. Proceed to checkout
4. Payment initiated
5. Payment completed

**Key Metrics:**

- Cart abandonment rate
- Average time to checkout
- Payment success rate
- Promo code usage rate
- Ticket regeneration frequency

**Error Monitoring:**

- Sentry/LogRocket integration for frontend errors
- Supabase Edge Function logs for backend errors
- Cashfree webhook failures tracked

---

## **SUMMARY OF USER JOURNEY**

```
START: User lands on Event Catalog Page

PATH A: View Details
  → Click "View Details"
  → Event Detail Page (full info)
  → Select tier + quantity
  → Click "Book Now"
  → Item added to cart

PATH B: Quick Book
  → Click "Book Now" on card
  → Quick booking modal
  → Select tier + quantity
  → Click "Add to Cart"
  → Item added to cart

CART MANAGEMENT
  → Navigate to Cart
  → Review items
  → Adjust quantities
  → Remove unwanted items
  → Click "Proceed to Checkout"

CHECKOUT
  → Review cart items
  → Enter attendee information
  → Apply promo code (optional)
  → Verify order summary
  → Accept terms & conditions
  → Click "Pay ₹X"

PAYMENT (CASHFREE)
  → Cashfree checkout modal opens
  → Select payment method (UPI/Card/Net Banking/Wallet/EMI/BNPL)
  → Enter payment details
  → Submit payment
  → Payment processing...
  → Payment successful

CONFIRMATION
  → Payment verification (server-side via Cashfree API)
  → Transaction recorded in Supabase
  → Booking created in Supabase
  → Tickets generated (with QR codes)
  → Promo code usage logged
  → Inventory updated
  → Cart cleared
  → Confirmation email sent
  → Success modal displayed
  → Confetti animation

TICKET ACCESS
  → Navigate to "My Tickets"
  → View all bookings
  → Expand booking to see individual tickets
  → View full-screen QR code
  → Download/Print tickets
  → Add event to calendar
  → Tickets stored in Supabase (accessible anytime)

EVENT DAY
  → User presents QR code at venue
  → ESP32-CAM scans QR
  → Signature verified (SHA-256)
  → Supabase validation
  → Gate opens (if valid)
  → Ticket marked as "used"
  → User enters event ✓

END: Successful Event Experience
```

---

**WORKFLOW COMPLETE**

This comprehensive workflow ensures a seamless, secure, and user-friendly ticket booking experience from event discovery to venue entry, with robust payment processing via Cashfree, ticket management, and real-time IoT integration — all powered by Supabase as the backend infrastructure.

---

_FlowGateX — Where Innovation Meets Access Control_
