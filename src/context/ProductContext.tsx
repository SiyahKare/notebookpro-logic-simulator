import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product } from '../types';
import { mockProducts } from '../data/mockData';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateStock: (productId: string, quantity: number) => void;
  checkLowStock: () => Product[]; // Kritik stok kontrolü
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const addProduct = (product: Product) => {
    const newProduct = {
      ...product,
      id: product.id || `prod_${Date.now()}`,
      critical_limit: product.critical_limit || 3
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateStock = (productId: string, quantity: number) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock: quantity } : p
    ));
  };

  /**
   * Kural 2: checkLowStock Fonksiyonu
   * Stoğu kritik limitin altına düşen ürünleri filtreler.
   */
  const checkLowStock = (): Product[] => {
    return products.filter(p => p.stock <= p.critical_limit);
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateStock, checkLowStock }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};