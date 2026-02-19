// =============================================================================
// CONFIRM MODAL — Reusable modal for destructive/significant actions
// =============================================================================

import { ReactNode, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'danger' | 'primary' | 'warning';
    loading?: boolean;
    requireInputMatch?: string | false;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    children?: ReactNode;
}

const variantStyles = {
    danger: {
        button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
        icon: <AlertTriangle size={22} className="text-red-400" />,
    },
    warning: {
        button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
        icon: <AlertTriangle size={22} className="text-amber-400" />,
    },
    primary: {
        button: 'bg-[var(--color-primary)] hover:opacity-90 text-white shadow-[var(--color-primary)]/20',
        icon: <CheckCircle2 size={22} className="text-[var(--color-primary)]" />,
    },
};

export function ConfirmModal({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'primary',
    loading = false,
    requireInputMatch = false,
    onConfirm,
    onCancel,
    children,
}: ConfirmModalProps) {
    const [inputValue, setInputValue] = useState('');
    const variant = variantStyles[confirmVariant];

    const canConfirm = requireInputMatch === false || inputValue === requireInputMatch;

    const handleConfirm = async () => {
        if (!canConfirm) return;
        await onConfirm();
        setInputValue('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title="" size="sm">
            <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div
                    className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center mb-4',
                        confirmVariant === 'danger'
                            ? 'bg-red-500/15'
                            : confirmVariant === 'warning'
                                ? 'bg-amber-500/15'
                                : 'bg-[var(--color-primary)]/15'
                    )}
                >
                    {variant.icon}
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
                {description && (
                    <p className="text-sm text-[var(--text-muted)] mb-4 max-w-xs">{description}</p>
                )}

                {/* Optional children (e.g., reason textarea) */}
                {children && <div className="w-full text-left mb-4">{children}</div>}

                {/* Type-to-confirm */}
                {requireInputMatch && (
                    <div className="w-full text-left mb-4">
                        <label className="block text-xs text-[var(--text-muted)] mb-1">
                            Type <strong className="text-[var(--text-primary)]">{requireInputMatch}</strong> to
                            confirm
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-[var(--bg-base)] border border-[var(--border-default)]
                         rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2
                         focus:ring-[var(--color-primary)]/50"
                            placeholder={requireInputMatch}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 w-full mt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-sm font-medium
                       text-[var(--text-secondary)] bg-[var(--bg-surface)]
                       border border-[var(--border-default)] rounded-xl
                       hover:bg-[var(--bg-surface-hover)] transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm || loading}
                        className={cn(
                            'flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl shadow-lg',
                            'transition-all duration-200 disabled:opacity-50',
                            variant.button
                        )}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
