import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL - Production veya localhost
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('siyahkare.com') 
    ? 'https://notebookpro-api.siyahkare.com/api'
    : 'http://localhost:5001/api');

// Token storage keys
const ACCESS_TOKEN_KEY = 'notebookpro_access_token';
const REFRESH_TOKEN_KEY = 'notebookpro_refresh_token';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token management
export const tokenManager = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          tokenManager.setTokens(accessToken, newRefreshToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          
          return api(originalRequest);
        } catch {
          tokenManager.clearTokens();
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// ========================
// AUTH API
// ========================
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
    companyTitle?: string;
    taxOffice?: string;
    taxNumber?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  logout: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
    tokenManager.clearTokens();
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },
};

// ========================
// PRODUCTS API
// ========================
export const productsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  create: async (data: {
    sku: string;
    name: string;
    category: string;
    priceUsd: number;
    stock?: number;
    description?: string;
    imageUrl?: string;
    shelfLocation?: string;
    criticalLimit?: number;
    dealerDiscountPercent?: number;
    compatibleModels?: string[];
  }) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<{
    name: string;
    description: string;
    priceUsd: number;
    stock: number;
    imageUrl: string;
    isActive: boolean;
    shelfLocation: string;
    criticalLimit: number;
    dealerDiscountPercent: number;
  }>) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  
  updateStock: async (id: string, data: {
    quantity: number;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    reason?: string;
  }) => {
    const response = await api.post(`/products/${id}/stock`, data);
    return response.data;
  },
  
  toggleFavorite: async (id: string) => {
    const response = await api.post(`/products/${id}/favorite`);
    return response.data;
  },
  
  addReview: async (id: string, data: { rating: number; comment?: string }) => {
    const response = await api.post(`/products/${id}/review`, data);
    return response.data;
  },
};

// ========================
// ORDERS API
// ========================
export const ordersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  create: async (data: {
    items: Array<{ productId: string; quantity: number }>;
    addressId?: string;
    couponCode?: string;
    isGiftWrapped?: boolean;
    giftMessage?: string;
    customerNote?: string;
    paymentMethod?: string;
  }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  
  updateStatus: async (id: string, data: {
    status: string;
    note?: string;
    trackingNumber?: string;
    carrier?: string;
  }) => {
    const response = await api.patch(`/orders/${id}/status`, data);
    return response.data;
  },
  
  cancel: async (id: string, reason?: string) => {
    const response = await api.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },
};

// ========================
// REPAIRS API
// ========================
export const repairsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    technicianId?: string;
    priority?: string;
  }) => {
    const response = await api.get('/repairs', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/repairs/${id}`);
    return response.data;
  },
  
  track: async (trackingCode: string) => {
    const response = await api.get(`/repairs/track/${trackingCode}`);
    return response.data;
  },
  
  create: async (data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deviceBrand: string;
    deviceModel: string;
    serialNumber?: string;
    issueDescription: string;
    priority?: string;
    userId?: string;
  }) => {
    const response = await api.post('/repairs', data);
    return response.data;
  },
  
  updateStatus: async (id: string, data: {
    status: string;
    note?: string;
    technicianId?: string;
    estimatedCost?: number;
    finalCost?: number;
  }) => {
    const response = await api.patch(`/repairs/${id}/status`, data);
    return response.data;
  },
  
  addParts: async (id: string, parts: Array<{ productId: string; quantity: number }>) => {
    const response = await api.post(`/repairs/${id}/parts`, { parts });
    return response.data;
  },
};

// ========================
// USERS API
// ========================
export const usersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isApproved?: boolean;
  }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  update: async (id: string, data: {
    isApproved?: boolean;
    isActive?: boolean;
    role?: string;
  }) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
  
  getFavorites: async () => {
    const response = await api.get('/users/me/favorites');
    return response.data;
  },
  
  // Addresses
  getAddresses: async () => {
    const response = await api.get('/users/me/addresses');
    return response.data;
  },
  
  addAddress: async (data: {
    title: string;
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    postalCode?: string;
    isDefault?: boolean;
  }) => {
    const response = await api.post('/users/me/addresses', data);
    return response.data;
  },
  
  updateAddress: async (id: string, data: Partial<{
    title: string;
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    postalCode: string;
    isDefault: boolean;
  }>) => {
    const response = await api.put(`/users/me/addresses/${id}`, data);
    return response.data;
  },
  
  deleteAddress: async (id: string) => {
    const response = await api.delete(`/users/me/addresses/${id}`);
    return response.data;
  },
};

// ========================
// NOTIFICATIONS API
// ========================
export const notificationsAPI = {
  getAll: async (params?: { unreadOnly?: boolean }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// ========================
// COUPONS API
// ========================
export const couponsAPI = {
  validate: async (code: string, cartTotal?: number) => {
    const response = await api.post('/coupons/validate', { code, cartTotal });
    return response.data;
  },
  
  getAll: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },
  
  create: async (data: {
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    usageLimit?: number;
    validFrom?: string;
    validUntil: string;
    description?: string;
    categories?: string[];
  }) => {
    const response = await api.post('/coupons', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<{
    isActive: boolean;
    usageLimit: number;
    validUntil: string;
  }>) => {
    const response = await api.put(`/coupons/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },
};

// ========================
// SETTINGS API
// ========================
export const settingsAPI = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  
  get: async (key: string) => {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  },
  
  update: async (key: string, value: string, type?: string) => {
    const response = await api.put(`/settings/${key}`, { value, type });
    return response.data;
  },
  
  bulkUpdate: async (settings: Array<{ key: string; value: string; type?: string }>) => {
    const response = await api.put('/settings', { settings });
    return response.data;
  },
};

export default api;

