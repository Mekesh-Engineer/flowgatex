import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, AlertTriangle, ExternalLink, Ticket } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import { showSuccess } from '@/components/common/Toast';
import Button from '@/components/common/Button';
import type { EventItem } from '@/features/events/components/events-page/types';

interface QuickBookingModalProps {
    event: EventItem;
    isOpen: boolean;
    onClose: () => void;
}

// Mock tiers derived from event data — in production, fetch from Firestore event doc
function deriveTiers(event: EventItem) {
    const base = event.price || 500;
    return [
        {
            id: `${event.id}-general`,
            name: 'General Admission',
            price: base,
            available: Math.max(0, event.capacity - event.attendees),
            description: 'Standard entry with access to all main areas',
        },
        {
            id: `${event.id}-vip`,
            name: 'VIP Pass',
            price: Math.round(base * 2.5),
            available: Math.max(0, Math.floor((event.capacity - event.attendees) * 0.3)),
            description: 'Premium seating, lounge access, complimentary refreshments',
        },
        {
            id: `${event.id}-student`,
            name: 'Student Discount',
            price: Math.round(base * 0.6),
            available: Math.max(0, Math.floor((event.capacity - event.attendees) * 0.2)),
            description: 'Valid student ID required at entry',
        },
    ];
}

function QuickBookingModal({ event, isOpen, onClose }: QuickBookingModalProps) {
    const { addToCart } = useCart();
    const tiers = deriveTiers(event);

    const [selectedTierId, setSelectedTierId] = useState<string>(tiers[0]?.id || '');
    const [quantity, setQuantity] = useState(1);

    const selectedTier = tiers.find((t) => t.id === selectedTierId);
    const subtotal = selectedTier ? selectedTier.price * quantity : 0;
    const maxQty = selectedTier ? Math.min(10, selectedTier.available) : 10;

    // Reset quantity on tier change
    useEffect(() => {
        setQuantity(1);
    }, [selectedTierId]);

    const handleAddToCart = () => {
        if (!selectedTier) return;

        addToCart(
            event.id,
            event.title,
            event.date,
            event.image,
            event.venue || event.location || 'TBA',
            selectedTier.id,
            selectedTier.name,
            selectedTier.price,
            quantity
        );

        showSuccess(`${event.title} added to cart!`);
        setTimeout(onClose, 800);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && onClose()}
                    >
                        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-start justify-between p-6 border-b border-[var(--border-primary)]">
                                <div className="flex gap-4">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)] line-clamp-2">{event.title}</h3>
                                        <p className="text-sm text-[var(--text-muted)] mt-1">{event.date} • {event.time}</p>
                                        <p className="text-sm text-[var(--text-muted)]">{event.venue || event.location}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors shrink-0"
                                    aria-label="Close modal"
                                >
                                    <X size={20} className="text-[var(--text-muted)]" />
                                </button>
                            </div>

                            {/* Tier Selection */}
                            <div className="p-6 space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    Select Ticket Type
                                </h4>

                                <div className="space-y-3">
                                    {tiers.map((tier) => {
                                        const isSelected = tier.id === selectedTierId;
                                        const isSoldOut = tier.available <= 0;

                                        return (
                                            <label
                                                key={tier.id}
                                                className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${isSoldOut
                                                        ? 'opacity-50 cursor-not-allowed border-[var(--border-primary)] bg-[var(--bg-surface)]'
                                                        : isSelected
                                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm'
                                                            : 'border-[var(--border-primary)] hover:border-[var(--color-primary)]/50'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        name="tier"
                                                        value={tier.id}
                                                        checked={isSelected}
                                                        onChange={() => !isSoldOut && setSelectedTierId(tier.id)}
                                                        disabled={isSoldOut}
                                                        className="mt-1 accent-[var(--color-primary)]"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-[var(--text-primary)]">{tier.name}</span>
                                                            <span className="font-bold text-[var(--color-primary)]">{formatCurrency(tier.price)}</span>
                                                        </div>
                                                        <p className="text-xs text-[var(--text-muted)] mt-1">{tier.description}</p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            {isSoldOut ? (
                                                                <span className="text-xs font-bold text-red-500">SOLD OUT</span>
                                                            ) : (
                                                                <span className="text-xs text-[var(--text-muted)]">{tier.available} available</span>
                                                            )}
                                                            {tier.available > 0 && tier.available <= 5 && (
                                                                <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                                                                    <AlertTriangle size={12} /> Only {tier.available} left!
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Quantity Selector */}
                                {selectedTier && selectedTier.available > 0 && (
                                    <div className="pt-4">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                                            Quantity
                                        </h4>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)] p-1">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    disabled={quantity <= 1}
                                                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="min-w-[40px] text-center font-bold text-lg text-[var(--text-primary)]">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                                                    disabled={quantity >= maxQty}
                                                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-[var(--text-muted)]">Subtotal</p>
                                                <p className="text-xl font-black text-[var(--color-primary)]">{formatCurrency(subtotal)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* View Full Details Link */}
                                <a
                                    href={`/events/${event.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline pt-2"
                                >
                                    <ExternalLink size={14} /> View Full Event Details
                                </a>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex gap-3 p-6 border-t border-[var(--border-primary)]">
                                <Button variant="secondary" className="flex-1" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1 gap-2"
                                    onClick={handleAddToCart}
                                    disabled={!selectedTier || selectedTier.available <= 0}
                                >
                                    <Ticket size={18} />
                                    Add to Cart
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default QuickBookingModal;
