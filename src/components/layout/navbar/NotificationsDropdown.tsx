import { motion } from 'framer-motion';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface Props {
    notifications: Notification[];
    onClose: () => void;
    onMarkAllRead: () => void;
}

const typeIcon = {
    info: <Info size={16} />,
    success: <CheckCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    error: <XCircle size={16} />,
};

const typeColor = {
    info: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    success: 'text-green-500 bg-green-50 dark:bg-green-500/10',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
    error: 'text-red-500 bg-red-50 dark:bg-red-500/10',
};

export function NotificationsDropdown({ notifications, onClose, onMarkAllRead }: Props) {
    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
                <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-xs text-[var(--color-primary)]">{unreadCount} unread</span>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onMarkAllRead}
                        disabled={unreadCount === 0}
                        className="p-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)] disabled:opacity-40 flex items-center gap-1 transition"
                    >
                        <Check size={12} /> Mark all read
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
                        <Bell size={28} className="opacity-30 mb-2" />
                        <p className="text-sm">No notifications</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`flex gap-3 px-4 py-3 cursor-pointer transition border-b border-[var(--border-primary)]/50 ${!n.read ? 'bg-[var(--color-primary)]/[0.03]' : 'hover:bg-[var(--bg-surface)]'
                                }`}
                        >
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${typeColor[n.type]}`}>
                                {typeIcon[n.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{n.title}</p>
                                <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{n.message}</p>
                                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">{n.time}</span>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-2" />}
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[var(--border-primary)] text-center">
                    <button
                        onClick={onClose}
                        className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export default NotificationsDropdown;
