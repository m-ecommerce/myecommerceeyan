import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartItem = {
  id: string
  name: string
  price: number
  image_url: string
  quantity: number
  size?: string // 👈 সাইজ টাইপ ডিফাইন করা হলো
}

type CartStore = {
  items: CartItem[]
  addToCart: (product: any) => void
  removeFromCart: (id: string) => void
  increaseQuantity: (id: string) => void
  decreaseQuantity: (id: string) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product) => set((state) => {
        const existingItem = state.items.find((item) => item.id === product.id)
        
        if (existingItem) {
          return {
            items: state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          }
        }

        // 👈 এই লাইনটি ফিক্স করা হলো (প্রোডাক্টের সাথে size ডেটা একদম নিখুঁতভাবে স্টোরে ঢুকবে)
        return { 
          items: [...state.items, { ...product, quantity: 1, size: product.size }] 
        }
      }),

      removeFromCart: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),

      increaseQuantity: (id) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        )
      })),

      decreaseQuantity: (id) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      })),

      clearCart: () => set({ items: [] }),

      totalItems: () => {
        const items = get().items || []
        return items.reduce((total, item) => total + item.quantity, 0)
      },

      totalPrice: () => {
        const items = get().items || []
        return items.reduce((total, item) => total + item.price * item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage', // লোকাল স্টোরেজ নাম
    }
  )
)