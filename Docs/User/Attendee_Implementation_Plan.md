# Attendee Role Dynamic Implementation Plan

## Overview

This document focuses on the changes required in the user-facing (attendee) pages to ensure synchronization with Admin and Organizer role updates.

## 1. Booking & Transactions

### 1.1 Real-time Order Status

**Goal:** Attendees see their ticket approval instantly (if event requires).
**Required Changes:**

- **File:** `src/pages/dashboard/User/MyOrdersPage.tsx`
- **Action:** Add global listener to `bookings` collection (`where userId == currentUser.uid`).
- **Logic:**
  - If `status` changes from `pending` to `confirmed` (Admin approval for specific scenarios), notify user.
  - If `status` changes to `cancelled` (Admin/Organizer refund trigger), show refund pending message.

### 1.2 Razorpay Payment Status Handling

**Goal:** Handle payment failures and retries gracefully.
**Required Changes:**

- **File:** `src/pages/booking/CheckoutPage.tsx`
- **Action:** Sync payment status (Success/Failure) callback with `bookings` and `transactions` collections.
- **Logic:**
  - Handle `payment.failed` event from Razorpay webhook (listen via `transactions` doc update).
  - Provide "Retry Payment" option updating the same booking reference.

## 2. Profile & Authorization

### 2.1 Role Updates Integration

**Goal:** If a user is promoted to 'Organizer' or 'Admin', the UI must reflect immediately.
**Required Changes:**

- **File:** `src/components/layout/Navbar.tsx`, `src/routes/RoleRoute.tsx`
- **Action:** The `useAuth` hook must listen to `user_metadata` or rely on `idTokenResult.claims` refresh.
- **Logic:** Force a token refresh when the user's role is updated by an Admin (via cloud function signal or periodic check).

### 2.2 Account Status Check

**Goal:** Suspended/banned users should be logged out or restricted.
**Required Changes:**

- **File:** `src/routes/ProtectedRoute.tsx`
- **Action:** Check `currentUser.accountStatus` on every navigation.
- **Logic:** If `accountStatus == 'suspended'`, redirect to a specialized "Account Suspended" page with contact info.
