import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Notification Types
export enum NotificationType {
  ORDER = 'order',
  REPAIR = 'repair',
  STOCK = 'stock',
  DEALER = 'dealer',
  SYSTEM = 'system'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getNotificationsByType: (type: NotificationType) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Generate demo notifications
const generateDemoNotifications = (): Notification[] => {
  const now = new Date();
  return [
    {
      id: 'notif-1',
      type: NotificationType.ORDER,
      priority: NotificationPriority.HIGH,
      title: 'Yeni Sipariş',
      message: 'SIP-2024-001 numaralı yeni sipariş oluşturuldu. Müşteri: Ahmet Yılmaz',
      timestamp: new Date(now.getTime() - 5 * 60000), // 5 dk önce
      isRead: false,
      actionUrl: '/admin?tab=orders',
      metadata: { orderId: 'SIP-2024-001' }
    },
    {
      id: 'notif-2',
      type: NotificationType.STOCK,
      priority: NotificationPriority.URGENT,
      title: 'Kritik Stok Uyarısı',
      message: 'MacBook Pro 13" Ekran stok seviyesi kritik seviyenin altına düştü (2 adet kaldı)',
      timestamp: new Date(now.getTime() - 15 * 60000), // 15 dk önce
      isRead: false,
      actionUrl: '/admin?tab=products',
      metadata: { productId: 'prod-1', stock: 2 }
    },
    {
      id: 'notif-3',
      type: NotificationType.DEALER,
      priority: NotificationPriority.MEDIUM,
      title: 'Yeni Bayi Başvurusu',
      message: 'TechPro Bilişim A.Ş. bayi başvurusunda bulundu. Onay bekliyor.',
      timestamp: new Date(now.getTime() - 30 * 60000), // 30 dk önce
      isRead: false,
      actionUrl: '/admin?tab=dealers',
      metadata: { dealerId: 'dealer-1' }
    },
    {
      id: 'notif-4',
      type: NotificationType.REPAIR,
      priority: NotificationPriority.HIGH,
      title: 'Servis Durumu Güncellendi',
      message: 'SRV-NP-2024-0001 takip numaralı servis "Tamamlandı" olarak güncellendi',
      timestamp: new Date(now.getTime() - 60 * 60000), // 1 saat önce
      isRead: true,
      actionUrl: '/admin?tab=repairs',
      metadata: { trackingCode: 'SRV-NP-2024-0001' }
    },
    {
      id: 'notif-5',
      type: NotificationType.ORDER,
      priority: NotificationPriority.MEDIUM,
      title: 'Sipariş Kargoya Verildi',
      message: 'SIP-2024-002 numaralı sipariş Yurtiçi Kargo ile gönderildi',
      timestamp: new Date(now.getTime() - 2 * 60 * 60000), // 2 saat önce
      isRead: true,
      actionUrl: '/admin?tab=orders',
      metadata: { orderId: 'SIP-2024-002', trackingNumber: '123456789' }
    },
    {
      id: 'notif-6',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      title: 'Sistem Güncellemesi',
      message: 'Yeni özellikler eklendi: Dashboard widget\'ları ve bildirim merkezi',
      timestamp: new Date(now.getTime() - 24 * 60 * 60000), // 1 gün önce
      isRead: true
    }
  ];
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => generateDemoNotifications());

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationsByType = (type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  };

  // Simulate incoming notifications (for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      if (random < 0.1) { // 10% chance every 30 seconds
        const demoNotifications = [
          {
            type: NotificationType.ORDER,
            priority: NotificationPriority.HIGH,
            title: 'Yeni Sipariş',
            message: `SIP-${Date.now().toString().slice(-6)} numaralı yeni sipariş alındı!`,
          },
          {
            type: NotificationType.REPAIR,
            priority: NotificationPriority.MEDIUM,
            title: 'Yeni Servis Talebi',
            message: 'Yeni bir servis talebi oluşturuldu',
          },
        ];
        const randomNotif = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
        addNotification(randomNotif);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        getNotificationsByType
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

