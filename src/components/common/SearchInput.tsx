import { useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// SEARCH INPUT COMPONENT
// =============================================================================

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: (value: string) => void;
    placeholder?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    autoFocus?: boolean;
    debounceMs?: number;
    showClear?: boolean;
}

export default function SearchInput({
    value,
    onChange,
    onSearch,
    placeholder = 'Search...',
    className,
    size = 'md',
    autoFocus = false,
    debounceMs = 0,
    showClear = true,
}: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (autoFocus && inputRef.current) inputRef.current.focus();
    }, [autoFocus]);

    const handleChange = useCallback(
        (val: string) => {
            onChange(val);
            if (debounceMs > 0 && onSearch) {
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => onSearch(val), debounceMs);
            }
        },
        [onChange, onSearch, debounceMs]
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSearch) onSearch(value);
        if (e.key === 'Escape') {
            onChange('');
            inputRef.current?.blur();
        }
    };

    const handleClear = () => {
        onChange('');
        onSearch?.('');
        inputRef.current?.focus();
    };

    const sizeStyles = {
        sm: 'h-9 text-xs px-3 pl-8',
        md: 'h-10 text-sm px-4 pl-10',
        lg: 'h-12 text-base px-5 pl-12',
    };

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 18,
    };

    return (
        <div className={cn('relative', className)}>
            <Search
                size={iconSizes[size]}
                className={cn(
                    'absolute top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 pointer-events-none',
                    size === 'sm' ? 'left-2.5' : size === 'lg' ? 'left-4' : 'left-3'
                )}
            />
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn(
                    'w-full rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all',
                    sizeStyles[size]
                )}
                aria-label="Search"
            />
            {showClear && value && (
                <button
                    onClick={handleClear}
                    className={cn(
                        'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors',
                        size === 'sm' ? 'right-2' : size === 'lg' ? 'right-4' : 'right-3'
                    )}
                    aria-label="Clear search"
                >
                    <X size={iconSizes[size]} />
                </button>
            )}
        </div>
    );
}
