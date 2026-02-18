# FlowGateX — Admin Dashboard Documentation

> Complete reference for the Admin and Super Admin dashboard modules, covering platform governance, user management, and system configuration.

---

## Table of Contents

1. [Overview](#overview)
2. [Admin Roles & Permissions](#admin-roles--permissions)
3. [Dashboard Pages](#dashboard-pages)
4. [Workflows](#workflows)
5. [API & Service Layer](#api--service-layer)
6. [Known Issues & Limitations](#known-issues--limitations)

---

## Overview

The **Admin Dashboard** provides a centralized control panel for platform-wide governance. It is accessible to users with the `admin` or `superadmin` role and is rendered within the shared `DashboardLayout` component with role-gated routes.

**Access control** is enforced at two levels:

1. **Route level** — `<RoleRoute allowedRoles={[ADMIN, SUPER_ADMIN]}>` wraps all `/admin/*` routes.
2. **Permission level** — Individual actions within pages check granular permissions (e.g., `user:manage`, `platform:settings`).

---

## Admin Roles & Permissions

### Role Hierarchy

| Role            | Level | Scope                                                       |
| --------------- | ----- | ----------------------------------------------------------- |
| **Admin**       | 3     | Platform governance, user management, content moderation    |
| **Super Admin** | 4     | Full system bypass — unconditional access to every resource |

### Admin Permissions

| Permission               | Description                           |
| ------------------------ | ------------------------------------- |
| `user:read`              | View all user profiles                |
| `user:manage`            | Edit user accounts                    |
| `user:assign_role`       | Change user roles                     |
| `user:suspend`           | Suspend/ban user accounts             |
| `user:verify`            | Verify organizer applications         |
| `event:approve`          | Approve/reject event submissions      |
| `event:delete`           | Remove events from the platform       |
| `finance:view`           | View platform-wide financial data     |
| `finance:manage`         | Manage payouts and refunds            |
| `analytics:view`         | Access platform analytics             |
| `analytics:export`       | Export analytics data                 |
| `platform:settings`      | Modify platform configuration         |
| `platform:feature_flags` | Toggle feature flags                  |
| `platform:security`      | Configure security policies           |
| `platform:maintenance`   | Enable/disable maintenance mode       |
| `notification:send`      | Send platform-wide notifications      |
| `notification:manage`    | Manage notification settings          |
| `support:view`           | View support tickets                  |
| `support:manage`         | Respond to and manage support tickets |

### Super Admin Override

The Super Admin role (`superadmin`) bypasses the entire permission resolution chain. The RBAC engine short-circuits at step 2:

```
1. Account status check (suspended/deleted → deny)
2. Super Admin override (→ allow ALL)  ← stops here
3. Platform feature flags
4. Organization restrictions
5. Role-based defaults
```

---

## Dashboard Pages

### 1. Admin Dashboard (`/admin`)

**File:** `src/pages/dashboard/Admin/AdminDashboard.tsx`

**Purpose:** Central overview of platform health and key metrics.

**Key Metrics Displayed:**

- Total users, active events, total bookings, total revenue
- Pending organizer approvals count
- Recent platform activity feed
- System health indicators

---

### 2. User Management (`/admin/users`)

**File:** `src/pages/dashboard/Admin/UserManagementPage.tsx`

**Purpose:** View, search, filter, and manage all user accounts.

**Capabilities:**

| Action            | Permission Required |
| ----------------- | ------------------- |
| View user list    | `user:read`         |
| Edit user profile | `user:manage`       |
| Change user role  | `user:assign_role`  |
| Suspend account   | `user:suspend`      |
| Delete account    | `user:delete`       |

**Features:**

- Search by name, email, or role
- Filter by role, status (active/suspended/deleted)
- Sortable data table with pagination
- Inline role assignment dropdown
- Account suspension with reason field

---

### 3. Organizer Approvals (`/admin/organizers`)

**File:** `src/pages/dashboard/Admin/OrganizerApprovalsPage.tsx`

**Purpose:** Review and approve/reject organizer registration applications.

**Workflow:**

1. User registers and selects "Organizer" role
2. Application appears in the approvals queue with `pending` status
3. Admin reviews organizer details (bio, organization, documents)
4. Admin approves → user role upgraded to `organizer`
5. Admin rejects → user remains as `user` with rejection reason

**Capabilities:**

- View pending, approved, and rejected applications
- Filter by application status
- Approve/reject with optional comments
- View applicant profile details

---

### 4. Event Moderation (`/admin/events`)

**File:** `src/pages/dashboard/Admin/EventModerationPage.tsx`

**Purpose:** Review, approve, and moderate events submitted by organizers.

**Capabilities:**

| Action             | Permission Required |
| ------------------ | ------------------- |
| View all events    | `event:read`        |
| Approve event      | `event:approve`     |
| Reject event       | `event:approve`     |
| Delete event       | `event:delete`      |
| Edit event details | `event:update`      |

**Features:**

- Filter by status: draft, published, completed, cancelled
- Sort by date, title, organizer, category
- Quick approve/reject actions
- Detailed event preview modal

---

### 5. Promo Codes (`/admin/promo-codes`)

**File:** `src/pages/dashboard/Admin/PromoCodesPage.tsx`

**Purpose:** Create and manage platform-wide promotional codes.

**Promo Code Properties:**

| Property    | Description                      |
| ----------- | -------------------------------- |
| Code        | Unique alphanumeric string       |
| Type        | Percentage or flat discount      |
| Value       | Discount amount (% or ₹)         |
| Min Order   | Minimum order value required     |
| Max Uses    | Total usage limit                |
| Expiry Date | Validity period                  |
| Event Scope | All events or specific event IDs |

---

### 6. Platform Settings (`/admin/settings`)

**File:** `src/pages/dashboard/Admin/PlatformSettingsPage.tsx`

**Purpose:** Configure global platform settings, feature flags, and security policies.

**Settings Categories:**

| Category          | Examples                                                              |
| ----------------- | --------------------------------------------------------------------- |
| **General**       | App name, URL, branding                                               |
| **Feature Flags** | Enable/disable bookings, events, IoT, analytics, payments             |
| **Security**      | 2FA enforcement, password policy, session timeout, max login attempts |
| **Maintenance**   | Enable maintenance mode with custom message                           |
| **Payments**      | Service fee per ticket (₹12 default), gateway configuration           |

**Firestore Path:** `SettingInfo/platform`

---

### 7. Reports (`/admin/reports`)

**File:** `src/pages/dashboard/Admin/ReportsPage.tsx`

**Purpose:** Generate and view platform-wide analytical reports.

**Report Types:**

- Revenue reports (daily, weekly, monthly)
- User growth metrics
- Event performance summaries
- Booking conversion rates
- Refund analytics

---

## Workflows

### User Suspension Flow

```
Admin clicks "Suspend" on user →
  Confirmation dialog with reason field →
    API call: userService.updateUser(uid, { accountStatus: 'suspended' }) →
      User's next request fails at RBAC step 1 (account status ≠ active) →
        User sees AccountSuspendedPage
```

### Event Moderation Flow

```
Organizer creates event (status: 'draft') →
  Organizer publishes event →
    If platform requires approval:
      Event goes to 'pending_review' →
        Admin approves/rejects →
          If approved: status → 'published' (visible to attendees)
          If rejected: status → 'rejected' with reason
    Else:
      Event goes directly to 'published'
```

### Platform Maintenance Mode

```
Admin enables maintenance mode in Platform Settings →
  settingsService.updatePlatform({ maintenanceMode: true, maintenanceMessage: "..." }) →
    All non-admin routes check isMaintenanceMode() →
      Non-admin users see MaintenancePage
      Admin/Super Admin users can still access the dashboard
```

---

## API & Service Layer

### Settings Service

**File:** `src/services/settingsService.ts`

| Method                                    | Description                             |
| ----------------------------------------- | --------------------------------------- |
| `getPlatformSettings()`                   | Fetch platform settings from Firestore  |
| `updatePlatformSettings(data)`            | Update platform settings                |
| `subscribeToPlatformSettings(callback)`   | Real-time listener for settings changes |
| `getOrganizationSettings(orgId)`          | Fetch org-specific settings             |
| `updateOrganizationSettings(orgId, data)` | Update org settings                     |

### User Service

**File:** `src/services/userService.ts`

| Method                     | Description                      |
| -------------------------- | -------------------------------- |
| `getUser(uid)`             | Fetch user profile               |
| `updateUser(uid, data)`    | Update user profile              |
| `getAllUsers(filters)`     | List users with optional filters |
| `assignRole(uid, role)`    | Change user role                 |
| `suspendUser(uid, reason)` | Suspend user account             |

---

## Known Issues & Limitations

| Issue            | Details                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| Super Admin page | Currently reuses `AdminDashboard`; dedicated Super Admin pages are planned |
| Bulk operations  | No bulk approve/reject for organizer applications yet                      |
| Audit log        | Admin actions are not logged to a dedicated audit trail collection         |
| Role downgrade   | Downgrading a role doesn't automatically revoke active sessions            |
| Export format    | Report exports currently limited to JSON; CSV/PDF planned                  |
