import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  qty: number;
  image?: string;
  category?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeItem: (id: string | number) => void;
  updateQty: (id: string | number, delta: number) => void;
  clearCart: () => void;
  get totalItems(): number;
  get totalPrice(): number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },
      updateQty: (id, delta) => {
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
            .filter((i) => i.qty > 0),
        }));
      },
      clearCart: () => set({ items: [] }),
      get totalItems() {
        return get().items.reduce((acc, item) => acc + item.qty, 0);
      },
      get totalPrice() {
        return get().items.reduce((acc, item) => acc + item.price * item.qty, 0);
      },
    }),
    {
      name: 'cafe1cr-cart',
    }
  )
);
