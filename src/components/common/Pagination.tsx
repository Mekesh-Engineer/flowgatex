import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// PAGINATION COMPONENT
// =============================================================================

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
    showPageNumbers?: boolean;
    maxVisiblePages?: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
    showPageNumbers = true,
    maxVisiblePages = 5,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const getVisiblePages = (): (number | 'ellipsis')[] => {
        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | 'ellipsis')[] = [];
        const half = Math.floor(maxVisiblePages / 2);

        if (currentPage <= half + 1) {
            for (let i = 1; i <= maxVisiblePages - 1; i++) pages.push(i);
            pages.push('ellipsis');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - half) {
            pages.push(1);
            pages.push('ellipsis');
            for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('ellipsis');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push('ellipsis');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
            {/* Previous */}
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="size-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={18} />
            </button>

            {/* Page numbers */}
            {showPageNumbers &&
                getVisiblePages().map((page, idx) =>
                    page === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className="size-10 flex items-center justify-center text-gray-400 dark:text-neutral-500 text-sm"
                        >
                            &hellip;
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            aria-label={`Page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={cn(
                                'size-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-all',
                                currentPage === page
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white'
                            )}
                        >
                            {page}
                        </button>
                    )
                )}

            {/* Next */}
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="size-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <ChevronRight size={18} />
            </button>
        </nav>
    );
}
