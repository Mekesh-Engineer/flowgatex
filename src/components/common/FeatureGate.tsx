// =============================================================================
// FEATURE GATE — Declarative feature-flag–driven visibility component
// =============================================================================
// Wraps UI that should only be shown when a platform feature flag is enabled.
//
// Usage:
//   <FeatureGate flag="iotIntegration">
//     <IoTDashboard />
//   </FeatureGate>
//
//   <FeatureGate flag="eventCreation" fallback={<FeatureDisabledBanner feature="Event Creation" />}>
//     <CreateEventButton />
//   </FeatureGate>
// =============================================================================

import React from 'react';
import { useFeatureFlag } from '@/hooks/useRBAC';
import type { FeatureFlags } from '@/types/rbac.types';
import { AlertTriangle } from 'lucide-react';

interface FeatureGateProps {
    /** The feature flag to check */
    flag: keyof FeatureFlags;
    /** Content to render when the feature is disabled */
    fallback?: React.ReactNode;
    /** Children to render when the feature is enabled */
    children: React.ReactNode;
}

export function FeatureGate({ flag, fallback, children }: FeatureGateProps) {
    const isEnabled = useFeatureFlag(flag);

    if (!isEnabled) {
        return <>{fallback ?? null}</>;
    }

    return <>{children}</>;
}

// =============================================================================
// FEATURE DISABLED BANNER — Reusable "feature disabled" message
// =============================================================================

interface FeatureDisabledBannerProps {
    feature: string;
    className?: string;
}

export function FeatureDisabledBanner({ feature, className = '' }: FeatureDisabledBannerProps) {
    return (
        <div
            className={`flex items-center gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 ${className}`}
        >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
                <p className="font-semibold text-sm">Feature Disabled</p>
                <p className="text-xs mt-0.5 opacity-80">
                    {feature} has been disabled by the platform administrator.
                </p>
            </div>
        </div>
    );
}

export default FeatureGate;
