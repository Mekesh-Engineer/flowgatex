// =============================================================================
// ACCOUNT SUSPENDED PAGE
// =============================================================================

import { ShieldOff } from 'lucide-react';

export default function AccountSuspendedPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
            <div className="text-center max-w-md px-6">
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <ShieldOff className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                    Account Suspended
                </h1>
                <p className="text-[var(--text-muted)] mb-6">
                    Your account has been suspended. If you believe this is an error,
                    please contact support at{' '}
                    <a href="mailto:support@flowgatex.com" className="text-[var(--color-primary)] underline">
                        support@flowgatex.com
                    </a>
                </p>
            </div>
        </div>
    );
}
