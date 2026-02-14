// =============================================================================
// PERMISSION GATE — Declarative permission-driven visibility component
// =============================================================================
// Wraps UI that should only be shown when the user has the required permission(s).
//
// Usage:
//   <PermissionGate permission="event:create">
//     <CreateEventButton />
//   </PermissionGate>
//
//   <PermissionGate permissions={['event:create', 'event:publish']} requireAll>
//     <PublishButton />
//   </PermissionGate>
//
//   <PermissionGate permission="event:create" fallback={<FeatureDisabledMessage />}>
//     <CreateEventFormButton />
//   </PermissionGate>
// =============================================================================

import React from 'react';
import { usePermission, usePermissions } from '@/hooks/useRBAC';
import type { Permission } from '@/types/rbac.types';

interface PermissionGateProps {
    /** Single permission to check */
    permission?: Permission;
    /** Multiple permissions to check */
    permissions?: Permission[];
    /** If true (default), ALL permissions must be granted. If false, ANY grants access. */
    requireAll?: boolean;
    /** Content to render when access is denied (default: null) */
    fallback?: React.ReactNode;
    /** Children to render when access is granted */
    children: React.ReactNode;
}

export function PermissionGate({
    permission,
    permissions,
    requireAll = true,
    fallback = null,
    children,
}: PermissionGateProps) {
    // Single permission check
    const singleResult = usePermission(permission ?? 'event:read');
    const multiResult = usePermissions(permissions ?? []);

    let allowed: boolean;

    if (permission && !permissions) {
        allowed = singleResult;
    } else if (permissions && permissions.length > 0) {
        allowed = requireAll ? multiResult.hasAll : multiResult.hasAny;
    } else {
        allowed = true;
    }

    if (!allowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

export default PermissionGate;
