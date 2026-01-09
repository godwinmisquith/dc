import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Cart, CartItem } from '../types';
import api from '../api/client';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (product_id: number, quantity?: number) => Promise<void>;
  updateCartItem: (item_id: number, quantity: number) => Promise<void>;
  removeFromCart: (item_id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const cartData = await api.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product_id: number, quantity = 1) => {
    await api.addToCart(product_id, quantity);
    await refreshCart();
  };

  const updateCartItem = async (item_id: number, quantity: number) => {
    await api.updateCartItem(item_id, quantity);
    await refreshCart();
  };

  const removeFromCart = async (item_id: number) => {
    await api.removeFromCart(item_id);
    await refreshCart();
  };

  const clearCart = async () => {
    await api.clearCart();
    setCart(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
