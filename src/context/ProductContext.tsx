import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Product, ProductCategory } from '../types';
import { productsAPI } from '../services/api';

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
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  createdAt: Date;
  createdBy?: string;
}

// API'den gelen product formatı
interface APIProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  priceUsd: number;
  vatRate: number;
  stock: number;
  criticalLimit: number;
  dealerDiscountPercent: number;
  shelfLocation?: string;
  imageUrl?: string;
  isActive: boolean;
  compatibleModels?: { modelName: string }[];
  reviews?: { rating: number; comment?: string; user: { name: string }; createdAt: string }[];
  stockMovements?: {
    id: string;
    type: string;
    quantity: number;
    reason?: string;
    performedBy?: string;
    createdAt: string;
  }[];
}

// API product'ı frontend formatına çevir
const mapAPIProductToProduct = (apiProduct: APIProduct): Product => ({
  id: apiProduct.id,
  sku: apiProduct.sku,
  name: apiProduct.name,
  description: apiProduct.description,
  category: apiProduct.category.toLowerCase() as ProductCategory,
  price_usd: apiProduct.priceUsd,
  vat_rate: apiProduct.vatRate,
  stock: apiProduct.stock,
  critical_limit: apiProduct.criticalLimit,
  dealer_discount_percent: apiProduct.dealerDiscountPercent,
  shelf_location: apiProduct.shelfLocation || '',
  image_url: apiProduct.imageUrl,
  compatible_models: apiProduct.compatibleModels?.map(cm => cm.modelName) || [],
  reviews: apiProduct.reviews?.map(r => ({
    id: r.createdAt,
    user: r.user.name,
    rating: r.rating,
    comment: r.comment || '',
    date: new Date(r.createdAt).toLocaleDateString('tr-TR'),
  })) || [],
});

// Frontend product'ı API formatına çevir
const mapProductToAPIProduct = (product: Partial<Product>) => ({
  sku: product.sku,
  name: product.name,
  description: product.description,
  category: product.category?.toUpperCase(),
  priceUsd: product.price_usd,
  vatRate: product.vat_rate,
  stock: product.stock,
  criticalLimit: product.critical_limit,
  dealerDiscountPercent: product.dealer_discount_percent,
  shelfLocation: product.shelf_location,
  imageUrl: product.image_url,
  compatibleModels: product.compatible_models,
});

interface ProductContextType {
  products: Product[];
  stockMovements: StockMovement[];
  isLoading: boolean;
  error: string | null;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateStock: (productId: string, quantity: number) => Promise<void>;
  addStockMovement: (productId: string, type: StockMovementType, quantity: number, reason: string, reference?: string) => Promise<void>;
  getProductStockHistory: (productId: string) => StockMovement[];
  bulkUpdateStock: (updates: { productId: string; quantity: number; reason: string }[]) => Promise<void>;
  checkLowStock: () => Product[];
  getFilteredProducts: (filters: ProductFilters) => Product[];
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ürünleri yükle
  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await productsAPI.getAll({ limit: 100 });
      
      if (response.success && response.data?.products) {
        const mappedProducts = response.data.products.map(mapAPIProductToProduct);
        setProducts(mappedProducts);
        
        // Stock movements'ları da çıkar
        const allMovements: StockMovement[] = [];
        response.data.products.forEach((p: APIProduct) => {
          if (p.stockMovements) {
            p.stockMovements.forEach((sm) => {
              allMovements.push({
                id: sm.id,
                productId: p.id,
                type: sm.type.toLowerCase() as StockMovementType,
                quantity: sm.quantity,
                previousStock: 0,
                newStock: 0,
                reason: sm.reason || '',
                createdAt: new Date(sm.createdAt),
                createdBy: sm.performedBy,
              });
            });
          }
        });
        setStockMovements(allMovements.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Ürünler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // İlk yüklemede ürünleri çek
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const addProduct = async (product: Product) => {
    try {
      const response = await productsAPI.create(mapProductToAPIProduct(product) as Parameters<typeof productsAPI.create>[0]);
      
      if (response.success && response.data) {
        const newProduct = mapAPIProductToProduct(response.data);
        setProducts(prev => [...prev, newProduct]);
      }
    } catch (err) {
      console.error('Failed to create product:', err);
      throw err;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const apiUpdates: Parameters<typeof productsAPI.update>[1] = {};
      
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.price_usd !== undefined) apiUpdates.priceUsd = updates.price_usd;
      if (updates.stock !== undefined) apiUpdates.stock = updates.stock;
      if (updates.image_url !== undefined) apiUpdates.imageUrl = updates.image_url;
      if (updates.shelf_location !== undefined) apiUpdates.shelfLocation = updates.shelf_location;
      if (updates.critical_limit !== undefined) apiUpdates.criticalLimit = updates.critical_limit;
      if (updates.dealer_discount_percent !== undefined) apiUpdates.dealerDiscountPercent = updates.dealer_discount_percent;
      
      const response = await productsAPI.update(productId, apiUpdates);
      
      if (response.success) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, ...updates } : p
        ));
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      throw err;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const response = await productsAPI.delete(productId);
      
      if (response.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      throw err;
    }
  };

  const updateStock = async (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const diff = quantity - product.stock;
    
    try {
      const response = await productsAPI.updateStock(productId, {
        quantity: Math.abs(diff),
        type: diff > 0 ? 'IN' : 'OUT',
        reason: 'Manuel stok güncellemesi',
      });
      
      if (response.success) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, stock: quantity } : p
        ));
        
        // Local stock movement ekle
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
    } catch (err) {
      console.error('Failed to update stock:', err);
      throw err;
    }
  };

  const addStockMovement = async (
    productId: string, 
    type: StockMovementType, 
    quantity: number, 
    reason: string, 
    reference?: string
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const apiType = type === 'out' || type === 'sale' ? 'OUT' : 
                   type === 'in' || type === 'return' ? 'IN' : 'ADJUSTMENT';

    try {
      const response = await productsAPI.updateStock(productId, {
        quantity: Math.abs(quantity),
        type: apiType as 'IN' | 'OUT' | 'ADJUSTMENT',
        reason: reference ? `${reason} (Ref: ${reference})` : reason,
      });
      
      if (response.success) {
        const actualQuantity = type === 'out' || type === 'sale' ? -Math.abs(quantity) : Math.abs(quantity);
        const newStock = Math.max(0, product.stock + actualQuantity);

        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, stock: newStock } : p
        ));

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
      }
    } catch (err) {
      console.error('Failed to add stock movement:', err);
      throw err;
    }
  };

  const getProductStockHistory = (productId: string): StockMovement[] => {
    return stockMovements.filter(sm => sm.productId === productId);
  };

  const bulkUpdateStock = async (updates: { productId: string; quantity: number; reason: string }[]) => {
    for (const { productId, quantity, reason } of updates) {
      const product = products.find(p => p.id === productId);
      if (product) {
        await addStockMovement(productId, quantity > 0 ? 'in' : 'out', Math.abs(quantity), reason);
      }
    }
  };

  const checkLowStock = (): Product[] => {
    return products.filter(p => p.stock <= p.critical_limit);
  };

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
      isLoading,
      error,
      addProduct, 
      updateProduct,
      deleteProduct,
      updateStock,
      addStockMovement,
      getProductStockHistory,
      bulkUpdateStock,
      checkLowStock,
      getFilteredProducts,
      refreshProducts,
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
