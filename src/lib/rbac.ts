// =============================================================================
// RBAC PERMISSION ENGINE
// =============================================================================
// Central permission evaluation engine. all permission checks flow through here.
//
// Resolution order:
// 1. Account status check (suspended/deleted → deny all)
// 2. Super Admin override (superadmin → allow everything)
// 3. Platform feature flag check (if feature disabled → deny)
// 4. Organization-level permission restriction (org settings may deny)
// 5. Role-based default permission check
// =============================================================================

import type {
  AppRole,
  Permission,
  PlatformSettings,
  OrganizationSettings,
  FeatureFlags,
  OrgRolePermissions,
  AccountStatus,
} from '@/types/rbac.types';
import {
  ROLE_HIERARCHY,
  DEFAULT_ROLE_PERMISSIONS,
} from '@/types/rbac.types';

// =============================================================================
// CORE PERMISSION CHECK
// =============================================================================

export interface PermissionContext {
  role: AppRole;
  accountStatus: AccountStatus;
  organizationId?: string;
  platformSettings: PlatformSettings | null;
  organizationSettings: OrganizationSettings | null;
}

/**
 * Check if the user has a specific permission.
 * This is the SINGLE source of truth for all permission decisions.
 */
export function hasPermission(
  ctx: PermissionContext,
  permission: Permission,
): boolean {
  // 1. Account status gate
  if (ctx.accountStatus !== 'active') {
    return false;
  }

  // 2. Super Admin bypass
  if (ctx.role === 'superadmin') {
    return true;
  }

  // 3. Platform feature flag gate
  if (ctx.platformSettings && !isFeatureAllowed(ctx.platformSettings, permission)) {
    return false;
  }

  // 4. Organization-level restriction (only for organizer role)
  if (
    ctx.role === 'organizer' &&
    ctx.organizationSettings &&
    !isOrgPermissionAllowed(ctx.organizationSettings, permission)
  ) {
    return false;
  }

  // 5. Default role permission check
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[ctx.role] ?? [];
  return rolePerms.includes(permission);
}

/**
 * Check multiple permissions at once — returns true if ALL are granted.
 */
export function hasAllPermissions(
  ctx: PermissionContext,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(ctx, p));
}

/**
 * Check multiple permissions — returns true if ANY is granted.
 */
export function hasAnyPermission(
  ctx: PermissionContext,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(ctx, p));
}

// =============================================================================
// ROLE HIERARCHY CHECKS
// =============================================================================

/**
 * Check if `role` has equal or higher authority than `requiredRole`.
 */
export function isRoleAtLeast(role: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a user's role is in a list of allowed roles.
 */
export function isRoleAllowed(role: AppRole, allowedRoles: AppRole[]): boolean {
  return allowedRoles.includes(role);
}

// =============================================================================
// FEATURE FLAG CHECKS
// =============================================================================

/**
 * Map permissions to feature flags.
 * If a permission requires a feature flag and the flag is off → deny.
 */
const PERMISSION_TO_FEATURE_FLAG: Partial<Record<Permission, keyof FeatureFlags>> = {
  'event:create': 'eventCreation',
  'event:update': 'eventCreation',
  'event:delete': 'eventCreation',
  'event:publish': 'eventCreation',
  'iot:view': 'iotIntegration',
  'iot:manage': 'iotIntegration',
  'iot:configure': 'iotIntegration',
  'analytics:view': 'analytics',
  'analytics:export': 'analytics',
};

function isFeatureAllowed(
  settings: PlatformSettings,
  permission: Permission,
): boolean {
  const flagKey = PERMISSION_TO_FEATURE_FLAG[permission];

  // If the permission has no associated feature flag, it's allowed
  if (!flagKey) return true;

  // Admin/superadmin can still see disabled features (they can toggle them)
  // This is handled by the super_admin bypass above; admin still gets checked.
  return settings.featureFlags[flagKey] === true;
}

/**
 * Check a specific feature flag directly.
 */
export function isFeatureEnabled(
  settings: PlatformSettings | null,
  flag: keyof FeatureFlags,
): boolean {
  if (!settings) return true; // If settings haven't loaded, default to enabled
  return settings.featureFlags[flag] === true;
}

// =============================================================================
// ORGANIZATION PERMISSION CHECKS
// =============================================================================

/**
 * Map permissions to org-level permission flags.
 */
const PERMISSION_TO_ORG_FLAG: Partial<Record<Permission, keyof OrgRolePermissions>> = {
  'event:create': 'canCreateEvent',
  'event:update': 'canEditEvent',
  'event:delete': 'canDeleteEvent',
  'finance:view': 'canViewFinance',
  'finance:payout': 'canViewFinance',
  'iot:view': 'canManageIoT',
  'iot:manage': 'canManageIoT',
  'notification:send': 'canSendNotifications',
};

function isOrgPermissionAllowed(
  orgSettings: OrganizationSettings,
  permission: Permission,
): boolean {
  const orgFlagKey = PERMISSION_TO_ORG_FLAG[permission];

  // If no org-level flag applies, allow
  if (!orgFlagKey) return true;

  const orgPerms = orgSettings.rolePermissions?.organizer;
  if (!orgPerms) return true;

  return orgPerms[orgFlagKey] === true;
}

// =============================================================================
// SECURITY POLICY CHECKS
// =============================================================================

/**
 * Check if the user should be forced to set up 2FA before proceeding.
 */
export function shouldEnforce2FA(
  platformSettings: PlatformSettings | null,
  orgSettings: OrganizationSettings | null,
  userHas2FA: boolean,
): boolean {
  if (userHas2FA) return false;

  // Platform-level enforcement
  if (platformSettings?.securityPolicies?.enforce2FA) return true;

  // Org-level enforcement
  if (orgSettings?.enforce2FA) return true;

  return false;
}

/**
 * Validate password against security policies.
 */
export function validatePasswordPolicy(
  password: string,
  platformSettings: PlatformSettings | null,
): { valid: boolean; message?: string } {
  const policies = platformSettings?.securityPolicies;
  if (!policies) return { valid: true };

  if (password.length < policies.passwordMinLength) {
    return {
      valid: false,
      message: `Password must be at least ${policies.passwordMinLength} characters.`,
    };
  }

  if (policies.requireSpecialChar && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character.',
    };
  }

  return { valid: true };
}

// =============================================================================
// MAINTENANCE MODE
// =============================================================================

/**
 * Check if the platform is in maintenance mode.
 * Admin and SuperAdmin can still access during maintenance.
 */
export function isMaintenanceMode(
  settings: PlatformSettings | null,
  role: AppRole,
): boolean {
  if (!settings?.maintenanceMode) return false;
  // Admins can still access
  return !isRoleAtLeast(role, 'admin');
}

// =============================================================================
// ROUTE ACCESS
// =============================================================================

export interface RoutePermission {
  allowedRoles?: AppRole[];
  requiredPermissions?: Permission[];
  requireAny?: boolean; // If true, ANY permission grants access (default: ALL)
}

/**
 * Check if a user can access a specific route.
 */
export function canAccessRoute(
  ctx: PermissionContext,
  routePermission: RoutePermission,
): boolean {
  // Account must be active
  if (ctx.accountStatus !== 'active') return false;

  // Super Admin can access everything
  if (ctx.role === 'superadmin') return true;

  // Maintenance mode blocks non-admins from all routes
  if (isMaintenanceMode(ctx.platformSettings, ctx.role)) return false;

  // Role check
  if (routePermission.allowedRoles && !routePermission.allowedRoles.includes(ctx.role)) {
    return false;
  }

  // Permission check
  if (routePermission.requiredPermissions && routePermission.requiredPermissions.length > 0) {
    if (routePermission.requireAny) {
      return hasAnyPermission(ctx, routePermission.requiredPermissions);
    }
    return hasAllPermissions(ctx, routePermission.requiredPermissions);
  }

  return true;
}
