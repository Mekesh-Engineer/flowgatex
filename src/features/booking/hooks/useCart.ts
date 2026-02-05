import { useCartStore } from '@/store/zustand/stores';

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice } =
    useCartStore();

  const addToCart = (
    eventId: string,
    eventTitle: string,
    tierId: string,
    tierName: string,
    price: number,
    quantity: number = 1
  ) => {
    addItem({ eventId, eventTitle, tierId, tierName, price, quantity });
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

  return {
    items,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    emptyCart,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    isEmpty: items.length === 0,
  };
}

export default useCart;
