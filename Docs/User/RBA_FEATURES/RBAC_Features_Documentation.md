# FlowGateX — Role-Based Access Control (RBAC) Features

> Complete reference for the 5-tier RBAC permission system covering roles, permissions, resolution engine, feature flags, and implementation details.

---

## Table of Contents

1. [Overview](#overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Permission System](#permission-system)
4. [Permission Resolution Engine](#permission-resolution-engine)
5. [Feature Flags](#feature-flags)
6. [Implementation Guide](#implementation-guide)
7. [Security Policies](#security-policies)
8. [Route Protection](#route-protection)
9. [File References](#file-references)
10. [Known Issues & Limitations](#known-issues--limitations)

---

## Overview

FlowGateX implements a **5-tier hierarchical permission system** with **40+ granular permissions** across **12 resource domains**. The RBAC engine resolves permissions through a 5-layer evaluation chain that considers account status, role hierarchy, platform feature flags, and organization-level overrides.

**Architecture:**

```
┌────────────────────────────────────────────┐
│            RBAC Resolution Engine          │
│          (src/lib/rbac.ts)                 │
├────────────────────────────────────────────┤
│ 1. Account Status Gate                     │
│ 2. Super Admin Override                    │
│ 3. Platform Feature Flag Check             │
│ 4. Organization-Level Restrictions         │
│ 5. Role-Based Default Permissions          │
└────────────────────────────────────────────┘
        ▲                    ▲
        │                    │
┌───────┴──────┐    ┌───────┴──────┐
│  React Hooks │    │   Zustand    │
│ (useRBAC.ts) │    │   Stores     │
│              │    │ (auth,       │
│              │    │  settings)   │
└──────────────┘    └──────────────┘
```

---

## Role Hierarchy

| Role            | Key          | Level | Scope                                               |
| --------------- | ------------ | ----- | --------------------------------------------------- |
| **Attendee**    | `user`       | 0     | Browse events, manage bookings, personal profile    |
| **Organizer**   | `organizer`  | 1     | Create/manage events, analytics, IoT, refunds       |
| **Org Admin**   | `org_admin`  | 2     | Organization management, member oversight, exports  |
| **Admin**       | `admin`      | 3     | Platform governance, user management, feature flags |
| **Super Admin** | `superadmin` | 4     | Full system bypass — unconditional access           |

**Hierarchy Rule:** A user with a higher level inherits all permissions of lower levels.

### Role Comparison

```typescript
import { ROLE_HIERARCHY } from '@/types/rbac.types';

// ROLE_HIERARCHY values:
// user: 0, organizer: 1, org_admin: 2, admin: 3, superadmin: 4

// Check if user's role is at least organizer level:
isRoleAtLeast(currentRole, 'organizer'); // true if level >= 1
```

---

## Permission System

### Permission Format

All permissions follow the `resource:action` convention:

```
event:create    →  Can create events
booking:refund  →  Can process refunds
iot:manage      →  Can manage IoT devices
platform:settings → Can modify platform settings
```

### Complete Permission Matrix

#### Event Permissions

| Permission      | User | Organizer | Org Admin | Admin | Super Admin |
| --------------- | :--: | :-------: | :-------: | :---: | :---------: |
| `event:read`    |  ✅  |    ✅     |    ✅     |  ✅   |     ✅      |
| `event:create`  |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `event:update`  |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `event:delete`  |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `event:publish` |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `event:approve` |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |

#### Booking Permissions

| Permission       | User | Organizer | Org Admin | Admin | Super Admin |
| ---------------- | :--: | :-------: | :-------: | :---: | :---------: |
| `booking:create` |  ✅  |    ✅     |    ✅     |  ✅   |     ✅      |
| `booking:read`   |  ✅  |    ✅     |    ✅     |  ✅   |     ✅      |
| `booking:update` |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `booking:cancel` |  ✅  |    ✅     |    ✅     |  ✅   |     ✅      |
| `booking:refund` |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |

#### User Management Permissions

| Permission         | User | Organizer | Org Admin | Admin | Super Admin |
| ------------------ | :--: | :-------: | :-------: | :---: | :---------: |
| `user:read`        |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |
| `user:update`      |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `user:delete`      |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `user:manage`      |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `user:assign_role` |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `user:suspend`     |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `user:verify`      |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |

#### Organization Permissions

| Permission            | User | Organizer | Org Admin | Admin | Super Admin |
| --------------------- | :--: | :-------: | :-------: | :---: | :---------: |
| `org:create`          |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |
| `org:read`            |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `org:update`          |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |
| `org:delete`          |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `org:manage_members`  |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |
| `org:manage_settings` |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |

#### Finance Permissions

| Permission       | User | Organizer | Org Admin | Admin | Super Admin |
| ---------------- | :--: | :-------: | :-------: | :---: | :---------: |
| `finance:view`   |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `finance:manage` |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |
| `finance:payout` |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `finance:refund` |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |

#### Analytics Permissions

| Permission         | User | Organizer | Org Admin | Admin | Super Admin |
| ------------------ | :--: | :-------: | :-------: | :---: | :---------: |
| `analytics:view`   |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `analytics:export` |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |

#### IoT Permissions

| Permission      | User | Organizer | Org Admin | Admin | Super Admin |
| --------------- | :--: | :-------: | :-------: | :---: | :---------: |
| `iot:view`      |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `iot:manage`    |  ❌  |    ✅     |    ✅     |  ✅   |     ✅      |
| `iot:configure` |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |

#### Platform Permissions

| Permission               | User | Organizer | Org Admin | Admin | Super Admin |
| ------------------------ | :--: | :-------: | :-------: | :---: | :---------: |
| `platform:settings`      |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `platform:feature_flags` |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `platform:security`      |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `platform:maintenance`   |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |

#### Notification & Support Permissions

| Permission            | User | Organizer | Org Admin | Admin | Super Admin |
| --------------------- | :--: | :-------: | :-------: | :---: | :---------: |
| `notification:send`   |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `notification:manage` |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |
| `support:view`        |  ❌  |    ❌     |    ✅     |  ✅   |     ✅      |
| `support:manage`      |  ❌  |    ❌     |    ❌     |  ✅   |     ✅      |

---

## Permission Resolution Engine

**File:** `src/lib/rbac.ts` (301 lines)

The engine evaluates permissions through a strict 5-step resolution chain:

### Step 1: Account Status Gate

```typescript
if (ctx.accountStatus !== 'active') {
  return false; // suspended, deleted, or banned users denied everything
}
```

**Account statuses:** `active`, `suspended`, `deleted`, `pending_verification`

### Step 2: Super Admin Override

```typescript
if (ctx.role === 'superadmin') {
  return true; // unconditional access to everything
}
```

### Step 3: Platform Feature Flag Check

```typescript
if (!isFeatureAllowed(platformSettings, permission)) {
  return false; // feature disabled platform-wide
}
```

If the platform has disabled a feature (e.g., `enableBookings: false`), the corresponding permissions are denied for all roles.

### Step 4: Organization-Level Restrictions

```typescript
if (orgSettings?.rolePermissions?.[role]) {
  const orgPerms = orgSettings.rolePermissions[role];
  if (!orgPerms.includes(permission)) {
    return false; // org has restricted this permission for this role
  }
}
```

Organizations can further restrict (but not expand) the default role permissions.

### Step 5: Role-Based Default Check

```typescript
const defaultPerms = DEFAULT_ROLE_PERMISSIONS[ctx.role];
return defaultPerms.includes(permission);
```

---

## Feature Flags

**Firestore path:** `SettingInfo/platform`

### Available Feature Flags

| Flag                  | Description                 | Default |
| --------------------- | --------------------------- | ------- |
| `enableBookings`      | Allow ticket purchases      | `true`  |
| `enableEvents`        | Allow event creation        | `true`  |
| `enableIoT`           | Enable IoT device features  | `true`  |
| `enableAnalytics`     | Enable analytics dashboards | `true`  |
| `enablePayments`      | Enable payment processing   | `true`  |
| `enableNotifications` | Enable push notifications   | `true`  |
| `enableChat`          | Enable chatbot/support chat | `true`  |
| `enableRefunds`       | Allow refund processing     | `true`  |

### Feature-to-Permission Mapping

When a feature flag is disabled, related permissions are automatically denied:

```
enableBookings: false  →  booking:create, booking:update denied
enableEvents: false    →  event:create, event:update denied
enableIoT: false       →  iot:view, iot:manage, iot:configure denied
enablePayments: false  →  finance:payout, finance:refund denied
```

---

## Implementation Guide

### Using Permission Hooks in Components

**File:** `src/hooks/useRBAC.ts` (289 lines)

#### Check a Single Permission

```tsx
import { useHasPermission } from '@/hooks/useRBAC';

function CreateEventButton() {
  const canCreate = useHasPermission('event:create');

  if (!canCreate) return null;

  return <Button onClick={handleCreate}>Create Event</Button>;
}
```

#### Check Multiple Permissions (ALL required)

```tsx
import { useHasAllPermissions } from '@/hooks/useRBAC';

function AdminPanel() {
  const canManage = useHasAllPermissions(['user:manage', 'platform:settings']);

  if (!canManage) return <AccessDenied />;
  return <AdminSettings />;
}
```

#### Check Multiple Permissions (ANY required)

```tsx
import { useHasAnyPermission } from '@/hooks/useRBAC';

function FinanceSection() {
  const canViewFinance = useHasAnyPermission(['finance:view', 'finance:manage']);

  if (!canViewFinance) return null;
  return <FinanceDashboard />;
}
```

#### Check Feature Flag

```tsx
import { useIsFeatureEnabled } from '@/hooks/useRBAC';

function BookingButton() {
  const bookingsEnabled = useIsFeatureEnabled('enableBookings');

  if (!bookingsEnabled) return <span>Bookings are currently disabled</span>;
  return <Button>Book Now</Button>;
}
```

#### Check Maintenance Mode

```tsx
import { useIsMaintenanceMode } from '@/hooks/useRBAC';

function App() {
  const isMaintenance = useIsMaintenanceMode();

  if (isMaintenance) return <MaintenancePage />;
  return <MainApp />;
}
```

#### Check Role Level

```tsx
import { useIsRoleAtLeast } from '@/hooks/useRBAC';

function OrgFeatures() {
  const isOrganizer = useIsRoleAtLeast('organizer');

  if (!isOrganizer) return null;
  return <OrganizerTools />;
}
```

### Using PermissionGate Component

```tsx
import { PermissionGate } from '@/components/common/PermissionGate';

function Dashboard() {
  return (
    <div>
      <PermissionGate permission="analytics:view">
        <AnalyticsWidget />
      </PermissionGate>

      <PermissionGate permission="user:manage" fallback={<AccessDenied />}>
        <UserManagement />
      </PermissionGate>
    </div>
  );
}
```

### Using FeatureGate Component

```tsx
import { FeatureGate } from '@/components/common/FeatureGate';

function EventPage() {
  return (
    <div>
      <FeatureGate feature="enableBookings" fallback={<BookingsDisabled />}>
        <TicketSelection />
      </FeatureGate>
    </div>
  );
}
```

---

## Security Policies

Configured in platform settings (`SettingInfo/platform`):

| Policy                     | Description                     | Default |
| -------------------------- | ------------------------------- | ------- |
| `require2FA`               | Force two-factor authentication | `false` |
| `passwordMinLength`        | Minimum password length         | `8`     |
| `passwordRequireUppercase` | Require uppercase letter        | `true`  |
| `passwordRequireNumber`    | Require numeric digit           | `true`  |
| `passwordRequireSpecial`   | Require special character       | `true`  |
| `sessionTimeoutMinutes`    | Auto-logout after inactivity    | `30`    |
| `maxLoginAttempts`         | Lock account after N failures   | `5`     |
| `ipWhitelist`              | Restrict admin access by IP     | `[]`    |
| `corsOrigins`              | Allowed CORS origins            | `['*']` |

---

## Route Protection

### Route-Level Guards

**File:** `src/routes/AppRoutes.tsx`

```tsx
// Protected routes (any authenticated user)
<ProtectedRoute>
  <Component />
</ProtectedRoute>

// Role-gated routes
<RoleRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORG_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
  <OrganizerPage />
</RoleRoute>

<RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
  <AdminPage />
</RoleRoute>
```

### Route Access by Role

| Route Prefix          | Minimum Role Required      |
| --------------------- | -------------------------- |
| `/` (public)          | None (unauthenticated)     |
| `/login`, `/register` | None                       |
| `/dashboard/*`        | `user` (any authenticated) |
| `/organizer/*`        | `organizer`                |
| `/admin/*`            | `admin`                    |
| `/superadmin/*`       | `superadmin`               |

---

## File References

| File                                       | Purpose                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `src/types/rbac.types.ts`                  | Type definitions: `AppRole`, `Permission`, `ROLE_HIERARCHY`, `DEFAULT_ROLE_PERMISSIONS`, `PlatformSettings`, `FeatureFlags` |
| `src/lib/rbac.ts`                          | Core permission resolution engine (5-step chain)                                                                            |
| `src/hooks/useRBAC.ts`                     | React hooks for permission checks in components                                                                             |
| `src/lib/constants.ts`                     | `UserRole` enum used in route guards                                                                                        |
| `src/components/common/PermissionGate.tsx` | Declarative permission wrapper component                                                                                    |
| `src/components/common/FeatureGate.tsx`    | Declarative feature flag wrapper component                                                                                  |
| `src/routes/ProtectedRoute.tsx`            | Authentication guard (redirects to login)                                                                                   |
| `src/routes/RoleRoute.tsx`                 | Role-based route guard                                                                                                      |
| `src/store/zustand/stores.ts`              | Auth store (user role)                                                                                                      |
| `src/store/zustand/settingsStore.ts`       | Settings store (platform & org settings)                                                                                    |
| `src/services/settingsService.ts`          | Firestore CRUD for settings                                                                                                 |

---

## Known Issues & Limitations

| Issue                  | Details                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Permission inheritance | Higher roles don't automatically inherit lower role permissions; each role has an explicit permissions list |
| Dynamic permissions    | No UI for admins to create custom permissions; all permissions are hardcoded in `rbac.types.ts`             |
| Session invalidation   | Changing a user's role doesn't force-logout active sessions; takes effect on next auth check                |
| Org-level overrides    | Organization settings can only restrict (not expand) role permissions                                       |
| 2FA enforcement        | Policy exists in settings but actual 2FA flow implementation is pending                                     |
| IP whitelisting        | Defined in settings but not enforced at the application level yet                                           |
| Audit trail            | Permission check results are not logged for forensic analysis                                               |
