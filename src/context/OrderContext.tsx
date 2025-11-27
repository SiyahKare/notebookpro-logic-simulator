import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Order, OrderStatus, CartItem } from '../types';

interface OrderContextType {
  orders: Order[];
  placeOrder: (items: CartItem[], totalAmount: number, customerInfo: { userId: string; name: string }) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  getOrdersByUserId: (userId: string) => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  /**
   * Yeni Sipariş Oluşturma
   */
  const placeOrder = (items: CartItem[], totalAmount: number, customerInfo: { userId: string; name: string }): Order => {
    const newOrder: Order = {
      id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: customerInfo.userId,
      customerName: customerInfo.name,
      items: [...items], // Sepetin o anki kopyasını al
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
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getOrdersByUserId = (userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, updateOrderStatus, getOrdersByUserId }}>
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