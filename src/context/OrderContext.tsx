import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Order, OrderStatus, CartItem, OrderFilters } from '../types';

// Mock orders for demo
const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    userId: 'u_customer1',
    customerName: 'Ahmet Yılmaz',
    customerPhone: '0532 123 4567',
    customerEmail: 'ahmet@email.com',
    customerAddress: 'Kadıköy, İstanbul',
    items: [],
    totalAmount: 2859.90,
    status: OrderStatus.PROCESSING,
    createdAt: new Date('2024-11-25'),
  },
  {
    id: 'ORD-2024-002',
    userId: 'u_dealer1',
    customerName: 'Mega Bilgisayar Ltd.',
    customerPhone: '0212 555 7890',
    customerEmail: 'siparis@megabilgisayar.com',
    customerAddress: 'Perpa Ticaret Merkezi, Şişli',
    items: [],
    totalAmount: 15420.00,
    status: OrderStatus.SHIPPED,
    trackingNumber: '3456789012',
    shippingCompany: 'Yurtiçi Kargo',
    createdAt: new Date('2024-11-20'),
    shippedAt: new Date('2024-11-22'),
  },
  {
    id: 'ORD-2024-003',
    userId: 'u_customer2',
    customerName: 'Mehmet Demir',
    customerPhone: '0544 987 6543',
    customerEmail: 'mehmet.demir@gmail.com',
    customerAddress: 'Çankaya, Ankara',
    items: [],
    totalAmount: 4589.80,
    status: OrderStatus.DELIVERED,
    trackingNumber: '9876543210',
    shippingCompany: 'Aras Kargo',
    createdAt: new Date('2024-11-15'),
    shippedAt: new Date('2024-11-17'),
    deliveredAt: new Date('2024-11-19'),
  },
];

interface OrderContextType {
  orders: Order[];
  placeOrder: (items: CartItem[], totalAmount: number, customerInfo: { 
    userId: string; 
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  updateTrackingNumber: (orderId: string, trackingNumber: string, shippingCompany?: string) => void;
  updateOrderNotes: (orderId: string, notes: string) => void;
  getOrdersByUserId: (userId: string) => Order[];
  getFilteredOrders: (filters: OrderFilters) => Order[];
  generateInvoiceHTML: (order: Order) => string;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  /**
   * Yeni Sipariş Oluşturma
   */
  const placeOrder = (
    items: CartItem[], 
    totalAmount: number, 
    customerInfo: { userId: string; name: string; phone?: string; email?: string; address?: string }
  ): Order => {
    const newOrder: Order = {
      id: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      userId: customerInfo.userId,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      customerAddress: customerInfo.address,
      items: [...items],
      totalAmount: totalAmount,
      status: OrderStatus.PROCESSING,
      createdAt: new Date(),
    };

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  /**
   * Admin Sipariş Durumu Güncelleme
   */
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
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
  };

  /**
   * Kargo Takip No Güncelleme
   */
  const updateTrackingNumber = (orderId: string, trackingNumber: string, shippingCompany?: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, trackingNumber, shippingCompany: shippingCompany || order.shippingCompany } 
        : order
    ));
  };

  /**
   * Sipariş Notu Güncelleme
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
      placeOrder, 
      updateOrderStatus, 
      updateTrackingNumber,
      updateOrderNotes,
      getOrdersByUserId,
      getFilteredOrders,
      generateInvoiceHTML
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
