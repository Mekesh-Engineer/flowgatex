import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/features/auth/types/auth.types';

// Re-export AuthUser so existing imports from stores.ts continue to work
export type { AuthUser };

// =============================================================================
// AUTH STORE — replaces Redux authSlice
// =============================================================================

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  updateProfile: (patch: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false, error: null }),
      clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      updateProfile: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : null,
        })),
    }),
    {
      name: 'flowgatex-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Re-export for backwards compat with code that imported User from authSlice
export type User = AuthUser;

// Theme store for light/dark mode
interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: true, // Default to dark mode
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (value) => set({ isDarkMode: value }),
    }),
    {
      name: 'flowgatex-theme',
    }
  )
);

// Sidebar store for collapse state
interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (value) => set({ isCollapsed: value }),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (value) => set({ isMobileOpen: value }),
}));

// Cart store for ticket purchases
export interface CartItem {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventImage?: string;
  venue?: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
  addedAt: number; // timestamp for cart expiration
  availableCount?: number; // for low-stock warnings
  originalPrice?: number; // for price-change detection
}

interface CartState {
  items: CartItem[];
  promoCode?: string;
  discountAmount: number;
  taxAmount: number;
  totalFinal: number;
  addItem: (item: CartItem) => void;
  removeItem: (eventId: string, tierId: string) => void;
  updateQuantity: (eventId: string, tierId: string, quantity: number) => void;
  clearCart: () => void;
  setPromoCode: (code: string | undefined, discount: number) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: undefined,
      discountAmount: 0,
      taxAmount: 0,
      totalFinal: 0,
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.eventId === item.eventId && i.tierId === item.tierId
          );
          let newItems;
          if (existingIndex > -1) {
            newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity;
          } else {
            newItems = [...state.items, { ...item, addedAt: item.addedAt || Date.now() }];
          }
          return { items: newItems };
        }),
      removeItem: (eventId, tierId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.eventId === eventId && item.tierId === tierId)
          ),
        })),
      updateQuantity: (eventId, tierId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.eventId === eventId && item.tierId === tierId
              ? { ...item, quantity }
              : item
          ),
        })),
      clearCart: () => set({ items: [], promoCode: undefined, discountAmount: 0, taxAmount: 0, totalFinal: 0 }),
      setPromoCode: (code, discount) => set({ promoCode: code, discountAmount: discount }),
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: 'flowgatex-cart',
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        discountAmount: state.discountAmount,
      }),
    }
  )
);
