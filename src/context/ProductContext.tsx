import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product, ProductCategory } from '../types';
import { mockProducts } from '../data/mockData';

// Filter interface
export interface ProductFilters {
  search: string;
  category: ProductCategory | 'all';
  stockStatus: 'all' | 'critical' | 'out_of_stock' | 'in_stock';
}

// Stock Movement Types
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'sale' | 'return';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number; // positive for in, negative for out
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string; // order ID, repair ID etc.
  createdAt: Date;
  createdBy?: string;
}

interface ProductContextType {
  products: Product[];
  stockMovements: StockMovement[];
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  updateStock: (productId: string, quantity: number) => void;
  addStockMovement: (productId: string, type: StockMovementType, quantity: number, reason: string, reference?: string) => void;
  getProductStockHistory: (productId: string) => StockMovement[];
  bulkUpdateStock: (updates: { productId: string; quantity: number; reason: string }[]) => void;
  checkLowStock: () => Product[];
  getFilteredProducts: (filters: ProductFilters) => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Generate demo stock movements
const generateDemoStockMovements = (): StockMovement[] => {
  const movements: StockMovement[] = [];
  const now = new Date();
  
  mockProducts.forEach((product, idx) => {
    // Initial stock entry
    movements.push({
      id: `sm-${idx}-1`,
      productId: product.id,
      type: 'in',
      quantity: product.stock + 5,
      previousStock: 0,
      newStock: product.stock + 5,
      reason: 'İlk stok girişi',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60000), // 30 days ago
    });
    
    // Some random movements
    if (idx % 2 === 0) {
      movements.push({
        id: `sm-${idx}-2`,
        productId: product.id,
        type: 'sale',
        quantity: -3,
        previousStock: product.stock + 5,
        newStock: product.stock + 2,
        reason: 'Sipariş satışı',
        reference: `SIP-${1000 + idx}`,
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60000),
      });
      movements.push({
        id: `sm-${idx}-3`,
        productId: product.id,
        type: 'out',
        quantity: -2,
        previousStock: product.stock + 2,
        newStock: product.stock,
        reason: 'Servis için kullanım',
        reference: `SRV-${2000 + idx}`,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60000),
      });
    }
  });
  
  return movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => generateDemoStockMovements());

  const addProduct = (product: Product) => {
    const newProduct = {
      ...product,
      id: product.id || `prod_${Date.now()}`,
      critical_limit: product.critical_limit || 3
    };
    setProducts(prev => [...prev, newProduct]);
    
    // Add initial stock movement
    if (newProduct.stock > 0) {
      setStockMovements(prev => [{
        id: `sm-${Date.now()}`,
        productId: newProduct.id,
        type: 'in',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        reason: 'Yeni ürün - ilk stok',
        createdAt: new Date(),
      }, ...prev]);
    }
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
    const product = products.find(p => p.id === productId);
    if (product) {
      const diff = quantity - product.stock;
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stock: quantity } : p
      ));
      
      // Auto-create stock movement
      setStockMovements(prev => [{
        id: `sm-${Date.now()}`,
        productId,
        type: diff > 0 ? 'in' : 'out',
        quantity: diff,
        previousStock: product.stock,
        newStock: quantity,
        reason: 'Manuel stok güncellemesi',
        createdAt: new Date(),
      }, ...prev]);
    }
  };

  const addStockMovement = (
    productId: string, 
    type: StockMovementType, 
    quantity: number, 
    reason: string, 
    reference?: string
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const actualQuantity = type === 'out' || type === 'sale' ? -Math.abs(quantity) : Math.abs(quantity);
    const newStock = Math.max(0, product.stock + actualQuantity);

    // Update product stock
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock: newStock } : p
    ));

    // Create movement record
    setStockMovements(prev => [{
      id: `sm-${Date.now()}`,
      productId,
      type,
      quantity: actualQuantity,
      previousStock: product.stock,
      newStock,
      reason,
      reference,
      createdAt: new Date(),
    }, ...prev]);
  };

  const getProductStockHistory = (productId: string): StockMovement[] => {
    return stockMovements.filter(sm => sm.productId === productId);
  };

  const bulkUpdateStock = (updates: { productId: string; quantity: number; reason: string }[]) => {
    updates.forEach(({ productId, quantity, reason }) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        addStockMovement(productId, quantity > 0 ? 'in' : 'out', Math.abs(quantity), reason);
      }
    });
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
      stockMovements,
      addProduct, 
      updateProduct,
      deleteProduct,
      updateStock,
      addStockMovement,
      getProductStockHistory,
      bulkUpdateStock,
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
