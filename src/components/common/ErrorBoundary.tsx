import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        logger.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base,#f8fafc)] p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-[var(--text-primary,#0f172a)]">
                                Something went wrong
                            </h1>
                            <p className="text-sm text-[var(--text-muted,#94a3b8)]">
                                An unexpected error occurred. Please try again.
                            </p>
                        </div>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="text-left bg-[var(--bg-surface,#f1f5f9)] rounded-xl p-4 text-xs">
                                <summary className="cursor-pointer font-medium text-[var(--text-secondary,#475569)] mb-2">
                                    Error details
                                </summary>
                                <pre className="overflow-auto text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary,#00A3DB)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                                <RefreshCcw size={16} />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-primary,#e2e8f0)] text-[var(--text-secondary,#475569)] text-sm font-semibold hover:bg-[var(--bg-surface,#f1f5f9)] transition-colors"
                            >
                                <Home size={16} />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
