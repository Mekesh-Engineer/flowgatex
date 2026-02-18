import { useCartStore } from '@/store/zustand/stores';
import { showSuccess } from '@/components/common/Toast';

export function useCart() {
  const { 
    items, 
    addItem, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    setPromoCode,
    promoCode,
    discountAmount,
    taxAmount,
    totalFinal,
    getTotalItems, 
    getTotalPrice 
  } = useCartStore();
  
  const addToCart = (
    eventId: string,
    eventTitle: string,
    eventDate: string,
    eventImage: string,
    venue: string,
    tierId: string,
    tierName: string,
    price: number,
    quantity: number = 1
  ) => {
    addItem({ eventId, eventTitle, eventDate, eventImage, venue, tierId, tierName, price, quantity, addedAt: Date.now() });
    showSuccess(`${quantity} × ${tierName} added to cart`);
  };

  const removeFromCart = (eventId: string, tierId: string) => {
    removeItem(eventId, tierId);
  };

  const updateItemQuantity = (eventId: string, tierId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(eventId, tierId);
    } else {
      updateQuantity(eventId, tierId, quantity);
    }
  };

  const emptyCart = () => {
    clearCart();
  };

  const applyPromo = (code: string, discount: number) => {
    setPromoCode(code, discount);
  };

  const removePromo = () => {
    setPromoCode(undefined, 0);
  };

  return {
    items,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    emptyCart,
    applyPromo,
    removePromo,
    promoCode,
    discountAmount,
    taxAmount,
    totalFinal,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    isEmpty: items.length === 0,
  };
}

export default useCart;
