// =============================================================================
// RBAC HOOKS — React hooks for permission-driven UI
// =============================================================================
// These hooks provide reactive permission checks by combining:
// - Current user role from useAuthStore
// - Platform settings from useSettingsStore
// - Organization settings from useSettingsStore
// - Permission engine from lib/rbac
// =============================================================================

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/zustand/stores';
import { useSettingsStore } from '@/store/zustand/settingsStore';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  isFeatureEnabled,
  isMaintenanceMode,
  shouldEnforce2FA,
  canAccessRoute,
  isRoleAtLeast,
  type PermissionContext,
  type RoutePermission,
} from '@/lib/rbac';
import type {
  Permission,
  AppRole,
  FeatureFlags,
} from '@/types/rbac.types';
import { UserRole } from '@/lib/constants';

// =============================================================================
// MAP UserRole enum → AppRole string
// =============================================================================

/**
 * Convert the existing UserRole enum to the new AppRole type.
 * This bridges the legacy enum with the new RBAC system.
 */
function toAppRole(role: UserRole | string | undefined): AppRole {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case 'superadmin':
      return 'superadmin';
    case UserRole.ADMIN:
    case 'admin':
      return 'admin';
    case UserRole.ORGANIZER:
    case 'organizer':
      return 'organizer';
    case 'org_admin':
      return 'org_admin';
    case UserRole.USER:
    case 'user':
    case 'attendee':
    default:
      return 'user';
  }
}

// =============================================================================
// usePermissionContext — Build permission context from stores
// =============================================================================

/**
 * Build the PermissionContext consumed by all RBAC checks.
 * Memoized to avoid unnecessary re-evaluations.
 */
export function usePermissionContext(): PermissionContext {
  const user = useAuthStore((s) => s.user);
  const platform = useSettingsStore((s) => s.platform);
  const platformLoaded = useSettingsStore((s) => s.platformLoaded);
  const getActiveOrgSettings = useSettingsStore((s) => s.getActiveOrgSettings);

  return useMemo<PermissionContext>(() => {
    const orgSettings = getActiveOrgSettings();
    return {
      role: toAppRole(user?.role),
      accountStatus: 'active', // will be enriched when FirestoreUser has accountStatus
      organizationId: undefined, // will be enriched from FirestoreUser
      platformSettings: platformLoaded ? platform : null,
      organizationSettings: orgSettings,
    };
  }, [user?.role, platform, platformLoaded, getActiveOrgSettings]);
}

// =============================================================================
// usePermission — Single permission check
// =============================================================================

/**
 * Check if the current user has a specific permission.
 *
 * @example
 * const canCreate = usePermission('event:create');
 * if (!canCreate) return <FeatureDisabled />;
 */
export function usePermission(permission: Permission): boolean {
  const ctx = usePermissionContext();
  return useMemo(() => hasPermission(ctx, permission), [ctx, permission]);
}

// =============================================================================
// usePermissions — Multiple permission checks
// =============================================================================

/**
 * Check multiple permissions.
 * Returns an object with `hasAll` and `hasAny`, plus individual results.
 *
 * @example
 * const perms = usePermissions(['event:create', 'event:delete']);
 * if (!perms.hasAll) return null;
 */
export function usePermissions(permissions: Permission[]) {
  const ctx = usePermissionContext();

  return useMemo(() => {
    const results: Record<string, boolean> = {};
    for (const p of permissions) {
      results[p] = hasPermission(ctx, p);
    }
    return {
      results,
      hasAll: hasAllPermissions(ctx, permissions),
      hasAny: hasAnyPermission(ctx, permissions),
    };
  }, [ctx, permissions]);
}

// =============================================================================
// useFeatureFlag — Check a platform feature flag
// =============================================================================

/**
 * Check if a platform feature is enabled.
 *
 * @example
 * const iotEnabled = useFeatureFlag('iotIntegration');
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const platform = useSettingsStore((s) => s.platform);
  const platformLoaded = useSettingsStore((s) => s.platformLoaded);

  return useMemo(
    () => isFeatureEnabled(platformLoaded ? platform : null, flag),
    [platform, platformLoaded, flag],
  );
}

// =============================================================================
// useRoleCheck — Role hierarchy check
// =============================================================================

/**
 * Check if the current user's role is at least the given role.
 *
 * @example
 * const isAtLeastAdmin = useRoleCheck('admin');
 */
export function useRoleCheck(requiredRole: AppRole): boolean {
  const user = useAuthStore((s) => s.user);
  return useMemo(
    () => isRoleAtLeast(toAppRole(user?.role), requiredRole),
    [user?.role, requiredRole],
  );
}

// =============================================================================
// useRouteAccess — Check if user can access a route
// =============================================================================

/**
 * Check if user can access a route with the given permission requirements.
 */
export function useRouteAccess(routePermission: RoutePermission): boolean {
  const ctx = usePermissionContext();
  return useMemo(
    () => canAccessRoute(ctx, routePermission),
    [ctx, routePermission],
  );
}

// =============================================================================
// useMaintenanceMode
// =============================================================================

/**
 * Check if the platform is in maintenance mode for the current user.
 */
export function useMaintenanceMode(): boolean {
  const user = useAuthStore((s) => s.user);
  const platform = useSettingsStore((s) => s.platform);
  const platformLoaded = useSettingsStore((s) => s.platformLoaded);

  return useMemo(
    () => isMaintenanceMode(platformLoaded ? platform : null, toAppRole(user?.role)),
    [platform, platformLoaded, user?.role],
  );
}

// =============================================================================
// use2FAEnforcement
// =============================================================================

/**
 * Check if the user must set up 2FA before continuing.
 */
export function use2FAEnforcement(): boolean {
  const platform = useSettingsStore((s) => s.platform);
  const platformLoaded = useSettingsStore((s) => s.platformLoaded);
  const getActiveOrgSettings = useSettingsStore((s) => s.getActiveOrgSettings);

  // TODO: Read user's 2FA status from their profile
  const userHas2FA = false;

  return useMemo(() => {
    if (!platformLoaded) return false;
    const orgSettings = getActiveOrgSettings();
    return shouldEnforce2FA(platform, orgSettings, userHas2FA);
  }, [platform, platformLoaded, getActiveOrgSettings, userHas2FA]);
}

// =============================================================================
// useRBAC — Combined hook returning all commonly-used checks
// =============================================================================

/**
 * All-in-one RBAC hook. Provides permission checker functions and
 * precomputed role booleans.
 *
 * @example
 * const { can, canAny, isAdmin, isSuperAdmin, isMaintenanceMode } = useRBAC();
 * if (!can('event:create')) return null;
 */
export function useRBAC() {
  const ctx = usePermissionContext();
  const user = useAuthStore((s) => s.user);

  const can = useCallback(
    (permission: Permission) => hasPermission(ctx, permission),
    [ctx],
  );

  const canAll = useCallback(
    (permissions: Permission[]) => hasAllPermissions(ctx, permissions),
    [ctx],
  );

  const canAny = useCallback(
    (permissions: Permission[]) => hasAnyPermission(ctx, permissions),
    [ctx],
  );

  const checkRoute = useCallback(
    (routePermission: RoutePermission) => canAccessRoute(ctx, routePermission),
    [ctx],
  );

  const appRole = toAppRole(user?.role);

  return {
    // Permission checkers
    can,
    canAll,
    canAny,
    checkRoute,

    // Context
    ctx,
    role: appRole,

    // Convenience booleans
    isUser: appRole === 'user',
    isOrganizer: appRole === 'organizer',
    isOrgAdmin: appRole === 'org_admin',
    isAdmin: appRole === 'admin' || appRole === 'superadmin',
    isSuperAdmin: appRole === 'superadmin',
    isAtLeast: (required: AppRole) => isRoleAtLeast(appRole, required),

    // State
    maintenanceMode: isMaintenanceMode(ctx.platformSettings, appRole),
  };
}

// Export the role mapper for use elsewhere
export { toAppRole };
