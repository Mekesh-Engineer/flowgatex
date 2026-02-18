import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import CartDrawer from './CartDrawer';

interface CartIconProps {
    className?: string;
}

function CartIcon({ className }: CartIconProps) {
    const { totalItems } = useCart();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsDrawerOpen(true)}
                className={`relative p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] transition-all duration-200 ${className ?? ''}`}
                aria-label={`Shopping cart with ${totalItems} items`}
            >
                <ShoppingCart size={18} className="text-[var(--text-secondary)]" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-[var(--color-primary)] rounded-full animate-in zoom-in duration-200">
                        {totalItems > 9 ? '9+' : totalItems}
                    </span>
                )}
            </button>

            <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </>
    );
}

export default CartIcon;
