import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Trash2,
    Plus,
    Minus,
    ArrowLeft,
    Clock,
    AlertTriangle,
    Package,
    Shield,
    Ticket,
} from 'lucide-react';
import { useCart } from '@/features/booking/hooks/useCart';
import { useCartExpiry } from '@/features/booking/hooks/useCartExpiry';
import PromoCodeInput from '@/features/booking/components/PromoCodeInput';
import { validatePromoCode } from '@/features/booking/services/promoService';
import { formatCurrency } from '@/lib/utils';
import { showSuccess, showError } from '@/components/common/Toast';
import Button from '@/components/common/Button';
import Swal from 'sweetalert2';

const SERVICE_FEE_PER_TICKET = 10; // ₹10 service fee per ticket

function CartPage() {
    const {
        items,
        removeFromCart,
        updateItemQuantity,
        totalPrice,
        totalItems,
        isEmpty,
        emptyCart,
    } = useCart();

    const [promoCode, setPromoCode] = useState<string | undefined>();
    const [discount, setDiscount] = useState(0);
    const [promoLoading, setPromoLoading] = useState(false);

    // Cart expiry
    const oldestAddedAt = useMemo(
        () => (items.length > 0 ? Math.min(...items.map((i) => i.addedAt || Date.now())) : null),
        [items]
    );
    const { formattedTime, isWarning, isExpired } = useCartExpiry(oldestAddedAt);

    // Handle cart expired
    if (isExpired && !isEmpty) {
        emptyCart();
        showError('Cart expired. Items have been released.');
    }

    const serviceFee = totalItems * SERVICE_FEE_PER_TICKET;
    const finalTotal = Math.max(0, totalPrice + serviceFee - discount);

    const handleApplyPromo = async (code: string) => {
        if (!items.length) return;
        setPromoLoading(true);
        try {
            const result = await validatePromoCode(code, items[0].eventId, totalPrice);
            if (result.isValid) {
                setPromoCode(code);
                setDiscount(result.discountAmount);
                showSuccess(result.message || 'Promo code applied!');
            } else {
                showError(result.message || 'Invalid promo code');
            }
        } catch {
            showError('Failed to apply promo code');
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setPromoCode(undefined);
        setDiscount(0);
    };

    const handleRemoveItem = async (eventId: string, tierId: string, itemName: string) => {
        const result = await Swal.fire({
            title: 'Remove Item?',
            text: `Remove "${itemName}" from your cart?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, remove it',
            background: '#12121a',
            color: '#f8fafc',
        });
        if (result.isConfirmed) {
            removeFromCart(eventId, tierId);
            showSuccess('Item removed from cart');
        }
    };

    // Empty cart state
    if (isEmpty) {
        return (
            <div className="min-h-screen bg-[var(--bg-base)] transition-colors duration-300">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col items-center justify-center text-center py-20">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="bg-[var(--bg-card)] p-8 rounded-3xl mb-6 border border-[var(--border-primary)] shadow-sm"
                        >
                            <ShoppingBag size={64} className="text-[var(--text-muted)]" />
                        </motion.div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">Your cart is empty</h2>
                        <p className="text-[var(--text-muted)] text-lg mb-8 max-w-md">
                            Looks like you haven't added any event tickets yet. Browse our events catalog to find something exciting!
                        </p>
                        <Link to="/events">
                            <Button variant="primary" className="gap-2 px-8 py-4 text-lg">
                                <Package size={20} /> Browse Events
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-base)] transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link
                            to="/events"
                            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors mb-2"
                        >
                            <ArrowLeft size={16} /> Continue Shopping
                        </Link>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                            Your Cart
                            <span className="text-[var(--text-muted)] font-medium text-lg ml-3">
                                ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                            </span>
                        </h1>
                    </div>

                    {/* Cart Expiry Timer */}
                    {!isEmpty && (
                        <div
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${isWarning
                                ? 'border-red-500/50 bg-red-500/10 text-red-500 animate-pulse'
                                : 'border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                                }`}
                        >
                            <Clock size={16} />
                            Items reserved for {formattedTime}
                        </div>
                    )}
                </div>

                {/* Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence>
                            {items.map((item) => (
                                <motion.div
                                    key={`${item.eventId}-${item.tierId}`}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] overflow-hidden hover:border-[var(--color-primary)]/30 transition-all shadow-sm"
                                >
                                    <div className="flex flex-col sm:flex-row gap-4 p-5">
                                        {/* Event Thumbnail */}
                                        {item.eventImage && (
                                            <Link to={`/events/${item.eventId}`} className="shrink-0">
                                                <img
                                                    src={item.eventImage}
                                                    alt={item.eventTitle}
                                                    className="w-full sm:w-28 h-28 rounded-xl object-cover hover:opacity-80 transition-opacity"
                                                />
                                            </Link>
                                        )}

                                        {/* Item Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/events/${item.eventId}`}
                                                        className="text-lg font-bold text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors line-clamp-1"
                                                    >
                                                        {item.eventTitle}
                                                    </Link>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        <span className="text-sm font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-lg">
                                                            {item.tierName}
                                                        </span>
                                                        {item.eventDate && (
                                                            <span className="text-xs text-[var(--text-muted)]">
                                                                {new Date(item.eventDate).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        )}
                                                        {item.venue && (
                                                            <span className="text-xs text-[var(--text-muted)]">• {item.venue}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-[var(--text-secondary)] mt-2">
                                                        {formatCurrency(item.price)} / ticket
                                                    </p>
                                                </div>

                                                {/* Remove button */}
                                                <button
                                                    onClick={() => handleRemoveItem(item.eventId, item.tierId, item.eventTitle)}
                                                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            {/* Bottom: Quantity + Line Total */}
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-primary)]">
                                                {/* Quantity Stepper */}
                                                <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)] p-0.5">
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity <= 1) {
                                                                handleRemoveItem(item.eventId, item.tierId, item.eventTitle);
                                                            } else {
                                                                updateItemQuantity(item.eventId, item.tierId, item.quantity - 1);
                                                            }
                                                        }}
                                                        className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="min-w-[36px] text-center font-bold text-[var(--text-primary)]">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            updateItemQuantity(
                                                                item.eventId,
                                                                item.tierId,
                                                                Math.min(10, item.quantity + 1)
                                                            )
                                                        }
                                                        disabled={item.quantity >= 10}
                                                        className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>

                                                {/* Line Total */}
                                                <p className="text-xl font-black text-[var(--text-primary)]">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </p>
                                            </div>

                                            {/* Status Banners */}
                                            {item.availableCount !== undefined && item.availableCount < item.quantity && (
                                                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                                                    <AlertTriangle size={14} />
                                                    Only {item.availableCount} tickets left! Reduce quantity or checkout soon.
                                                </div>
                                            )}
                                            {item.originalPrice !== undefined && item.originalPrice !== item.price && (
                                                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                                                    Price updated from {formatCurrency(item.originalPrice)} to{' '}
                                                    {formatCurrency(item.price)}.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] shadow-lg overflow-hidden">
                                {/* Header Line */}
                                <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />

                                <div className="p-6 space-y-6">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Order Summary</h3>

                                    {/* Condensed Items */}
                                    <div className="space-y-3">
                                        {items.map((item) => (
                                            <div
                                                key={`${item.eventId}-${item.tierId}`}
                                                className="flex justify-between items-center text-sm"
                                            >
                                                <span className="text-[var(--text-secondary)] truncate mr-2">
                                                    {item.eventTitle} × {item.quantity}
                                                </span>
                                                <span className="font-medium text-[var(--text-primary)] whitespace-nowrap">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pricing Breakdown */}
                                    <div className="space-y-3 pt-4 border-t border-[var(--border-primary)]">
                                        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(totalPrice)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                            <span>Service Fee (₹5 × {totalItems})</span>
                                            <span>{formatCurrency(serviceFee)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-sm text-green-500 font-medium">
                                                <span>Discount</span>
                                                <span>-{formatCurrency(discount)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Promo Code */}
                                    <div className="pt-2">
                                        <PromoCodeInput
                                            onApply={handleApplyPromo}
                                            onRemove={handleRemovePromo}
                                            isLoading={promoLoading}
                                            appliedCode={promoCode}
                                            discountAmount={discount}
                                        />
                                    </div>

                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-4 border-t border-[var(--border-primary)]">
                                        <span className="text-lg font-bold text-[var(--text-primary)]">Total</span>
                                        <span className="text-3xl font-black text-[var(--color-primary)]">
                                            {formatCurrency(finalTotal)}
                                        </span>
                                    </div>

                                    {/* Checkout Button */}
                                    <Link to="/checkout" className="block">
                                        <Button
                                            variant="primary"
                                            className="w-full py-4 text-lg shadow-lg hover:shadow-primary-500/25 gap-2"
                                        >
                                            <Ticket size={20} />
                                            Proceed to Checkout
                                        </Button>
                                    </Link>

                                    {/* Security Note */}
                                    <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                                        <Shield size={14} />
                                        <span>Secure checkout powered by Razorpay</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CartPage;
