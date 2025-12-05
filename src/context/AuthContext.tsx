import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { authAPI, usersAPI, tokenManager } from '../services/api';

// API'den gelen user formatı
interface APIUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'DEALER' | 'CUSTOMER';
  isApproved: boolean;
  isActive: boolean;
  companyTitle?: string;
  taxOffice?: string;
  taxNumber?: string;
  createdAt: string;
}

// API user'ı frontend formatına çevir
const mapAPIUserToUser = (apiUser: APIUser): User => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  phone: apiUser.phone || '',
  role: apiUser.role.toLowerCase() as UserRole,
  is_approved: apiUser.isApproved,
  company_details: apiUser.companyTitle ? {
    title: apiUser.companyTitle,
    taxOffice: apiUser.taxOffice,
    taxNumber: apiUser.taxNumber,
    address: '',
  } : undefined,
  created_at: new Date(apiUser.createdAt),
});

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  demoLogin: (role: UserRole) => void; // Demo login for development
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkDealerAccess: () => boolean;
  approveDealer: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
  companyTitle?: string;
  taxOffice?: string;
  taxNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Uygulama başlangıcında mevcut oturumu kontrol et
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getAccessToken();
      if (token) {
        try {
          const response = await authAPI.getMe();
          if (response.success && response.data) {
            setUser(mapAPIUserToUser(response.data));
          }
        } catch {
          tokenManager.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Admin için tüm kullanıcıları yükle
  const refreshUsers = useCallback(async () => {
    if (!user || user.role !== UserRole.ADMIN) return;
    
    try {
      const response = await usersAPI.getAll({ limit: 100 });
      if (response.success && response.data?.users) {
        setUsers(response.data.users.map(mapAPIUserToUser));
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [user]);

  // User değiştiğinde users'ı yükle (admin ise)
  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      refreshUsers();
    }
  }, [user, refreshUsers]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        const { accessToken, refreshToken, user: apiUser } = response.data;
        tokenManager.setTokens(accessToken, refreshToken);
        setUser(mapAPIUserToUser(apiUser));
        return true;
      } else {
        setError(response.message || 'Giriş başarısız');
        return false;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Giriş başarısız'
        : 'Sunucu hatası';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.register(data);
      
      if (response.success && response.data) {
        const { accessToken, refreshToken, user: apiUser } = response.data;
        tokenManager.setTokens(accessToken, refreshToken);
        setUser(mapAPIUserToUser(apiUser));
        return true;
      } else {
        setError(response.message || 'Kayıt başarısız');
        return false;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Kayıt başarısız'
        : 'Sunucu hatası';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Logout hatası olsa bile local state'i temizle
    } finally {
      tokenManager.clearTokens();
      setUser(null);
      setUsers([]);
    }
  };

  // Demo login for development - creates a mock user without API
  const demoLogin = (role: UserRole) => {
    const demoUsers: Record<UserRole, User> = {
      [UserRole.ADMIN]: {
        id: 'demo-admin',
        name: 'Demo Admin',
        email: 'admin@demo.com',
        phone: '5551112233',
        role: UserRole.ADMIN,
        is_approved: true,
        created_at: new Date(),
      },
      [UserRole.TECHNICIAN]: {
        id: 'demo-tech',
        name: 'Demo Teknisyen',
        email: 'tech@demo.com',
        phone: '5552223344',
        role: UserRole.TECHNICIAN,
        is_approved: true,
        created_at: new Date(),
      },
      [UserRole.DEALER]: {
        id: 'demo-dealer',
        name: 'Demo Bayi',
        email: 'dealer@demo.com',
        phone: '5553334455',
        role: UserRole.DEALER,
        is_approved: true,
        company_details: {
          title: 'Demo Bilgisayar Ltd.',
          taxOffice: 'Demo VD',
          taxNumber: '1234567890',
          address: 'Demo Adres',
        },
        created_at: new Date(),
      },
      [UserRole.CUSTOMER]: {
        id: 'demo-customer',
        name: 'Demo Müşteri',
        email: 'customer@demo.com',
        phone: '5554445566',
        role: UserRole.CUSTOMER,
        is_approved: true,
        created_at: new Date(),
      },
    };

    setUser(demoUsers[role]);
    setError(null);
  };

  const approveDealer = async (userId: string) => {
    try {
      const response = await usersAPI.update(userId, { isApproved: true });
      
      if (response.success) {
        // Kullanıcı listesini güncelle
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, is_approved: true } : u
        ));
        
        // Eğer aktif kullanıcı approve ediliyorsa session'ı da güncelle
        if (user && user.id === userId) {
          setUser({ ...user, is_approved: true });
        }
      }
    } catch (err) {
      console.error('Failed to approve dealer:', err);
      throw err;
    }
  };

  const checkDealerAccess = (): boolean => {
    if (!user) return false;
    return user.role === UserRole.DEALER && user.is_approved;
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      users,
      isLoading,
      isAuthenticated,
      error,
      login,
      demoLogin,
      register,
      logout, 
      checkDealerAccess,
      approveDealer,
      refreshUsers,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
