# 👑 FlowGateX — Super Admin Module Documentation

> **Level 3 — Unconditional System Authority.**  
> The Super Admin is the apex role in FlowGateX's 4-tier RBAC hierarchy. No permission check, feature flag, or organizational restriction can block a Super Admin. This document covers every feature, permission, page, UI component, and backend service required to build and operate the Super Admin module.

---

## 📌 Table of Contents

1. [Role Overview](#1-role-overview)
2. [Permission Model](#2-permission-model)
3. [Access Resolution Engine](#3-access-resolution-engine)
4. [Required Pages & UI Descriptions](#4-required-pages--ui-descriptions)
5. [UI Components](#5-ui-components)
6. [Backend Services & Cloud Functions](#6-backend-services--cloud-functions)
7. [Firestore Schema](#7-firestore-schema)
8. [Security & Audit](#8-security--audit)
9. [Navigation & Routing](#9-navigation--routing)
10. [State Management](#10-state-management)

---

## 1. Role Overview

| Property             | Value                                                   |
| -------------------- | ------------------------------------------------------- |
| **Role Name**        | Super Admin                                             |
| **Level**            | 3 (highest in hierarchy)                                |
| **Role Key**         | `superadmin`                                            |
| **Permission Scope** | All resources, all actions — unconditional              |
| **Assignable By**    | Existing Super Admins only                              |
| **Revocable By**     | Existing Super Admins only (cannot self-demote)         |
| **Max Instances**    | Configurable (default: no hard cap, recommended ≤5)     |
| **2FA Required**     | Always enforced — cannot be disabled for this role      |
| **Session Timeout**  | Configurable per Super Admin (default: 30 minutes idle) |
| **IP Whitelist**     | Configurable per Super Admin account                    |

### Responsibilities

The Super Admin owns the **health, integrity, and configuration of the entire FlowGateX platform**. Responsibilities include:

- Creating, managing, and revoking Admin accounts
- Enforcing platform-wide security policies
- Managing global feature flags that control product availability
- Overriding any blocked action on any resource across all organizations
- Accessing and exporting all data across all organizations
- Configuring payment gateway credentials and service fee structures
- Deploying and rolling back IoT firmware across all venues
- Viewing and managing every audit log entry in the system
- Emergency platform lockdown and maintenance mode control

---

## 2. Permission Model

Super Admins bypass the permission resolution engine entirely via a **short-circuit override** in Layer 2 of the 5-layer check:

```
Layer 1: Account status check  →  PASS (not suspended/deleted)
Layer 2: isSuperAdmin()?       →  TRUE  →  ✅ ALLOW (exit immediately)
Layer 3–5: (never evaluated)
```

However, for auditability, all Super Admin actions are still **logged as if permissions were explicitly granted**, with the flag `bypassedViaRole: "superadmin"` attached to each audit entry.

### Explicit Permission Registry

Even though Super Admins bypass checks, the following permissions are **formally attributed** to the role in Firestore for RBAC display purposes:

#### 🗓 Event Permissions

| Permission         | Description                                       |
| ------------------ | ------------------------------------------------- |
| `event:create`     | Create events under any organization              |
| `event:read`       | Read any event, including unpublished drafts      |
| `event:update`     | Edit any event regardless of ownership            |
| `event:delete`     | Hard-delete any event and cascade-delete bookings |
| `event:publish`    | Force-publish or unpublish any event              |
| `event:feature`    | Mark events as platform-featured/trending         |
| `event:bulkImport` | Bulk-import events via JSON                       |

#### 👤 User Permissions

| Permission         | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `user:read`        | Read any user profile, including private fields          |
| `user:update`      | Edit any user profile field                              |
| `user:delete`      | Soft or hard delete any user account                     |
| `user:suspend`     | Suspend any account (blocks login)                       |
| `user:unsuspend`   | Reinstate any suspended account                          |
| `user:assignRole`  | Assign or change any user's role (including Admin)       |
| `user:revokeRole`  | Revoke any user's role, downgrade to Attendee            |
| `user:impersonate` | Log in as any user for debugging (logged + time-limited) |
| `user:export`      | Export full user data as CSV/JSON                        |

#### 🔐 Role & RBAC Permissions

| Permission              | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `role:create`           | Define new custom roles (future extensibility)     |
| `role:read`             | View all role definitions and assignment counts    |
| `role:update`           | Modify permission sets for non-superadmin roles    |
| `role:delete`           | Remove custom roles (built-in roles are immutable) |
| `role:assignSuperAdmin` | Elevate another user to Super Admin                |
| `role:revokeSuperAdmin` | Demote a Super Admin (cannot self-demote)          |

#### 💰 Finance Permissions

| Permission                  | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `finance:read`              | View all transactions across all organizations |
| `finance:export`            | Export financial records as CSV/JSON           |
| `finance:refund`            | Force-issue refunds for any booking            |
| `finance:configureFees`     | Set platform service fee (default ₹12/ticket)  |
| `finance:configureGateways` | Update Razorpay/Cashfree API credentials       |
| `finance:viewPayouts`       | View organizer payout statuses and amounts     |
| `finance:overridePayout`    | Manually trigger or block a payout             |

#### 🔩 IoT & Device Permissions

| Permission                | Description                                           |
| ------------------------- | ----------------------------------------------------- |
| `iot:read`                | View all devices across all venues                    |
| `iot:manage`              | Create, edit, decommission any IoT device             |
| `iot:command`             | Send remote commands (reboot, gate override, config)  |
| `iot:firmware`            | Upload new firmware versions to Firebase Storage      |
| `iot:deploy`              | Push firmware OTA to individual or all devices        |
| `iot:rollback`            | Roll back firmware to previous version on any device  |
| `iot:viewLogs`            | Access full device diagnostic logs                    |
| `iot:configureThresholds` | Set global sensor alert thresholds (temp, gas, crowd) |

#### 🏟 Venue & Crowd Permissions

| Permission              | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `venue:read`            | View all venue configurations                          |
| `venue:update`          | Edit venue capacity, layout, and IoT assignments       |
| `crowd:monitor`         | View real-time crowd data for any venue                |
| `crowd:configureAlerts` | Set or override overcapacity alert thresholds globally |

#### 🚨 Security Permissions

| Permission               | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `security:alert`         | View and manage all security alerts (metal, gas, etc.) |
| `security:clearAlert`    | Mark any alert as resolved                             |
| `security:viewIncidents` | Access complete incident history across all venues     |

#### ⚙️ Platform Configuration Permissions

| Permission                 | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `platform:featureFlags`    | Toggle all platform feature flags                    |
| `platform:maintenanceMode` | Enable/disable maintenance mode (blocks all access)  |
| `platform:settings`        | Edit all global platform settings                    |
| `platform:auditLogs`       | Read full audit log history                          |
| `platform:exportAuditLogs` | Export audit logs as CSV/JSON                        |
| `platform:systemHealth`    | View system health dashboard (errors, latency, etc.) |
| `platform:announcements`   | Create and broadcast platform-wide announcements     |
| `platform:ipWhitelist`     | Manage IP whitelists for admin access                |

---

## 3. Access Resolution Engine

```
Incoming Request
       │
       ▼
┌──────────────────────────────────┐
│  Layer 1: Account Status Check   │
│  user.status === 'active'?       │
└───────────────┬──────────────────┘
           YES  │  NO → DENY (403)
                ▼
┌──────────────────────────────────┐
│  Layer 2: Super Admin Override   │
│  user.role === 'superadmin'?     │
└───────────────┬──────────────────┘
           YES  │  NO → continue to Layer 3–5
                ▼
        ✅ ALLOW (all actions)
        Log: { bypassedViaRole: 'superadmin',
               action, resource, timestamp,
               performedBy: uid }
```

---

## 4. Required Pages & UI Descriptions

### 4.1 Super Admin Dashboard (`/superadmin`)

**Purpose:** Command center overview of platform health, key metrics, and pending actions.

**Layout:** Full-width, dark-themed dashboard with sidebar navigation.

**Sections:**

**A. Platform Health Bar (top strip)**

- Green/Yellow/Red status pill for: Firebase connectivity, MQTT broker, Payment gateways (Razorpay, Cashfree), IoT device network
- Click-through to detailed health sub-page
- Auto-refreshes every 30 seconds

**B. KPI Metric Cards (row of 6)**

- **Total Users** — count with ↑↓ delta vs. last 7 days
- **Active Events** — live count across all organizations
- **Total Revenue (Platform)** — aggregate with period toggle (7d / 30d / 90d)
- **Devices Online** — `X / Y devices` online indicator
- **Open Security Alerts** — red badge if >0
- **Pending Admin Approvals** — organizer upgrade requests awaiting review

**C. Recent Activity Feed**

- Live-updating list of last 20 audit log entries across the platform
- Each entry: avatar icon, user name, action description, resource, timestamp
- Color-coded by action type (create=green, delete=red, update=blue, auth=purple)
- "View All Logs" link → Audit Log page

**D. Revenue Trend Chart**

- Full-width line chart (Chart.js) — platform-wide revenue over selected period
- Toggle: All Organizations / Per Organization dropdown
- Cyan gradient fill beneath line, period selector: 7d / 30d / 90d / Custom

**E. IoT Fleet Status Summary**

- Mini cards per device type: Scanners, Crowd Monitors, Env Sensors, Security Checkpoints
- Each card: total devices, % online, last alert timestamp

**F. Quick Action Buttons**

- Enable Maintenance Mode (red toggle with confirm dialog)
- Create Admin Account
- Deploy Firmware Update
- Export Platform Data
- Broadcast Announcement

---

### 4.2 User Management Page (`/superadmin/users`)

**Purpose:** Full control over all user accounts across every organization.

**Layout:** Data table with filters sidebar + detail drawer.

**Components:**

**A. Filter Panel (left sidebar, collapsible)**

- Search bar (name, email, UID)
- Role filter: All / Attendee / Organizer / Admin / Super Admin
- Status filter: Active / Suspended / Deleted
- Registration date range picker
- Organization filter dropdown
- Sort: Newest / Oldest / Name A-Z / Most bookings

**B. Users Data Table**

| Column        | Content                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| Avatar + Name | Profile photo thumbnail + full name (clickable)                                |
| Email         | Masked by default (👁 toggle to reveal)                                        |
| Role          | Color-coded pill (Attendee=grey, Organizer=blue, Admin=orange, SuperAdmin=red) |
| Status        | Active (green dot) / Suspended (yellow dot) / Deleted (red dot)                |
| Joined        | Relative date (e.g., "3 months ago") + absolute on hover                       |
| Last Active   | Relative timestamp                                                             |
| Bookings      | Count with link to booking history                                             |
| Actions       | ⋮ context menu                                                                 |

**C. Row Context Menu (⋮)**

- View Profile
- Edit Profile
- Change Role → role picker modal
- Suspend Account (with reason input)
- Unsuspend Account
- Impersonate User (opens timed session modal, max 30 min)
- Export User Data (GDPR)
- Delete Account (soft delete with 30-day recovery window)
- Hard Delete (permanent, requires confirmation phrase input)

**D. User Detail Drawer (slides from right)**

- Full profile card: avatar, name, email, phone, UID, join date
- Role history timeline (who assigned what role and when)
- Activity summary: total bookings, total spent, events attended
- Security info: 2FA status, last login IP, session count
- Linked organizations (if Organizer or Admin)
- Linked IoT devices (if applicable)
- Audit log entries for this user (last 50)
- Action buttons: Edit, Suspend, Change Role, Impersonate, Export, Delete

**E. Bulk Actions Bar (appears when rows are selected)**

- Suspend Selected
- Assign Role to Selected
- Export Selected (CSV)
- Delete Selected

---

### 4.3 Role & Permissions Manager (`/superadmin/roles`)

**Purpose:** Visualize and manage the RBAC hierarchy; assign/revoke Super Admin role.

**Layout:** Two-panel — role list left, permission matrix right.

**A. Role List Panel (left)**

- Cards for each role: Attendee, Organizer, Admin, Super Admin
- Each card shows: role name, level badge, user count, last modified
- "Super Admin" card has a crown icon and red border accent
- Click card → loads permission matrix on right

**B. Permission Matrix Panel (right)**

- Groups permissions by resource domain (Event, User, Finance, IoT, Platform, etc.)
- Each permission row: `resource:action` label + description + toggle switch
- Super Admin row: all toggles forced ON and locked (with tooltip "Cannot modify — Super Admin has unconditional access")
- Admin row: toggles editable by Super Admin
- Save Changes button (only enabled if modifications were made)
- Change history: "Last edited by [name] on [date]" footer

**C. Super Admin Assignment Section**

- Current Super Admins list: avatar, name, email, assigned date, assigned by
- "Promote to Super Admin" button → opens search-and-confirm modal:
  - Search existing Admin by name/email
  - Show confirmation: "You are granting [name] unconditional system access. This action is logged and cannot be undone without Super Admin approval."
  - Require password re-authentication before confirming
- Revoke Super Admin: demotes to Admin, logged, requires confirmation

---

### 4.4 Platform Settings (`/superadmin/settings`)

**Purpose:** Global configuration of all platform-level settings.

**Layout:** Tabbed settings page (vertical tabs on left).

#### Tab 1: General

- Platform name, logo upload, favicon upload
- Support email, support URL
- Default timezone selector
- Default language / locale
- Terms of Service URL, Privacy Policy URL
- Cookie consent banner toggle

#### Tab 2: Feature Flags

- Toggle list for all platform features:

| Feature Flag               | Description                        | Default |
| -------------------------- | ---------------------------------- | ------- |
| `enableRegistration`       | Allow new user sign-ups            | ON      |
| `enableSocialLogin`        | Google / Facebook OAuth            | ON      |
| `enableEventCreation`      | Organizers can create events       | ON      |
| `enableIoTIntegration`     | IoT device management module       | ON      |
| `enableCrowdMonitoring`    | AI crowd analytics module          | ON      |
| `enableAnalyticsDashboard` | Revenue & analytics dashboards     | ON      |
| `enableAIChatbot`          | AI assistant feature               | OFF     |
| `enablePromoCode`          | Promo code creation and redemption | ON      |
| `enableRefunds`            | Automated refund processing        | ON      |
| `enablePushNotifications`  | FCM push notification delivery     | ON      |
| `enableWaitlist`           | Waitlist for sold-out events       | ON      |
| `maintenanceMode`          | Blocks all non-superadmin access   | OFF     |

- Each flag: label, description, ON/OFF toggle, last changed timestamp, changed by name
- Bulk actions: Enable All / Disable All (with confirmation)

#### Tab 3: Security Policies

- **Password Policy:** min length slider, toggle requirements (uppercase, lowercase, numbers, symbols)
- **2FA Enforcement:** per-role toggles (Super Admin: always forced ON, locked)
- **Session Timeout:** per-role dropdown (15 min / 30 min / 1 hr / 4 hr / 24 hr)
- **Max Login Attempts:** number input (default: 5) + lockout duration
- **IP Whitelist:** tag-input for CIDR ranges, per-role or platform-wide
- **CORS Origins:** list input for allowed frontend origins

#### Tab 4: Payment Configuration

- **Service Fee:** number input (₹ per ticket), effective date picker
- **Razorpay:** Key ID + Key Secret (masked), webhook secret, test/live mode toggle
- **Cashfree:** App ID + Secret Key (masked), webhook secret, test/live mode toggle
- **Payment Fallback Order:** drag-and-drop ordering of gateways
- **Refund Policy:** refund window (days), auto-approve threshold (₹)

#### Tab 5: IoT Global Thresholds

- Temperature warning threshold (°C) slider
- Temperature critical threshold (°C) slider
- Gas level warning (ppm) input
- Gas level critical (ppm) input
- Crowd capacity warning (% of venue capacity) slider
- Crowd capacity critical (%) slider
- Device offline alert delay (minutes)
- Battery low warning threshold (%)

#### Tab 6: Notifications & Alerts

- Email notification targets: per-event-type toggles with recipient email inputs
- SMS alerts: Twilio sender number, recipient list for emergency events
- Push notification topics: list of FCM topics with toggle
- Alert digest frequency: Real-time / Hourly / Daily summary

---

### 4.5 Admin Management (`/superadmin/admins`)

**Purpose:** Manage all Admin-level accounts — create, configure, and revoke.

**Layout:** Card grid of existing Admins + create panel.

**A. Admin Card Grid**

Each card shows:

- Avatar, name, email
- Date promoted to Admin + promoted by
- Linked organization(s)
- Last active timestamp
- Permissions summary (# of active permissions vs total)
- Status badge: Active / Suspended

Action buttons on each card:

- View Details
- Edit Permissions (opens permission modal scoped to Admin role)
- Suspend / Unsuspend
- Promote to Super Admin
- Demote to Organizer
- View Audit Log (this admin only)

**B. Create Admin Modal**

- Search existing users by name/email
- Select user from results
- Optional: assign to specific organization
- Optional: custom permission overrides (restrict below Admin defaults)
- Confirmation with password re-auth
- On confirm: role update in Firestore + audit log entry + notification email to promoted user

---

### 4.6 Organization Management (`/superadmin/organizations`)

**Purpose:** Oversee all organizations (organizer accounts and their events).

**Layout:** Searchable table with expand-to-detail.

**Table Columns:**

- Organization name + logo thumbnail
- Owner name + email
- Member count (Organizers under this org)
- Active events count
- Total revenue generated
- Status: Active / Suspended / Under Review
- Created date
- Actions: View, Edit, Suspend, Delete

**Organization Detail Page (`/superadmin/organizations/:orgId`)**

- Overview: name, logo, owner, creation date, description
- Members table: all users in this org with roles
- Events list: all events created under this org (published + drafts)
- Financial summary: total bookings, total revenue, outstanding payouts
- IoT devices assigned to this org's venues
- Audit log: all actions taken within this org (last 100 entries)
- Danger Zone: Suspend Organization / Delete Organization / Transfer Ownership

---

### 4.7 IoT Fleet Management (`/superadmin/iot`)

**Purpose:** Platform-wide oversight and control of all IoT devices across all venues.

**Layout:** Map view + list view toggle, with device detail panel.

**A. Fleet Overview Stats Bar**

- Total Devices / Online / Offline / Maintenance
- Devices by type: pie chart
- Firmware compliance: % of devices on latest firmware version
- Active alerts count (red badge)

**B. Device List Table**

| Column        | Content                                                   |
| ------------- | --------------------------------------------------------- |
| Device Name   | Icon (type) + name + ID                                   |
| Type          | Scanner / Crowd Monitor / Env Sensor / Security / Display |
| Venue         | Venue name + organization name                            |
| Status        | Online (green) / Offline (red) / Maintenance (yellow)     |
| Firmware      | Version + "Up to date" / "Update available" badge         |
| Battery       | Progress bar (color-coded: green/orange/red)              |
| Last Ping     | Relative time                                             |
| Active Alerts | Count badge                                               |
| Actions       | ⋮ context menu                                            |

**C. Device Context Menu**

- View Live Data
- Send Command → sub-menu: Reboot / Open Gate / Close Gate / Calibrate Sensor / Enter Maintenance Mode
- Push Firmware Update
- Roll Back Firmware
- View Diagnostic Logs
- Edit Configuration
- Decommission Device

**D. Firmware Management Panel (sub-page: `/superadmin/iot/firmware`)**

- Firmware version list: version number, release date, changelog, file size
- Upload New Firmware: drag-and-drop binary upload + SHA-256 display + release notes input
- Deployment targets: select All Devices / By Type / By Venue / Individual devices
- Schedule deployment: Immediate / Schedule time picker
- Deployment status tracker: progress bar per device
- Rollback: one-click rollback to previous version per device or in bulk

---

### 4.8 Financial Overview (`/superadmin/finance`)

**Purpose:** Complete financial visibility across the entire platform.

**Layout:** Dashboard with charts + drilldown tables.

**A. Revenue Summary Cards**

- Gross Platform Revenue (all time / period)
- Platform Service Fee Collected (₹12 × tickets)
- Total Refunds Issued
- Net Platform Revenue
- Pending Payouts to Organizers
- Failed Transactions (requires attention)

**B. Revenue Trend Chart**

- Dual-line chart: Gross Revenue vs. Net Revenue over time
- Bar overlay: Refunds
- Period: 7d / 30d / 90d / Custom date range
- Toggle: All orgs / Per org selector

**C. Transactions Table**

| Column         | Content                                        |
| -------------- | ---------------------------------------------- |
| Transaction ID | Truncated + copy icon                          |
| User           | Name + email                                   |
| Event          | Event name + org name                          |
| Amount         | ₹ amount (color: green=success, red=refund)    |
| Gateway        | Razorpay / Cashfree / Mock pill                |
| Status         | Paid / Refunded / Failed / Pending             |
| Date           | Absolute timestamp                             |
| Actions        | View Details / Force Refund / Download Receipt |

**D. Force Refund Modal**

- Shows: booking summary, original payment details, refund amount input
- Reason input (required for audit)
- Warning: "This bypasses eligibility checks and is logged as a Super Admin override."
- Confirm button with password re-auth

**E. Payout Management Sub-page (`/superadmin/finance/payouts`)**

- Table of pending organizer payouts
- Columns: Organizer, Organization, Amount, Events Covered, Status, Requested Date
- Actions: Approve / Block / Override (manually set payout amount)

---

### 4.9 Audit Log Viewer (`/superadmin/audit-logs`)

**Purpose:** Complete, tamper-evident record of all system activity.

**Layout:** Full-width filterable log stream.

**A. Filter Controls**

- Date range picker
- Actor search (user name / UID)
- Action type multi-select (create, update, delete, login, role change, IoT command, etc.)
- Resource type multi-select (event, user, booking, device, etc.)
- Severity filter: Info / Warning / Critical
- Organization filter
- Super Admin bypass filter: "Show Super Admin override entries only"

**B. Log Entry List**

Each entry displays:

```
[TIMESTAMP]  [SEVERITY BADGE]  [ACTOR AVATAR + NAME]
  Action: user:assignRole
  Resource: users/uid_abc123
  Details: Role changed from 'organizer' → 'admin'
  Performed by: superadmin@flowgatex.com
  IP: 203.0.113.42
  Bypass Flag: bypassedViaRole: 'superadmin'
  Session ID: sess_xyz789
  [Expand ▼ for full payload diff]
```

**C. Export Controls**

- Export as CSV / JSON
- Date range scoped export
- Filtered export (exports only current filter result)
- Export size warning if >10,000 entries

**D. Log Integrity Indicator**

- Hash chain visualization: each log entry references the SHA-256 hash of the previous entry
- "Integrity: Verified ✅" / "Integrity: Tampered ❌" status badge

---

### 4.10 Security Alerts Center (`/superadmin/security`)

**Purpose:** Centralized monitoring and resolution of all security and safety incidents.

**Layout:** Alert feed + venue map overlay + resolution workflow.

**A. Alert Summary Bar**

- Active Alerts (by type): Metal Detector / Gas Sensor / Temperature / Overcrowding / Tampered QR
- Resolved Today / This Week counts
- Average resolution time

**B. Live Alert Feed**

- Real-time WebSocket stream of incoming alerts
- Each alert card:
  - Alert type icon + severity (Warning / Critical / Emergency)
  - Venue name + gate/sensor ID
  - Triggered at timestamp
  - Brief description ("Gas level: 1,450 ppm — exceeds threshold of 1,000 ppm")
  - Camera snapshot (if ESP32-CAM #2 captured an image)
  - Status: New / Acknowledged / Resolved
  - Actions: Acknowledge / Mark Resolved / Escalate / View Venue / View Device

**C. Alert Detail Modal**

- Full incident data: sensor readings at time of trigger, gate status, current occupancy
- Timeline: Triggered → Acknowledged by [name] at [time] → Resolved at [time]
- Response notes (free text input)
- Related audit log entries
- Export Incident Report (PDF)

**D. Historical Incidents Table**

- All past alerts with full details
- Filter: date range / venue / type / severity / resolution status
- Bulk actions: Export / Mark Resolved / Archive

---

### 4.11 Platform Announcements (`/superadmin/announcements`)

**Purpose:** Create and broadcast system-wide messages to all users or specific roles.

**Layout:** Announcement composer + sent history.

**A. Compose Panel**

- Title input
- Message body (rich text editor with Markdown support)
- Target audience: All Users / Attendees / Organizers / Admins
- Delivery channels: In-app banner / Push notification / Email
- Schedule: Send Now / Schedule (datetime picker)
- Priority: Info (blue) / Warning (yellow) / Critical (red)
- Expiry: date picker (announcement auto-dismisses from banners)
- Preview: renders final appearance across channels

**B. Sent Announcements Table**

- Columns: Title, Target, Channels, Sent At, Sent By, Reach (recipients), Expiry, Status
- Actions: View / Edit (if not sent yet) / Resend / Delete

---

### 4.12 Impersonation Session Page (`/superadmin/impersonate`)

**Purpose:** Temporarily log in as any user for debugging and support — fully logged.

**Flow:**

1. Super Admin navigates to User Management, selects user, clicks "Impersonate"
2. **Impersonation Confirmation Modal:**
   - Warning banner: "You are about to impersonate [User Name]. All actions taken during this session will be logged against YOUR account, not the target user's account."
   - Session duration selector: 5 / 10 / 15 / 30 minutes
   - Reason input (required): dropdown + free text
   - Password re-authentication required
3. On confirm: opens impersonated session in a new browser tab
4. **Impersonation Session UI:**
   - Persistent red banner at top: "🔴 IMPERSONATION ACTIVE — You are acting as [User Name] | [Time Remaining] | End Session"
   - All UI rendered from the target user's perspective
   - All API calls tagged with `impersonatedBy: superAdminUID`
5. On session end (timeout or manual): returns to Super Admin dashboard, shows session summary log

---

## 5. UI Components

### 5.1 SuperAdminGuard (Route Wrapper)

```tsx
// Renders children only if authenticated user has role === 'superadmin'
// Redirects to /unauthorized if check fails
// Always verifies role from Firestore (not just local state) to prevent token manipulation

<SuperAdminGuard>
  <SuperAdminLayout>
    <Outlet />
  </SuperAdminLayout>
</SuperAdminGuard>
```

---

### 5.2 SuperAdminLayout

- **Left Sidebar:** collapsible, dark background (`#0F1117`), 240px wide
  - FlowGateX logo + "Super Admin" role badge (red crown icon)
  - Navigation links with icons (see Section 9)
  - Bottom section: current admin avatar, name, "Sign Out" button
- **Top Bar:** breadcrumb navigation, global search (searches users, events, devices), notification bell (security alerts), platform health indicator pill
- **Main Content Area:** scrollable, padding 24px, max-width 1440px centered

---

### 5.3 PermissionToggleMatrix

Reusable component for displaying and editing permission sets.

```tsx
<PermissionToggleMatrix
  role="admin"
  permissions={permissionDefinitions}
  currentGrants={currentRolePermissions}
  readonly={role === 'superadmin'} // Super Admin permissions are locked
  onChange={updated => handlePermissionUpdate(updated)}
/>
```

Props:

- `role`: role key string
- `permissions`: full permission registry from Firestore
- `currentGrants`: array of currently granted permission strings
- `readonly`: boolean — locks all toggles
- `onChange`: callback with updated grants array

---

### 5.4 AuditLogEntry

Displays a single audit log entry in the log viewer list.

Props:

- `entry`: AuditLog Firestore document
- `expanded`: boolean (controlled)
- `onExpand`: callback

Visual states:

- Info: white background
- Warning: amber left border
- Critical: red left border + red icon

---

### 5.5 ImpersonationBanner

Sticky banner rendered at top of impersonated session.

```tsx
<ImpersonationBanner
  targetUser={targetUser}
  expiresAt={sessionExpiry}
  onEndSession={handleEndSession}
/>
```

- Red background, white text
- Countdown timer (live)
- "End Session" button with confirm prompt

---

### 5.6 AlertCard

Displays a security/safety alert in the Alerts Center.

Props:

- `alert`: SecurityAlert object
- `onAcknowledge`, `onResolve`, `onEscalate`

Visual states by severity:

- Warning: yellow border
- Critical: orange border + pulsing indicator
- Emergency: red border + animated flash + audible chime (if enabled in browser)

---

### 5.7 DeviceCommandModal

Modal for sending remote commands to IoT devices.

```tsx
<DeviceCommandModal
  device={device}
  onSend={(command, params) => sendDeviceCommand(device.id, command, params)}
/>
```

Commands available:

- `REBOOT` — no params
- `OPEN_GATE` — params: `{ gateId: 1|2, duration: number }`
- `CLOSE_GATE` — params: `{ gateId: 1|2 }`
- `CALIBRATE_SENSOR` — params: `{ sensorType: 'dht22'|'mq2' }`
- `SET_CONFIG` — params: JSON config object
- `ENTER_MAINTENANCE` — no params
- `EXIT_MAINTENANCE` — no params
- `REQUEST_SNAPSHOT` — triggers ESP32-CAM #2 to send live snapshot

---

### 5.8 FirmwareDeployModal

Multi-step modal for OTA firmware deployment.

```
Step 1: Select Firmware Version
Step 2: Select Target Devices (with filter by type/venue)
Step 3: Schedule (Now / Later)
Step 4: Confirmation Summary (device count, risk warning)
Step 5: Deployment Progress (live per-device status)
```

---

### 5.9 MaintenanceModeToggle

Prominent toggle on Dashboard for emergency platform lockdown.

```tsx
<MaintenanceModeToggle isActive={maintenanceModeEnabled} onToggle={handleMaintenanceToggle} />
```

- When OFF: grey pill, "Enable Maintenance Mode" label
- When toggling ON: opens modal with:
  - Warning: "This will immediately block access for ALL users except Super Admins."
  - Optional: custom maintenance message for users
  - Duration selector: Until Manually Disabled / 30 min / 1 hr / 4 hr
  - Confirm button (requires typing "MAINTENANCE" to enable)
- When ON: blinking red pill, elapsed time display, "Disable" button

---

### 5.10 ConfirmDangerAction

Reusable modal for high-stakes, irreversible actions.

```tsx
<ConfirmDangerAction
  title="Permanently Delete User"
  description="This action cannot be undone. Type the user's email to confirm."
  confirmPhrase={user.email}
  requireReAuth={true}
  onConfirm={handleDeleteUser}
/>
```

- Red modal header
- Explanation text
- Phrase-match text input (must type exact string)
- Optional: Firebase password re-authentication step
- Confirm button only enables when phrase matches AND re-auth passes

---

## 6. Backend Services & Cloud Functions

### 6.1 `assignRole` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin only (verified server-side)

```
Input:  { targetUid: string, newRole: Role, reason: string }
Process:
  1. Verify caller is superadmin via Admin SDK custom claims
  2. Validate targetUid exists in Firestore
  3. Check: caller !== targetUid (cannot self-demote)
  4. Check: if newRole === 'superadmin', verify caller has role:assignSuperAdmin
  5. Update users/{targetUid}.role in Firestore
  6. Update Firebase Auth custom claims via Admin SDK
  7. Write audit log entry (action: 'user:assignRole', old/new role, reason, caller UID)
  8. Send notification email to target user
Output: { success: true, updatedRole: newRole }
```

---

### 6.2 `impersonateUser` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin only

```
Input:  { targetUid: string, durationMinutes: number, reason: string }
Process:
  1. Verify caller is superadmin
  2. Generate short-lived Firebase custom token for targetUid
     (token includes claim: { impersonatedBy: callerUid, expiresAt: now + duration })
  3. Write audit log: { action: 'user:impersonate', targetUid, duration, reason, callerUid }
  4. Return custom token to client
Client:
  5. Client calls signInWithCustomToken(token)
  6. All subsequent requests tagged with impersonation claim
  7. ImpersonationBanner detects claim and renders warning UI
  8. Token auto-expires → session ends → client signs out + redirects
Output: { customToken: string, expiresAt: ISO timestamp }
```

---

### 6.3 `toggleFeatureFlag` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin only

```
Input:  { flagKey: string, enabled: boolean, reason?: string }
Process:
  1. Verify caller is superadmin
  2. Validate flagKey exists in known flags registry
  3. Update SettingInfo/featureFlags.{flagKey} in Firestore
  4. Propagate change via Firestore real-time listeners (all connected clients pick up change)
  5. Write audit log
Output: { flagKey, enabled, updatedAt }
```

---

### 6.4 `deployFirmware` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin or Admin with `iot:deploy` permission

```
Input:  { firmwareVersion: string, targetDeviceIds: string[], scheduledAt?: ISO timestamp }
Process:
  1. Verify caller permission
  2. Validate firmware binary exists in Firebase Storage at /firmware/{version}.bin
  3. Verify SHA-256 checksum matches stored metadata
  4. For each device in targetDeviceIds:
     a. Write command to Firestore: devices/{deviceId}/pendingCommand = { type: 'OTA_UPDATE', firmwareUrl, checksum, scheduledAt }
     b. MQTT publish to devices/{deviceId}/commands topic
  5. Write audit log per device
  6. Return deployment batch ID for progress tracking
Output: { batchId: string, targetCount: number, scheduledAt }
```

---

### 6.5 `sendDeviceCommand` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin or Admin with `iot:command`

```
Input:  { deviceId: string, command: DeviceCommand, params?: object }
Process:
  1. Verify caller permission
  2. Validate deviceId in Firestore
  3. Validate command is in allowed command list
  4. Write to Firestore: devices/{deviceId}/pendingCommand
  5. Publish to MQTT topic: devices/{deviceId}/commands
  6. Wait for acknowledgement via devices/{deviceId}/commandAck (30s timeout)
  7. Write audit log with command details and ack status
Output: { acknowledged: boolean, ackedAt?: timestamp }
```

---

### 6.6 `toggleMaintenanceMode` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin only

```
Input:  { enabled: boolean, message?: string, durationMinutes?: number }
Process:
  1. Verify caller is superadmin
  2. Update SettingInfo/platform.maintenanceMode in Firestore
  3. If durationMinutes set: schedule auto-disable via Cloud Tasks
  4. Propagate via real-time listeners (all clients redirect to maintenance screen)
  5. Write audit log: { action: 'platform:maintenanceMode', enabled, message, caller }
  6. Send email notification to all Admins and Super Admins
Output: { enabled, expiresAt?: timestamp }
```

---

### 6.7 `forceRefund` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin only (bypasses eligibility checks)

```
Input:  { bookingId: string, reason: string, amount?: number }
Process:
  1. Verify caller is superadmin
  2. Fetch booking + transaction from Firestore
  3. Determine refund amount (full or partial)
  4. Call Razorpay/Cashfree refund API
  5. On success:
     a. Update transaction.status = 'refunded'
     b. Update booking.status = 'refunded'
     c. Update all tickets in booking: status = 'cancelled'
     d. Restore inventory: event.ticketTiers[tier].available += qty
  6. Write audit log: { action: 'finance:refund', bookingId, amount, reason, bypassFlag: 'superadmin' }
  7. Send confirmation email to user
Output: { refundId, refundedAmount, currency }
```

---

### 6.8 `exportAuditLogs` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin only

```
Input:  { filters: AuditLogFilters, format: 'csv' | 'json' }
Process:
  1. Verify caller is superadmin
  2. Query audit_logs collection with provided filters
  3. Stream results to CSV/JSON format
  4. Upload generated file to Firebase Storage: /exports/{uid}/{timestamp}.{format}
  5. Generate signed download URL (expires 1 hour)
  6. Write audit log: { action: 'platform:exportAuditLogs', filterSummary, rowCount, caller }
Output: { downloadUrl: string, expiresAt: ISO timestamp, rowCount: number }
```

---

### 6.9 `broadcastAnnouncement` Cloud Function

**Trigger:** HTTPS callable  
**Auth:** Super Admin only

```
Input:  { title, body, targetRoles, channels, priority, scheduledAt?, expiresAt? }
Process:
  1. Verify caller is superadmin
  2. Resolve target user UIDs from Firestore by role filter
  3. If channels includes 'push': send FCM multicast to topic(s)
  4. If channels includes 'email': queue via SendGrid to resolved UIDs
  5. If channels includes 'inApp': write to announcements/{id} in Firestore (clients pick up via listener)
  6. Write audit log
Output: { announcementId, recipientCount, scheduledAt }
```

---

## 7. Firestore Schema

### `users/{uid}` — Super Admin relevant fields

```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "role": "superadmin",
  "roleAssignedAt": "timestamp",
  "roleAssignedBy": "uid_string",
  "status": "active | suspended | deleted",
  "twoFactorEnabled": true,
  "twoFactorEnforced": true,
  "ipWhitelist": ["203.0.113.0/24"],
  "sessionTimeout": 1800,
  "lastLoginAt": "timestamp",
  "lastLoginIp": "string",
  "createdAt": "timestamp",
  "permissions": ["*"],
  "customClaims": {
    "role": "superadmin",
    "level": 3
  }
}
```

---

### `audit_logs/{id}` — Audit Log Document

```json
{
  "id": "auto-generated",
  "action": "user:assignRole",
  "resource": "users/uid_abc123",
  "resourceType": "user",
  "performedBy": "uid_superadmin",
  "performedByRole": "superadmin",
  "bypassedViaRole": "superadmin",
  "impersonating": null,
  "details": {
    "previousValue": { "role": "organizer" },
    "newValue": { "role": "admin" },
    "reason": "Promoted to manage Mumbai venue operations"
  },
  "severity": "warning",
  "ipAddress": "203.0.113.42",
  "sessionId": "sess_xyz789",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "timestamp",
  "previousHash": "sha256_of_previous_entry",
  "entryHash": "sha256_of_this_entry"
}
```

---

### `SettingInfo/platform` — Platform Settings Document

```json
{
  "maintenanceMode": false,
  "maintenanceMessage": "We'll be back shortly.",
  "maintenanceExpiresAt": null,
  "featureFlags": {
    "enableRegistration": true,
    "enableSocialLogin": true,
    "enableEventCreation": true,
    "enableIoTIntegration": true,
    "enableCrowdMonitoring": true,
    "enableAnalyticsDashboard": true,
    "enableAIChatbot": false,
    "enablePromoCode": true,
    "enableRefunds": true,
    "enablePushNotifications": true,
    "enableWaitlist": true
  },
  "securityPolicy": {
    "passwordMinLength": 8,
    "requireUppercase": true,
    "requireNumbers": true,
    "requireSymbols": true,
    "maxLoginAttempts": 5,
    "lockoutDurationMinutes": 15,
    "sessionTimeouts": {
      "attendee": 86400,
      "organizer": 14400,
      "admin": 3600,
      "superadmin": 1800
    },
    "twoFactorEnforcedRoles": ["superadmin", "admin"]
  },
  "serviceFee": {
    "amountPerTicket": 12,
    "currency": "INR",
    "effectiveFrom": "timestamp"
  },
  "iotThresholds": {
    "tempWarnCelsius": 30,
    "tempCriticalCelsius": 35,
    "gasWarnPpm": 500,
    "gasCriticalPpm": 1000,
    "crowdWarnPercent": 85,
    "crowdCriticalPercent": 95,
    "deviceOfflineAlertMinutes": 5,
    "batteryLowPercent": 20
  },
  "updatedAt": "timestamp",
  "updatedBy": "uid_string"
}
```

---

### `announcements/{id}` — Announcement Document

```json
{
  "id": "auto-generated",
  "title": "Scheduled Maintenance",
  "body": "The platform will be unavailable from 2–4 AM IST.",
  "targetRoles": ["all"],
  "channels": ["inApp", "push", "email"],
  "priority": "warning",
  "createdBy": "uid_superadmin",
  "scheduledAt": "timestamp",
  "sentAt": "timestamp",
  "expiresAt": "timestamp",
  "recipientCount": 4821,
  "status": "sent | scheduled | draft | expired"
}
```

---

## 8. Security & Audit

### Authentication Requirements

- **2FA:** Always required for Super Admin accounts — cannot be bypassed or disabled even by a Super Admin
- **Re-authentication:** Required for all destructive actions (delete, role change, maintenance mode, force refund)
- **IP Whitelisting:** Super Admin accounts can be restricted to specific IP ranges via `users/{uid}.ipWhitelist`
- **Session Timeout:** Default 30-minute idle timeout; configurable per-account in Settings

### Audit Log Integrity

Every audit log entry includes:

- A `previousHash` field containing the SHA-256 hash of the immediately preceding entry
- An `entryHash` field: SHA-256 hash of the current entry's content + `previousHash`

This creates a **hash chain** — any tampering with historical entries invalidates all subsequent hashes, detectable via the Audit Log Viewer's integrity check.

### Impersonation Safeguards

- All actions during an impersonation session are attributed to the Super Admin, not the target user
- Target user's activity log shows NO entries from the impersonation session
- Target user receives an email notification after the impersonation session ends
- Impersonation sessions cannot be nested (cannot impersonate while already impersonating)
- Impersonated sessions cannot access `/superadmin/*` routes even if the target has admin role

### Firestore Security Rules (Super Admin)

```javascript
// Firestore security rules — Super Admin bypasses all resource-level rules
function isSuperAdmin() {
  return request.auth != null &&
    request.auth.token.role == 'superadmin' &&
    request.auth.token.level == 3;
}

// Applied at the top of all rules:
allow read, write: if isSuperAdmin();
```

---

## 9. Navigation & Routing

### Sidebar Navigation Structure

```
👑 Super Admin
├── 🏠  Dashboard                  /superadmin
├── 👥  User Management            /superadmin/users
│   └── 👤  User Detail            /superadmin/users/:uid
├── 🔐  Roles & Permissions        /superadmin/roles
├── 🏢  Organizations              /superadmin/organizations
│   └── 🏢  Org Detail             /superadmin/organizations/:orgId
├── 👔  Admin Management           /superadmin/admins
├── 📡  IoT Fleet                  /superadmin/iot
│   ├── 📋  Device List            /superadmin/iot
│   └── 💾  Firmware               /superadmin/iot/firmware
├── 💰  Finance                    /superadmin/finance
│   └── 💸  Payouts                /superadmin/finance/payouts
├── 🚨  Security Alerts            /superadmin/security
├── 📋  Audit Logs                 /superadmin/audit-logs
├── 📢  Announcements              /superadmin/announcements
└── ⚙️   Platform Settings          /superadmin/settings
    ├── General                   /superadmin/settings/general
    ├── Feature Flags             /superadmin/settings/flags
    ├── Security Policies         /superadmin/settings/security
    ├── Payment Config            /superadmin/settings/payment
    ├── IoT Thresholds            /superadmin/settings/iot
    └── Notifications             /superadmin/settings/notifications
```

### Route Guards

```tsx
// All superadmin routes are wrapped:
<Route
  path="/superadmin/*"
  element={
    <RequireAuth>
      {' '}
      // Must be logged in
      <Require2FA>
        {' '}
        // Must have 2FA active
        <RequireRole role="superadmin">
          {' '}
          // Must be superadmin
          <SuperAdminLayout>
            <Outlet />
          </SuperAdminLayout>
        </RequireRole>
      </Require2FA>
    </RequireAuth>
  }
/>
```

---

## 10. State Management

### Zustand Store: `useSuperAdminStore`

```ts
interface SuperAdminStore {
  // Platform state
  platformSettings: PlatformSettings | null;
  featureFlags: FeatureFlags | null;
  maintenanceMode: boolean;

  // UI state
  selectedUser: User | null;
  selectedOrg: Organization | null;
  selectedDevice: IoTDevice | null;
  activeAlerts: SecurityAlert[];
  auditLogFilters: AuditLogFilters;

  // Actions
  fetchPlatformSettings: () => Promise<void>;
  toggleFeatureFlag: (key: string, enabled: boolean) => Promise<void>;
  setMaintenanceMode: (enabled: boolean, message?: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  setSelectedDevice: (device: IoTDevice | null) => void;
  resolveAlert: (alertId: string, notes: string) => Promise<void>;
  setAuditLogFilters: (filters: Partial<AuditLogFilters>) => void;
}
```

### Real-Time Subscriptions (Firestore Listeners)

The Super Admin module maintains persistent real-time listeners for:

| Listener          | Collection / Doc                              | Updates                             |
| ----------------- | --------------------------------------------- | ----------------------------------- |
| Platform Settings | `SettingInfo/platform`                        | Feature flags, maintenance mode     |
| Active Alerts     | `security_alerts` where `status == 'new'`     | New security events                 |
| Device Fleet      | `devices`                                     | Online/offline transitions, battery |
| Audit Log Stream  | `audit_logs` orderBy timestamp desc limit 20  | Recent activity feed                |
| Announcements     | `announcements` where `status == 'scheduled'` | Upcoming broadcasts                 |

---

> **Super Admin access is the platform's master key — granted sparingly, wielded with full auditability, and protected by the strongest authentication requirements FlowGateX enforces.**

---

_© 2026 FlowGateX. All rights reserved._
