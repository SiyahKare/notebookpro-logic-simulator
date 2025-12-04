import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product, ProductCategory } from '../types';
import { mockProducts } from '../data/mockData';

// Filter interface
export interface ProductFilters {
  search: string;
  category: ProductCategory | 'all';
  stockStatus: 'all' | 'critical' | 'out_of_stock' | 'in_stock';
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  updateStock: (productId: string, quantity: number) => void;
  checkLowStock: () => Product[];
  getFilteredProducts: (filters: ProductFilters) => Product[];
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

  /**
   * Ürün Güncelleme
   */
  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...updates } : p
    ));
  };

  /**
   * Ürün Silme
   */
  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const updateStock = (productId: string, quantity: number) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock: quantity } : p
    ));
  };

  /**
   * Kritik Stok Kontrolü
   */
  const checkLowStock = (): Product[] => {
    return products.filter(p => p.stock <= p.critical_limit);
  };

  /**
   * Filtreleme Fonksiyonu
   */
  const getFilteredProducts = (filters: ProductFilters): Product[] => {
    return products.filter(product => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.compatible_models.some(m => m.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false;
      }

      // Stock status filter
      if (filters.stockStatus !== 'all') {
        if (filters.stockStatus === 'out_of_stock' && product.stock > 0) return false;
        if (filters.stockStatus === 'critical' && product.stock > product.critical_limit) return false;
        if (filters.stockStatus === 'in_stock' && product.stock <= product.critical_limit) return false;
      }

      return true;
    });
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      addProduct, 
      updateProduct,
      deleteProduct,
      updateStock, 
      checkLowStock,
      getFilteredProducts
    }}>
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
