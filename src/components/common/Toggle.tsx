import { cn } from '@/lib/utils';

// =============================================================================
// TOGGLE / SWITCH COMPONENT
// =============================================================================

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
    className?: string;
}

export default function Toggle({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    size = 'md',
    className,
}: ToggleProps) {
    const trackSize = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
    const thumbSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
    const thumbTranslate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

    return (
        <label
            className={cn(
                'flex items-center gap-3',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                className
            )}
        >
            <button
                role="switch"
                type="button"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    'relative inline-flex shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900',
                    trackSize,
                    checked
                        ? 'bg-primary-500'
                        : 'bg-gray-200 dark:bg-neutral-700'
                )}
            >
                <span
                    className={cn(
                        'pointer-events-none inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200',
                        thumbSize,
                        checked ? thumbTranslate : 'translate-x-0.5',
                        'mt-[3px]'
                    )}
                />
            </button>
            {(label || description) && (
                <div className="flex flex-col">
                    {label && (
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="text-xs text-gray-500 dark:text-neutral-400">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </label>
    );
}
