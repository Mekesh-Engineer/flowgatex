# PayoutsPage.tsx — Specification

> **Route:** `/organizer/payouts`  
> **Role Access:** Organizer (own financial data only), Admin, Super Admin  
> **Purpose:** Financial management hub for Organizers — view revenue breakdowns, track available and pending balances, request payouts, manage bank accounts, and access tax compliance documents.

---

## 1. Overview

The Payouts Page is the Organizer's financial dashboard, presenting a clear, event-by-event revenue breakdown net of FlowGateX's ₹12/ticket service fee. Organizers can request withdrawals of their available balance, manage linked bank accounts, track payout statuses, and download tax/compliance documents. All financial transactions flow through Razorpay, with real-time status updates via Firestore.

---

## 2. Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                           │
│ "Payouts & Finance"                                                   │
├──────────────────────────────────────────────────────────────────────┤
│ BALANCE OVERVIEW CARDS (3 cards)                                     │
│ [Available Balance + CTA] [Pending Balance] [Total Earned Lifetime]  │
├──────────────────────────────────────────────────────────────────────┤
│ PERIOD SELECTOR:  [ This Month ] [ Last 3 Months ] [ This Year ] [ All Time ] │
├──────────────────────────────────────────────────────────────────────┤
│ REVENUE BREAKDOWN TABLE (per event)                                  │
│ [Event] [Gross] [Service Fee] [Net Revenue] [Status]                 │
├──────────────────────────────────────────────────────────────────────┤
│ PAYOUT HISTORY TABLE                                                 │
│ [Payout ID] [Amount] [Request Date] [Status] [Paid Date] [Bank] [⋮] │
├──────────────────────────────────────────────────────────────────────┤
│ TAX & COMPLIANCE SECTION                                             │
│ [TDS Certificate] [GST Invoice] [Annual Statement] [Export CSV]      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Functionalities

### 3.1 Balance Overview Cards

Three cards always visible at the top of the page, updated in real-time via Firestore listener on `users/{uid}`.

**Card 1 — Available Balance:**
```
┌──────────────────────────────┐
│ AVAILABLE BALANCE            │
│ ₹25,000                      │
│ Ready to withdraw            │
│                              │
│ [ REQUEST PAYOUT ]           │
└──────────────────────────────┘
```
- Available = revenue from completed events whose hold period has ended
- Green border + "Ready to withdraw" sub-text
- "Request Payout" → opens Request Payout Modal

**Card 2 — Pending Balance:**
```
┌──────────────────────────────┐
│ PENDING BALANCE              │
│ ₹15,000                      │
│ Held until event completion  │
│ Release date: Mar 20, 2026   │
└──────────────────────────────┘
```
- Amber border
- Pending = revenue from upcoming/in-progress events (held 48h post event-end)
- Shows earliest release date from pending events

**Card 3 — Total Earned (Lifetime):**
```
┌──────────────────────────────┐
│ TOTAL EARNED (LIFETIME)      │
│ ₹1,25,000                    │
│ Across 12 events             │
│ Net after service fees       │
└──────────────────────────────┘
```
- Blue/indigo accent
- Count of events contributing
- "Net after service fees" sub-text

---

### 3.2 Revenue Breakdown Table

Event-level revenue breakdown filtered by selected period.

| Column           | Content                                              | Sortable |
|------------------|------------------------------------------------------|----------|
| Event Name       | Name + date + status badge                          | Yes      |
| Gross Revenue    | ₹ (sum of tickets sold × price)                     | Yes      |
| Tickets Sold     | Count                                               | Yes      |
| Service Fee      | ₹12 × ticket count (shown as negative: −₹X)        | Yes      |
| Refunds          | Total refunded amount (−₹X)                         | Yes      |
| Net Revenue      | Gross − Service Fee − Refunds                       | Yes      |
| Payout Status    | Paid / Pending / Available (color-coded badge)       | Yes      |

**Service Fee Calculation:**
```
Net Revenue = Gross Revenue − (ticketsSold × ₹12) − totalRefunds

Example:
  Gross: ₹50,000  |  Tickets: 100  |  Fee: ₹1,200  |  Refunds: ₹2,000
  Net: ₹50,000 − ₹1,200 − ₹2,000 = ₹46,800
```

**Expandable Row:** Click event row to show:
- Per-tier revenue breakdown
- Refund history for this event (booking IDs + amounts)
- Payment gateway transaction IDs (Razorpay)

**Data Source:**
```typescript
const revenueQuery = query(
  collection(db, 'transactions'),
  where('organizerUid', '==', uid),
  where('timestamp', '>=', periodStart),
  orderBy('timestamp', 'desc')
);
// Group by eventId client-side
```

**Totals Footer Row:**
- Summed across all rows in current filter:
  - Total Gross / Total Fees / Total Refunds / **Total Net**

---

### 3.3 Payout History Table

All historical payout requests.

| Column         | Content                                            | Sortable |
|----------------|----------------------------------------------------|----------|
| Payout ID      | `PO-001` (monospace, copyable)                    | No       |
| Amount         | ₹ amount                                           | Yes      |
| Request Date   | Timestamp (relative + absolute on hover)           | Yes      |
| Status         | Pill badge (see status types)                      | Yes      |
| Paid Date      | Timestamp or "—" if not yet paid                  | Yes      |
| Bank Account   | Masked: "HDFC ***1234"                             | No       |
| Actions        | Context menu ⋮                                     | No       |

**Payout Status Badges:**
| Status       | Color  | Meaning                                       |
|--------------|--------|-----------------------------------------------|
| Pending      | Amber  | Submitted, awaiting Admin review              |
| Processing   | Blue   | Admin approved, bank transfer initiated       |
| Completed    | Green  | Funds transferred successfully                |
| Failed       | Red    | Bank transfer failed                          |
| Cancelled    | Grey   | Cancelled by organizer before processing      |

**Context Menu (⋮):**
- View Payout Receipt → opens receipt modal
- Download Receipt PDF → calls `generatePayoutReceipt` CF
- Cancel Payout → only if status is "Pending"; confirmation required

**Payout Receipt Modal:**
```
PAYOUT RECEIPT
──────────────────────
Payout ID:      PO-001
Amount:         ₹48,800
Requested:      Mar 1, 2026 · 10:30 AM
Approved By:    Admin (Rahul Sharma)
Processed:      Mar 3, 2026 · 2:15 PM
Bank:           HDFC Bank
Account:        ***1234
Transfer Ref:   TRF-RAZORPAY-XYZ123

Events Covered:
  TechConf 2026    ₹48,800 net

[ Download PDF ]  [ Close ]
```

---

### 3.4 Request Payout Modal (3-Step)

Triggered by "Request Payout" button on Available Balance card.

**Step 1: Amount Selection**
```
Available Balance: ₹25,000

Withdrawal Amount:
[₹25,000        ] (editable; max = available balance; min = ₹500)

[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]
  ₹500                           ₹25,000

⚠️ Minimum payout: ₹500
ℹ️ Payouts are processed within 3–5 business days.

[ Cancel ]  [ Next → ]
```

**Validation:**
- Amount must be ≥ ₹500
- Amount must be ≤ `availableBalance`
- Shows "Insufficient balance" if amount exceeds balance

**Step 2: Bank Account Selection**
```
Select Bank Account:

(•) HDFC Bank  — Savings — ***1234
( ) ICICI Bank — Savings — ***5678

[ + Add New Bank Account ]  ↓ expands inline form

[ ← Back ]  [ Next → ]
```

**Add New Bank Account (inline form):**
```
Account Holder Name:  [John Doe              ]
Bank Name:            [HDFC Bank         ▼   ]
Account Number:       [****4567              ] (masked input)
Confirm Account #:    [****4567              ]
IFSC Code:            [HDFC0001234           ] (auto-validates format)
Account Type:         (•) Savings  ( ) Current

[ Save Bank Account ]
```

**IFSC Validation:**
- Client-side regex: `/^[A-Z]{4}0[A-Z0-9]{6}$/`
- API call to IFSC lookup service to verify bank + branch details
- On valid: shows "✅ HDFC Bank — Andheri West Branch"

**Step 3: Review & Confirm**
```
PAYOUT SUMMARY
──────────────────────
Amount:          ₹25,000
Bank:            HDFC Bank ***1234
Expected By:     Mar 5, 2026 (3 business days)

☑ I agree that payouts are subject to FlowGateX service terms.
  [Terms link]

[ ← Back ]  [ ✅ Submit Request ]
```

**On Submit:**
- Calls `requestPayout` Cloud Function
- Loading spinner on button
- Success: "✅ Payout of ₹25,000 requested! Expect transfer by Mar 5."
- Toast notification + email confirmation to organizer
- Payout history table updates immediately (new row: Pending status)

---

### 3.5 Manage Bank Accounts Section

Accessible via "Manage Bank Accounts" link (below payout history or in settings).

```
LINKED BANK ACCOUNTS

HDFC Bank — Savings — ***1234  [Primary]  [Edit] [Delete]
ICICI Bank — Savings — ***5678             [Edit] [Delete] [Set Primary]

[ + Add New Account ]
```

- Maximum 3 bank accounts per organizer
- Primary account is default in payout modal
- Delete confirmation: "Are you sure? This cannot be undone."
- Cannot delete primary account if pending payout uses it

---

### 3.6 Tax & Compliance Section

Bottom section with links to downloadable documents.

| Document                    | Action                                         | Generator              |
|-----------------------------|------------------------------------------------|------------------------|
| TDS Certificate             | Download PDF (if TDS deducted on payouts)      | Pre-generated by Admin |
| GST Invoice                 | Download PDF (invoice from FlowGateX to organizer) | `generateGSTInvoice` CF |
| Annual Earnings Statement   | Download PDF (FY summary)                      | `generateAnnualStatement` CF |
| Revenue Data for Tax Filing | Download CSV (all transactions with timestamps)| `exportRevenueTax` CF  |

**GST Invoice includes:**
- FlowGateX billing details
- Service fee breakdown per event
- Total taxable amount + GST (18% on service fees)
- Invoice number + period

---

## 4. UI Requirements

### Visual Design
- Balance cards: elevated with colored left border (green/amber/blue)
- Revenue table: striped rows, sticky header
- Payout history: newest entries at top; status pill has consistent color across the app
- Positive amounts: green text; service fees and refunds: red text

### Loading States
- Balance cards: skeleton pulse while `users/{uid}` loads
- Revenue table: 5 skeleton rows
- "Request Payout" button disabled while balance data loads

### Empty States
- Payout history: "No payouts yet. Request your first payout when you have available balance."
- Revenue table: "No transactions in this period."

### Responsive
- **Desktop:** 3 balance cards in a row; full revenue table
- **Tablet:** 3-card row (smaller); horizontal-scroll revenue table
- **Mobile:** Cards stack vertically; revenue table becomes cards per event; payout history is card list

---

## 5. Firebase Services

### Firestore Documents & Listeners

```typescript
// 1. Organizer balance (real-time)
onSnapshot(doc(db, 'users', uid), (doc) => {
  const { availableBalance, pendingBalance, lifetimeEarnings } = doc.data();
  setBalances({ availableBalance, pendingBalance, lifetimeEarnings });
});

// 2. Revenue (per event, per period)
const transactionQuery = query(
  collection(db, 'transactions'),
  where('organizerUid', '==', uid),
  where('status', 'in', ['paid', 'refunded']),
  where('timestamp', '>=', periodStart),
  orderBy('timestamp', 'desc')
);

// 3. Payout requests (real-time, for status updates)
const payoutQuery = query(
  collection(db, 'payout_requests'),
  where('organizerUid', '==', uid),
  orderBy('requestedAt', 'desc')
);
onSnapshot(payoutQuery, (snap) => setPayouts(snap.docs.map(d => d.data())));

// 4. Bank accounts
const bankQuery = collection(db, 'users', uid, 'bankAccounts');
```

### Firestore Collections

**`users/{uid}` (relevant fields):**
```json
{
  "availableBalance": 25000,
  "pendingBalance": 15000,
  "lifetimeEarnings": 125000,
  "pendingPayouts": 0
}
```

**`payout_requests/{id}`:**
```json
{
  "id": "PO-001",
  "organizerUid": "uid",
  "amount": 48800,
  "bankAccountId": "BA-001",
  "status": "completed",
  "requestedAt": "timestamp",
  "approvedAt": "timestamp",
  "approvedBy": "admin_uid",
  "paidAt": "timestamp",
  "transferDetails": {
    "bankTransactionId": "TRF-XYZ123",
    "bankName": "HDFC Bank",
    "accountNumber": "****1234"
  },
  "expectedTransferDate": "timestamp",
  "events": ["event_id_1", "event_id_2"]
}
```

**`users/{uid}/bankAccounts/{id}`:**
```json
{
  "id": "BA-001",
  "accountHolderName": "John Doe",
  "bankName": "HDFC Bank",
  "accountNumber": "encrypted_value",
  "maskedAccountNumber": "***1234",
  "ifscCode": "HDFC0001234",
  "accountType": "savings",
  "isPrimary": true,
  "verifiedAt": "timestamp"
}
```

### Cloud Functions Called

| Function                  | Input                                   | Output                             |
|---------------------------|-----------------------------------------|------------------------------------|
| `requestPayout`           | `{ amount, bankAccountId }`             | `{ payoutRequestId, expectedDate }` |
| `cancelPayoutRequest`     | `{ payoutRequestId }`                   | `{ cancelled: true }`              |
| `addBankAccount`          | `BankAccountData`                       | `{ accountId }`                    |
| `deleteBankAccount`       | `{ accountId }`                         | `{ deleted: true }`                |
| `generateGSTInvoice`      | `{ period }`                            | `{ downloadUrl }`                  |
| `generateAnnualStatement` | `{ financialYear }`                     | `{ downloadUrl }`                  |
| `exportRevenueTax`        | `{ financialYear }`                     | `{ downloadUrl }`                  |
| `generatePayoutReceipt`   | `{ payoutRequestId }`                   | `{ downloadUrl }`                  |

---

## 6. Razorpay Integration

### Payout Processing (Admin-side, triggered on approval)

```typescript
// Cloud Function: processPayout (called by Admin approval)
const transfer = await razorpay.transfers.create({
  account: bankAccountDetails.razorpayContactId,
  amount: amountInPaise,
  currency: 'INR',
  queue_if_low_balance: false,
  notes: {
    payoutRequestId: payoutId,
    organizerUid: uid,
    purpose: 'Event payout — FlowGateX'
  }
});
```

**Razorpay Payout API:** Uses `razorpay.payouts` or Razorpay Route transfers.

**Webhook: `payout.processed`:**
```typescript
// Triggered by Razorpay when bank transfer completes
// Updates: payout_requests/{id}.status = 'completed'
// Updates: payout_requests/{id}.paidAt = now
// Updates: payout_requests/{id}.transferDetails.bankTransactionId
// Sends email to organizer
```

**Webhook: `payout.failed`:**
```typescript
// Restores amount to organizer.availableBalance
// Sets payout_requests/{id}.status = 'failed'
// Sets payout_requests/{id}.failureReason
// Sends failure email to organizer with retry instructions
```

### Refund Tracking on Payouts Page

Refunds issued via `initiateRefund` (from AttendeeManagementPage) reduce:
1. `transactions/{id}.status = 'refunded'`
2. `users/{uid}.availableBalance -= refundAmount` (or `pendingBalance` if event not yet complete)

This is reflected in the revenue breakdown table (Refunds column).

---

## 7. State Management

```typescript
// useOrganizerStore finance slice
availableBalance: number;
pendingBalance: number;
lifetimeEarnings: number;
revenueBreakdown: EventRevenue[];
payoutHistory: PayoutRequest[];
bankAccounts: BankAccount[];
selectedPeriod: 'this_month' | 'last_3_months' | 'this_year' | 'all';

fetchBalance: () => void;
fetchRevenueBreakdown: (period: string) => Promise<void>;
fetchPayoutHistory: () => void;
fetchBankAccounts: () => Promise<void>;
requestPayout: (amount: number, bankAccountId: string) => Promise<string>;
cancelPayoutRequest: (payoutRequestId: string) => Promise<void>;
addBankAccount: (data: BankAccountData) => Promise<string>;
deleteBankAccount: (accountId: string) => Promise<void>;
setPeriod: (period: string) => void;
```

---

## 8. Interconnections

| Connected Page / Component       | How Connected                                                          |
|----------------------------------|------------------------------------------------------------------------|
| **OrganizerDashboard**           | "Total Revenue" card links here; "Request Payout" quick action         |
| **AttendeeManagementPage**       | Refunds processed there reduce `availableBalance` tracked here         |
| **EventAnalyticsPage**           | Net revenue figures here match analytics net revenue                   |
| **MyEventsPage**                 | Event names in revenue table link to event management page             |
| **Admin Payout Review (Admin)**  | Payout requests created here are reviewed and approved by Admin        |

---

## 9. API Services Summary

| Service               | Provider    | Purpose                                         |
|-----------------------|-------------|-------------------------------------------------|
| Firestore             | Firebase    | Real-time balance, payout status, bank accounts |
| Cloud Functions       | Firebase    | Payout requests, document generation, bank CRUD |
| Razorpay Payouts API  | Razorpay    | Bank transfer execution (Admin-triggered)       |
| Razorpay Webhooks     | Razorpay    | Real-time transfer status updates               |
| Firebase Storage      | Firebase    | Receipts, GST invoices, statements              |
| IFSC Lookup API       | 3rd party   | Validate IFSC + auto-fill bank branch details   |

---

## 10. Error States & Edge Cases

| Scenario                           | Handling                                                              |
|------------------------------------|-----------------------------------------------------------------------|
| Available balance < ₹500           | "Request Payout" button disabled; tooltip: "Minimum payout is ₹500"  |
| Bank transfer fails                | "Failed" badge + "Retry" option; balance restored automatically       |
| Invalid IFSC code                  | Real-time validation error on IFSC field; submit blocked              |
| 3 bank accounts already linked     | "Add New Account" button disabled with tooltip "Maximum 3 accounts"   |
| Payout cancelled after processing  | Cannot cancel; only Pending payouts can be cancelled                  |
| Firestore balance mismatch         | Cloud Function reconciles on each payout request creation             |
| Period filter shows no revenue     | Empty table state: "No revenue in this period"                        |
