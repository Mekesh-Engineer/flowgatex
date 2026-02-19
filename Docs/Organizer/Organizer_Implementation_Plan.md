# Organizer Role Dynamic Implementation Plan

## Overview

This document outlines the changes required to synchronize the Organizer Dashboard with the new Admin workflows, specifically regarding event moderation, real-time status updates, and Razorpay integration.

## 1. Firebase Integration & Real-time Updates

### 1.1 Event Status Synchronization

**Goal:** Organizers must see instant feedback when an Admin approves or rejects their event.
**Required Changes:**

- **File:** `src/pages/dashboard/Organizer/MyEventsPage.tsx`
- **Action:** Replace `getEvents()` with `onSnapshot` listener on `events` collection where `organizerId == currentUser.uid`.
- **UI Update:** Add visual indicators/badges for:
  - `pending` (Yellow)
  - `published` (Green)
  - `rejected` (Red) - With a tooltip or modal showing the `rejectionReason` field set by Admin.

### 1.2 Access Request Tracking

**Goal:** New organizers pending approval need visibility.
**Required Changes:**

- **State Management:** In `authStore` or `organizerStore`, track the status of the `organizer_access_requests` document.
- **Dashboard:** If `auth.currentUser.role` is `user` but `request.status` is `pending`, show a "Verification in Progress" banner instead of the full dashboard.

## 2. Razorpay & Payouts

### 2.1 Payout Account Linking

**Goal:** Organizers must link a bank account to receive payouts.
**Required Changes:**

- **File:** `src/pages/dashboard/Organizer/PayoutsPage.tsx`
- **Action:** Create a form to submit `fund_account` details to Razorpay (via Cloud Function `createRazorpayFundAccount`).
- **Storage:** Store the returned `fund_account_id` securely in the `organizer_profile` document (private sub-collection).

### 2.2 Revenue & Transaction Sync

**Goal:** Real-time earnings display.
**Required Changes:**

- **File:** `src/pages/dashboard/Organizer/OrganizerDashboard.tsx`
- **Action:** Listen to `transactions` collection where `organizerId == currentUser.uid`.
- **Logic:**
  - `Total Revenue` = Sum of all `amount` where `status == 'captured'`.
  - `Withdrawable Balance` = `Total Revenue` - `Platform Fees` - `Already Paid Out`.

## 3. Scanner & Check-in

**Goal:** Sync check-ins with Admin analytics.
**Required Changes:**

- **File:** `src/pages/dashboard/Organizer/ScannerPage.tsx`
- **Action:** When scanning a ticket:
  - Update `bookings/{bookingId}` setting `checkedIn = true`.
  - Update `events/{eventId}` incrementing `checkedInCount`.
  - This data immediately reflects on Admin's `EventAnalyticsPage` via Firestore streams.
