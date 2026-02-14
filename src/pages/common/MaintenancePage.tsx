// =============================================================================
// MAINTENANCE MODE PAGE
// =============================================================================
// Shown to non-admin users when platform maintenance mode is enabled.
// =============================================================================

import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
            <div className="text-center max-w-md px-6">
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Wrench className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                    Under Maintenance
                </h1>
                <p className="text-[var(--text-muted)] mb-6">
                    We're performing scheduled maintenance. We'll be back shortly.
                    Thank you for your patience.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    );
}
