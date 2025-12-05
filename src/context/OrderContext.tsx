import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Order, OrderStatus, CartItem, OrderFilters } from '../types';
import { ordersAPI } from '../services/api';
import { useAuth } from './AuthContext';

// API'den gelen order formatı
interface APIOrder {
  id: string;
  orderNumber: string;
  userId: string;
  user?: { name: string; phone?: string; email: string };
  address?: { fullName: string; phone: string; city: string; district: string; address: string };
  status: string;
  subtotal: number;
  vatAmount: number;
  discount: number;
  shippingCost: number;
  totalAmount: number;
  couponCode?: string;
  couponDiscount: number;
  trackingNumber?: string;
  carrier?: string;
  customerNote?: string;
  adminNote?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  items?: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      sku: string;
      name: string;
      category: string;
      imageUrl?: string;
      priceUsd: number;
    };
  }[];
}

// Status mapping
const mapAPIStatusToOrderStatus = (status: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    'PENDING': OrderStatus.PROCESSING,
    'CONFIRMED': OrderStatus.PROCESSING,
    'PREPARING': OrderStatus.PROCESSING,
    'SHIPPED': OrderStatus.SHIPPED,
    'DELIVERED': OrderStatus.DELIVERED,
    'CANCELLED': OrderStatus.CANCELLED,
    'REFUNDED': OrderStatus.CANCELLED,
  };
  return statusMap[status] || OrderStatus.PROCESSING;
};

// API order'ı frontend formatına çevir
const mapAPIOrderToOrder = (apiOrder: APIOrder): Order => ({
  id: apiOrder.orderNumber || apiOrder.id,
  userId: apiOrder.userId,
  customerName: apiOrder.address?.fullName || apiOrder.user?.name || 'Misafir',
  customerPhone: apiOrder.address?.phone || apiOrder.user?.phone,
  customerEmail: apiOrder.user?.email,
  customerAddress: apiOrder.address 
    ? `${apiOrder.address.address}, ${apiOrder.address.district}/${apiOrder.address.city}`
    : undefined,
  items: apiOrder.items?.map(item => ({
    product: {
      id: item.product.id,
      sku: item.product.sku,
      name: item.product.name,
      category: item.product.category.toLowerCase() as any,
      price_usd: item.product.priceUsd,
      vat_rate: 0.20,
      stock: 0,
      critical_limit: 0,
      shelf_location: '',
      compatible_models: [],
      image_url: item.product.imageUrl,
    },
    quantity: item.quantity,
  })) || [],
  totalAmount: apiOrder.totalAmount,
  status: mapAPIStatusToOrderStatus(apiOrder.status),
  trackingNumber: apiOrder.trackingNumber,
  shippingCompany: apiOrder.carrier,
  createdAt: new Date(apiOrder.createdAt),
  shippedAt: apiOrder.shippedAt ? new Date(apiOrder.shippedAt) : undefined,
  deliveredAt: apiOrder.deliveredAt ? new Date(apiOrder.deliveredAt) : undefined,
  notes: apiOrder.adminNote || apiOrder.customerNote,
});

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  placeOrder: (items: CartItem[], totalAmount: number, customerInfo: { 
    userId: string; 
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    addressId?: string;
    couponCode?: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  updateTrackingNumber: (orderId: string, trackingNumber: string, shippingCompany?: string) => Promise<void>;
  updateOrderNotes: (orderId: string, notes: string) => void;
  getOrdersByUserId: (userId: string) => Order[];
  getFilteredOrders: (filters: OrderFilters) => Order[];
  generateInvoiceHTML: (order: Order) => string;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Siparişleri yükle
  const refreshOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ordersAPI.getAll({ limit: 100 });
      
      if (response.success && response.data?.orders) {
        const mappedOrders = response.data.orders.map(mapAPIOrderToOrder);
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Siparişler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // User değiştiğinde siparişleri yükle
  useEffect(() => {
    if (user) {
      refreshOrders();
    }
  }, [user, refreshOrders]);

  /**
   * Yeni Sipariş Oluşturma
   */
  const placeOrder = async (
    items: CartItem[], 
    totalAmount: number, 
    customerInfo: { 
      userId: string; 
      name: string; 
      phone?: string; 
      email?: string; 
      address?: string;
      addressId?: string;
      couponCode?: string;
    }
  ): Promise<Order> => {
    try {
      const response = await ordersAPI.create({
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        addressId: customerInfo.addressId,
        couponCode: customerInfo.couponCode,
        customerNote: customerInfo.address,
      });
      
      if (response.success && response.data) {
        const newOrder = mapAPIOrderToOrder(response.data);
        setOrders(prev => [newOrder, ...prev]);
        return newOrder;
      }
      
      throw new Error('Sipariş oluşturulamadı');
    } catch (err) {
      console.error('Failed to create order:', err);
      throw err;
    }
  };

  /**
   * Admin Sipariş Durumu Güncelleme
   */
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Frontend status'u API status'a çevir
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PROCESSING]: 'PREPARING',
      [OrderStatus.SHIPPED]: 'SHIPPED',
      [OrderStatus.DELIVERED]: 'DELIVERED',
      [OrderStatus.CANCELLED]: 'CANCELLED',
    };

    try {
      const response = await ordersAPI.updateStatus(orderId, {
        status: statusMap[newStatus] || 'PENDING',
      });
      
      if (response.success) {
        setOrders(prev => prev.map(order => {
          if (order.id !== orderId) return order;
          
          const updates: Partial<Order> = { status: newStatus };
          
          if (newStatus === OrderStatus.SHIPPED && !order.shippedAt) {
            updates.shippedAt = new Date();
          }
          if (newStatus === OrderStatus.DELIVERED && !order.deliveredAt) {
            updates.deliveredAt = new Date();
          }
          
          return { ...order, ...updates };
        }));
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      throw err;
    }
  };

  /**
   * Kargo Takip No Güncelleme
   */
  const updateTrackingNumber = async (orderId: string, trackingNumber: string, shippingCompany?: string) => {
    try {
      const response = await ordersAPI.updateStatus(orderId, {
        status: 'SHIPPED',
        trackingNumber,
        carrier: shippingCompany,
      });
      
      if (response.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, trackingNumber, shippingCompany: shippingCompany || order.shippingCompany, shippedAt: new Date() } 
            : order
        ));
      }
    } catch (err) {
      console.error('Failed to update tracking number:', err);
      throw err;
    }
  };

  /**
   * Sipariş Notu Güncelleme (Local only)
   */
  const updateOrderNotes = (orderId: string, notes: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, notes } : order
    ));
  };

  /**
   * Kullanıcıya göre siparişleri getir
   */
  const getOrdersByUserId = (userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  };

  /**
   * Filtrelenmiş Siparişler
   */
  const getFilteredOrders = (filters: OrderFilters): Order[] => {
    return orders.filter(order => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          order.id.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          (order.customerPhone && order.customerPhone.includes(searchLower)) ||
          (order.trackingNumber && order.trackingNumber.includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const orderDate = new Date(order.createdAt);
        if (orderDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const orderDate = new Date(order.createdAt);
        if (orderDate > filters.dateTo) return false;
      }

      return true;
    });
  };

  /**
   * Fatura HTML Oluştur
   */
  const generateInvoiceHTML = (order: Order): string => {
    const itemsHTML = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₺${(item.product.price_usd * 35 * 1.20).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Fatura - ${order.id}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 3px solid #dc2626; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #1e293b; }
          .logo span { color: #dc2626; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { margin: 0; color: #dc2626; font-size: 24px; }
          .invoice-info p { margin: 4px 0; color: #64748b; font-size: 14px; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .party { width: 45%; }
          .party h3 { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
          .party p { margin: 4px 0; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f1f5f9; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
          th:last-child { text-align: right; }
          .totals { text-align: right; margin-top: 20px; }
          .totals .row { display: flex; justify-content: flex-end; margin: 8px 0; }
          .totals .label { width: 150px; color: #64748b; }
          .totals .value { width: 120px; font-weight: 600; }
          .totals .grand { font-size: 20px; color: #dc2626; border-top: 2px solid #dc2626; padding-top: 10px; margin-top: 10px; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Notebook<span>Pro</span></div>
          <div class="invoice-info">
            <h2>FATURA</h2>
            <p><strong>${order.id}</strong></p>
            <p>Tarih: ${new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>

        <div class="parties">
          <div class="party">
            <h3>Satıcı</h3>
            <p><strong>NotebookPro Teknoloji A.Ş.</strong></p>
            <p>Perpa Ticaret Merkezi</p>
            <p>B Blok Kat: 11 No: 1923</p>
            <p>Şişli / İstanbul</p>
            <p>VKN: 1234567890</p>
          </div>
          <div class="party">
            <h3>Alıcı</h3>
            <p><strong>${order.customerName}</strong></p>
            <p>${order.customerAddress || 'Adres belirtilmedi'}</p>
            <p>${order.customerPhone || ''}</p>
            <p>${order.customerEmail || ''}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ürün</th>
              <th style="text-align: center;">Adet</th>
              <th style="text-align: right;">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #94a3b8;">Ürün detayları yükleniyor...</td></tr>'}
          </tbody>
        </table>

        <div class="totals">
          <div class="row">
            <span class="label">Ara Toplam:</span>
            <span class="value">₺${(order.totalAmount / 1.20).toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="label">KDV (%20):</span>
            <span class="value">₺${(order.totalAmount - order.totalAmount / 1.20).toFixed(2)}</span>
          </div>
          <div class="row grand">
            <span class="label">Genel Toplam:</span>
            <span class="value">₺${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>NotebookPro Teknoloji A.Ş. | Tel: 0850 333 00 11 | info@notebookpro.com.tr</p>
          <p>Bu fatura elektronik ortamda oluşturulmuştur.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <OrderContext.Provider value={{ 
      orders,
      isLoading,
      error,
      placeOrder, 
      updateOrderStatus, 
      updateTrackingNumber,
      updateOrderNotes,
      getOrdersByUserId,
      getFilteredOrders,
      generateInvoiceHTML,
      refreshOrders,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
