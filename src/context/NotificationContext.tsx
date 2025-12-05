import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './AuthContext';

// Notification Types
export enum NotificationType {
  ORDER = 'order',
  REPAIR = 'repair',
  STOCK = 'stock',
  DEALER = 'dealer',
  SYSTEM = 'system',
  PROMOTION = 'promotion'
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

// API'den gelen notification formatı
interface APINotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Type mapping
const mapAPITypeToNotificationType = (type: string): NotificationType => {
  const typeMap: Record<string, NotificationType> = {
    'ORDER': NotificationType.ORDER,
    'REPAIR': NotificationType.REPAIR,
    'STOCK': NotificationType.STOCK,
    'SYSTEM': NotificationType.SYSTEM,
    'PROMOTION': NotificationType.PROMOTION,
  };
  return typeMap[type] || NotificationType.SYSTEM;
};

// API notification'ı frontend formatına çevir
const mapAPINotificationToNotification = (apiNotification: APINotification): Notification => ({
  id: apiNotification.id,
  type: mapAPITypeToNotificationType(apiNotification.type),
  priority: NotificationPriority.MEDIUM, // API'de priority yok, default kullan
  title: apiNotification.title,
  message: apiNotification.message,
  timestamp: new Date(apiNotification.createdAt),
  isRead: apiNotification.isRead,
  actionUrl: apiNotification.link,
});

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => void;
  getNotificationsByType: (type: NotificationType) => Notification[];
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Generate demo notifications for non-authenticated users
const generateDemoNotifications = (): Notification[] => {
  const now = new Date();
  return [
    {
      id: 'notif-1',
      type: NotificationType.ORDER,
      priority: NotificationPriority.HIGH,
      title: 'Yeni Sipariş',
      message: 'SIP-2024-001 numaralı yeni sipariş oluşturuldu. Müşteri: Ahmet Yılmaz',
      timestamp: new Date(now.getTime() - 5 * 60000),
      isRead: false,
      actionUrl: '/admin?tab=orders',
      metadata: { orderId: 'SIP-2024-001' }
    },
    {
      id: 'notif-2',
      type: NotificationType.STOCK,
      priority: NotificationPriority.URGENT,
      title: 'Kritik Stok Uyarısı',
      message: 'Dell 60Wh Battery stok seviyesi kritik seviyenin altına düştü (3 adet kaldı)',
      timestamp: new Date(now.getTime() - 15 * 60000),
      isRead: false,
      actionUrl: '/admin?tab=products',
      metadata: { productId: 'prod-1', stock: 3 }
    },
    {
      id: 'notif-3',
      type: NotificationType.DEALER,
      priority: NotificationPriority.MEDIUM,
      title: 'Yeni Bayi Başvurusu',
      message: 'TechPro Bilişim A.Ş. bayi başvurusunda bulundu. Onay bekliyor.',
      timestamp: new Date(now.getTime() - 30 * 60000),
      isRead: false,
      actionUrl: '/admin?tab=dealers',
      metadata: { dealerId: 'dealer-1' }
    },
    {
      id: 'notif-4',
      type: NotificationType.REPAIR,
      priority: NotificationPriority.HIGH,
      title: 'Servis Durumu Güncellendi',
      message: 'NB-2024-ABCD takip numaralı servis "Tamamlandı" olarak güncellendi',
      timestamp: new Date(now.getTime() - 60 * 60000),
      isRead: true,
      actionUrl: '/admin?tab=repairs',
      metadata: { trackingCode: 'NB-2024-ABCD' }
    },
    {
      id: 'notif-5',
      type: NotificationType.ORDER,
      priority: NotificationPriority.MEDIUM,
      title: 'Sipariş Kargoya Verildi',
      message: 'SIP-2024-002 numaralı sipariş Yurtiçi Kargo ile gönderildi',
      timestamp: new Date(now.getTime() - 2 * 60 * 60000),
      isRead: true,
      actionUrl: '/admin?tab=orders',
      metadata: { orderId: 'SIP-2024-002', trackingNumber: '123456789' }
    },
    {
      id: 'notif-6',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      title: 'Sistem Güncellemesi',
      message: 'Yeni özellikler eklendi: PostgreSQL entegrasyonu ve API desteği',
      timestamp: new Date(now.getTime() - 24 * 60 * 60000),
      isRead: true
    }
  ];
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Bildirimleri yükle
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      // Demo notifications for non-authenticated users
      setNotifications(generateDemoNotifications());
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await notificationsAPI.getAll();
      
      if (response.success && response.data?.notifications) {
        const mappedNotifications = response.data.notifications.map(mapAPINotificationToNotification);
        setNotifications(mappedNotifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      // Fallback to demo notifications
      setNotifications(generateDemoNotifications());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // User değiştiğinde bildirimleri yükle
  useEffect(() => {
    refreshNotifications();
  }, [user, refreshNotifications]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = async (id: string) => {
    try {
      if (isAuthenticated) {
        await notificationsAPI.markAsRead(id);
      }
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Still update locally
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      if (isAuthenticated) {
        await notificationsAPI.markAllAsRead();
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Still update locally
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      if (isAuthenticated) {
        await notificationsAPI.delete(id);
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
      // Still update locally
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationsByType = (type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  };

  // Simulate incoming notifications (for demo - only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      const random = Math.random();
      if (random < 0.05) { // 5% chance every 60 seconds
        const demoNotifications = [
          {
            type: NotificationType.ORDER,
            priority: NotificationPriority.HIGH,
            title: 'Yeni Sipariş',
            message: `ORD-${Date.now().toString().slice(-6)} numaralı yeni sipariş alındı!`,
          },
          {
            type: NotificationType.REPAIR,
            priority: NotificationPriority.MEDIUM,
            title: 'Yeni Servis Talebi',
            message: 'Yeni bir servis talebi oluşturuldu',
          },
          {
            type: NotificationType.STOCK,
            priority: NotificationPriority.HIGH,
            title: 'Stok Uyarısı',
            message: 'Bir ürünün stok seviyesi kritik seviyeye düştü',
          },
        ];
        const randomNotif = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
        addNotification(randomNotif);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        getNotificationsByType,
        refreshNotifications,
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
