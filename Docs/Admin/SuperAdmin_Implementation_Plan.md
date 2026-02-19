# Super Admin Role Dynamic Implementation Plan

## Overview

This document outlines the strategic implementation plan for the Super Admin role, focusing on system-wide observability, platform governance, and role management.

## 1. Global System Governance

### 1.1 Platform Configuration (`PlatformSettingsPage.tsx`)

**Goal:** Centralized control over all features and monetization.
**Required Changes:**

- **Dynamic Feature Flags:** Enable/Disable features (e.g., 'Organizer Applications', 'Payouts', 'New Registrations') globally using Firestore or Remote Config.
- **Payment Gateway Config:** Secure interface (using Cloud Functions) to update Razorpay/Stripe keys (only public keys stored in Firestore, private in Secrets Manager).

### 1.2 User Role Elevation

**Goal:** Promote basic users to Admins or Organizers securely.
**Required Changes:**

- **File:** `src/pages/dashboard/Admin/UserManagementPage.tsx` (Super Admin view).
- **Action:** Only Super Admin can change a user's role to `admin` or `super_admin`.
- **Logic:** Calls `functions.httpsCallable('setUserRole')` which verifies the caller is Super Admin before setting custom claims.

## 2. Platform Observability

### 2.1 Audit Logging

**Goal:** Track critical actions (bans, approvals, config changes).
**Required Changes:**

- **Collection:** `audit_logs` (write-only for admins).
- **File:** Create `src/pages/dashboard/Admin/AuditLogsPage.tsx`.
- **View:** Display chronological list of actions: `timestamp`, `actorId`, `actionType`, `targetId`, `description`.

### 2.2 Financial Integrity

**Goal:** Reconcile Razorpay settlements with Platform revenue.
**Required Changes:**

- **File:** `src/pages/dashboard/Admin/FinancialDashboard.tsx`.
- **Action:** Compare `transactions` (platform db) vs Razorpay Settlement Reports (API).
- **Alerts:** Highlight discrepancies (e.g., successful webhook but failed db update).

## 3. Security

- **Strict Rules:** Only Super Admin can delete users or modify system settings.
- **Rule Enforcement:**
  ```javascript
  match /audit_logs/{log} {
    allow read: if request.auth.token.role == 'super_admin';
    allow write: if request.auth.token.role in ['admin', 'super_admin']; // Admins can log actions, but only SA can view all
  }
  ```
