import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/common/Button';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, removeFromCart, updateItemQuantity, totalPrice, isEmpty, totalItems } = useCart();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--bg-base)] z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Cart</h2>
                                <p className="text-sm text-[var(--text-muted)]">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
                                aria-label="Close cart"
                            >
                                <X size={20} className="text-[var(--text-muted)]" />
                            </button>
                        </div>

                        {/* Content */}
                        {isEmpty ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="p-5 bg-[var(--bg-card)] rounded-2xl mb-4">
                                    <ShoppingBag size={40} className="text-[var(--text-muted)]" />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Cart is empty</h3>
                                <p className="text-sm text-[var(--text-muted)] mb-6">Browse events and add tickets to get started.</p>
                                <Link to="/events" onClick={onClose}>
                                    <Button variant="primary">Browse Events</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Items list */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {items.map((item) => (
                                        <div
                                            key={`${item.eventId}-${item.tierId}`}
                                            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--color-primary)]/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">
                                                        {item.eventTitle}
                                                    </h4>
                                                    <p className="text-xs text-[var(--text-muted)]">{item.tierName}</p>
                                                    {item.eventDate && (
                                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.eventDate}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.eventId, item.tierId)}
                                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-2"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 bg-[var(--bg-base)] rounded-lg border border-[var(--border-primary)] p-0.5">
                                                    <button
                                                        onClick={() => updateItemQuantity(item.eventId, item.tierId, item.quantity - 1)}
                                                        className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-sm font-bold min-w-[28px] text-center text-[var(--text-primary)]">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateItemQuantity(item.eventId, item.tierId, item.quantity + 1)}
                                                        className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <span className="font-bold text-[var(--text-primary)]">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer with totals */}
                                <div className="p-6 border-t border-[var(--border-primary)] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--text-muted)] font-medium">Subtotal</span>
                                        <span className="text-lg font-bold text-[var(--text-primary)]">
                                            {formatCurrency(totalPrice)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Service fees and taxes will be calculated at checkout
                                    </p>
                                    <Link to="/cart" onClick={onClose} className="block">
                                        <Button variant="secondary" className="w-full py-2.5 text-sm mb-2">
                                            View Full Cart
                                        </Button>
                                    </Link>
                                    <Link to="/checkout" onClick={onClose} className="block">
                                        <Button variant="primary" className="w-full py-3 text-base">
                                            Proceed to Checkout
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default CartDrawer;
