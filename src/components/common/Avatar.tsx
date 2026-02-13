import { cn } from '@/lib/utils';

// =============================================================================
// AVATAR COMPONENT
// =============================================================================

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
}

const SIZE_MAP = {
    xs: 'size-6 text-[10px]',
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
    xl: 'size-16 text-lg',
};

const STATUS_MAP = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-amber-500',
    busy: 'bg-red-500',
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function Avatar({ src, alt, name, size = 'md', className, status }: AvatarProps) {
    const fallbackUrl = name
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`
        : undefined;

    return (
        <div className={cn('relative inline-flex shrink-0', className)}>
            {src ? (
                <img
                    src={src}
                    alt={alt || name || 'Avatar'}
                    className={cn(
                        'rounded-full object-cover border-2 border-white dark:border-neutral-800',
                        SIZE_MAP[size]
                    )}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (fallbackUrl) target.src = fallbackUrl;
                    }}
                />
            ) : name ? (
                <div
                    className={cn(
                        'rounded-full flex items-center justify-center font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border-2 border-white dark:border-neutral-800',
                        SIZE_MAP[size]
                    )}
                    aria-label={name}
                >
                    {getInitials(name)}
                </div>
            ) : (
                <img
                    src={fallbackUrl || 'https://ui-avatars.com/api/?name=U&background=94a3b8&color=fff&size=128'}
                    alt="Avatar"
                    className={cn('rounded-full object-cover border-2 border-white dark:border-neutral-800', SIZE_MAP[size])}
                />
            )}

            {status && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-neutral-800',
                        STATUS_MAP[status],
                        size === 'xs' || size === 'sm' ? 'size-2' : 'size-3'
                    )}
                />
            )}
        </div>
    );
}
