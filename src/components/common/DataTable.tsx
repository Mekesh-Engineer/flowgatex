import { ReactNode, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './Skeleton';

// =============================================================================
// DATA TABLE COMPONENT
// =============================================================================

export interface Column<T> {
    key: string;
    header: string;
    render?: (row: T, index: number) => ReactNode;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    pageSize?: number;
    showPagination?: boolean;
    striped?: boolean;
    compact?: boolean;
    className?: string;
    headerClassName?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    keyExtractor,
    loading = false,
    emptyMessage = 'No data available',
    onRowClick,
    pageSize = 10,
    showPagination = true,
    striped = false,
    compact = false,
    className,
    headerClassName,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDirection>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
            if (sortDir === 'desc') setSortKey(null);
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sortedData = useMemo(() => {
        if (!sortKey || !sortDir) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return sortDir === 'asc' ? -1 : 1;
            if (bVal == null) return sortDir === 'asc' ? 1 : -1;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
    }, [data, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
    const paginatedData = showPagination
        ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : sortedData;

    const cellPadding = compact ? 'px-4 py-2.5' : 'px-6 py-4';
    const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' };

    if (loading) {
        return (
            <div className={cn('bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden', className)}>
                <Skeleton className="h-12 w-full rounded-none" rounded="sm" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-none border-t border-gray-100 dark:border-neutral-700" rounded="sm" />
                ))}
            </div>
        );
    }

    return (
        <div className={cn('bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm', className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={cn('bg-gray-50 dark:bg-neutral-900/50 text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-neutral-400', headerClassName)}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(cellPadding, alignMap[col.align || 'left'], col.width && `w-[${col.width}]`, col.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-neutral-200 transition-colors')}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className={cn('flex items-center gap-1.5', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
                                        {col.header}
                                        {col.sortable && (
                                            <span className="text-gray-400">
                                                {sortKey === col.key && sortDir === 'asc' ? (
                                                    <ArrowUp size={14} />
                                                ) : sortKey === col.key && sortDir === 'desc' ? (
                                                    <ArrowDown size={14} />
                                                ) : (
                                                    <ArrowUpDown size={14} />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-16 text-center text-sm text-gray-500 dark:text-neutral-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, idx) => (
                                <tr
                                    key={keyExtractor(row)}
                                    onClick={() => onRowClick?.(row)}
                                    className={cn(
                                        'transition-colors',
                                        onRowClick && 'cursor-pointer',
                                        striped && idx % 2 === 1 && 'bg-gray-50/50 dark:bg-neutral-900/20',
                                        'hover:bg-gray-50 dark:hover:bg-neutral-700/20'
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={cn(cellPadding, alignMap[col.align || 'left'], 'text-sm', col.className)}>
                                            {col.render
                                                ? col.render(row, idx)
                                                : (row[col.key] as ReactNode) ?? '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {showPagination && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900/30">
                    <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="size-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-medium text-gray-700 dark:text-neutral-300 px-2">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="size-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
