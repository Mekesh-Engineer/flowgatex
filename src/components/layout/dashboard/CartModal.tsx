// =============================================================================
// CART MODAL — Shopping cart for attendee event tickets
// Uses CSS classes from cart.css for consistent styling
// =============================================================================

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, Ticket } from 'lucide-react';
import { useCart } from '@/features/booking/hooks/useCart';
import { useCartExpiry } from '@/features/booking/hooks/useCartExpiry';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/common/Button';
import { showError } from '@/components/common/Toast';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const {
    items,
    removeFromCart,
    updateItemQuantity,
    emptyCart,
    totalPrice,
    isEmpty,
    totalItems
  } = useCart();

  // Cart expiry
  const oldestAddedAt = items.length > 0 ? Math.min(...items.map((i) => i.addedAt || Date.now())) : null;
  const { isExpired } = useCartExpiry(oldestAddedAt);



  // ... existing code ...

  // Handle cart expired
  useEffect(() => {
    if (isExpired && !isEmpty) {
      emptyCart();
      showError('Cart expired. Items have been released.');
      onClose();
    }
  }, [isExpired, isEmpty, emptyCart, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      {/* Backdrop */}
      <div className="cart-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="cart-modal-container">
        {/* Header */}
        <header className="cart-header">
          <div className="cart-header-info">
            <div className="cart-header-icon">
              <ShoppingBag size={20} />
            </div>
            <div className="cart-header-text">
              <h2 id="cart-title" className="cart-title">Your Cart</h2>
              <p className="cart-count">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cart-close-btn"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </header>

        {/* Cart Items */}
        <div className="cart-items">
          {isEmpty ? (
            <div className="cart-empty">
              <Ticket size={48} className="cart-empty-icon" />
              <p className="cart-empty-title">Your cart is empty</p>
              <p className="cart-empty-text">Browse events to add tickets</p>
              <Link to="/events" onClick={onClose} className="mt-4 inline-block">
                <Button variant="primary">Browse Events</Button>
              </Link>
            </div>
          ) : (
            <div className="cart-items-list">
              {items.map((item) => (
                <article key={`${item.eventId}-${item.tierId}`} className="cart-item">
                  {/* Event Image */}
                  <div className="cart-item-image">
                    {item.eventImage ? (
                      <img src={item.eventImage} alt={item.eventTitle} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-muted)]">
                        <Ticket size={24} />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="cart-item-details">
                    <h3 className="cart-item-title">{item.eventTitle}</h3>
                    <p className="cart-item-meta">
                      {item.eventDate} • {item.tierName}
                    </p>
                    {item.venue && (
                      <p className="text-xs text-[var(--text-muted)] truncate">{item.venue}</p>
                    )}
                    <div className="cart-item-row mt-2">
                      <span className="cart-item-price">{formatCurrency(item.price * item.quantity)}</span>
                      {/* Quantity Controls */}
                      <div className="cart-quantity">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.eventId, item.tierId, item.quantity - 1)}
                          className="cart-quantity-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="cart-quantity-value">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.eventId, item.tierId, item.quantity + 1)}
                          className="cart-quantity-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.eventId, item.tierId)}
                    className="cart-remove-btn"
                    aria-label={`Remove ${item.eventTitle}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Totals */}
        {!isEmpty && (
          <footer className="cart-footer">
            {/* Price Breakdown */}
            <div className="cart-price-breakdown">
              <div className="cart-price-row">
                <span className="cart-price-label">Subtotal</span>
                <span className="cart-price-value">{formatCurrency(totalPrice)}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
                Service fees and taxes calculated at checkout
              </p>
            </div>

            {/* Actions */}
            <div className="cart-actions">
              <button
                type="button"
                onClick={emptyCart}
                className="cart-btn cart-btn-secondary"
              >
                Clear Cart
              </button>
              <Link to="/checkout" onClick={onClose} className="w-full">
                <button
                  type="button"
                  className="cart-btn cart-btn-primary w-full"
                >
                  <CreditCard size={16} />
                  Checkout
                </button>
              </Link>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
