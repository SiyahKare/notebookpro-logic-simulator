import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product, CartItem } from '../types';
import { calculateProductPrice, formatCurrency } from '../utils/pricing';
import { useCurrency } from './CurrencyContext';
import { useAuth } from './AuthContext';

interface CartTotals {
  subtotalTL: number;
  vatTotalTL: number;
  grandTotalTL: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  calculateCartTotals: () => CartTotals;
  generateQuotePDF: () => void; // B2B Teklif Özelliği
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { exchangeRate } = useCurrency();
  const { user } = useAuth();

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateCartTotals = (): CartTotals => {
    let subtotalTL = 0;
    let vatTotalTL = 0;
    let grandTotalTL = 0;

    cartItems.forEach(item => {
      const pricing = calculateProductPrice(item.product, user, exchangeRate);
      subtotalTL += pricing.subtotalTL * item.quantity;
      vatTotalTL += pricing.vatAmountTL * item.quantity;
      grandTotalTL += pricing.finalPriceTL * item.quantity;
    });

    return { subtotalTL, vatTotalTL, grandTotalTL };
  };

  /**
   * Kural 3: generateQuotePDF Fonksiyonu
   * Simülasyon: Konsola basar ve yazdırma penceresini açar.
   */
  const generateQuotePDF = () => {
    console.log("PDF Teklif Oluşturuluyor...", {
      customer: user?.name,
      items: cartItems,
      date: new Date()
    });
    
    // Gerçek hayatta burada jsPDF vb. kullanılır. 
    // Simülasyon gereği window.print() tetikliyoruz.
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, calculateCartTotals, generateQuotePDF }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};