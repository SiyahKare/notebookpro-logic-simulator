import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications, NotificationType, NotificationPriority } from '../context/NotificationContext';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { exchangeRate } = useCurrency();
  const { user, login } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER: return '🛒';
      case NotificationType.REPAIR: return '🔧';
      case NotificationType.STOCK: return '📦';
      case NotificationType.DEALER: return '🏢';
      case NotificationType.SYSTEM: return '⚙️';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT: return 'bg-red-500';
      case NotificationPriority.HIGH: return 'bg-orange-500';
      case NotificationPriority.MEDIUM: return 'bg-blue-500';
      case NotificationPriority.LOW: return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case UserRole.ADMIN:
        return { path: '/admin', label: 'Yönetim Paneli' };
      case UserRole.DEALER:
        return { path: '/dealer', label: 'Bayi Paneli' };
      case UserRole.TECHNICIAN:
        return { path: '/technician', label: 'Teknisyen Paneli' };
      default:
        return null;
    }
  };

  const dashboardLink = getDashboardLink();

  return (
    <nav className={`sticky top-0 z-50 border-b transition-colors ${
      actualTheme === 'dark' 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-100 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-red-200 shadow-lg">
              N
            </div>
            <div className="ml-3">
              <h1 className={`text-2xl font-bold tracking-tight ${
                actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Notebook<span className="text-red-600">Pro</span>
              </h1>
              <p className={`text-[10px] font-medium tracking-widest uppercase ${
                actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'
              }`}>
                Advanced Tech Solutions
              </p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/"
              className={`${isActive('/') && location.pathname === '/' ? 'text-red-600 font-semibold' : actualTheme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-800'} transition`}
            >
              Mağaza
            </Link>
            <Link 
              to="/products"
              className={`${isActive('/products') ? 'text-red-600 font-semibold' : actualTheme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-800'} transition`}
            >
              Ürünler
            </Link>
            <Link 
              to="/service"
              className={`${isActive('/service') ? 'text-red-600 font-semibold' : actualTheme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-800'} transition`}
            >
              Teknik Servis
            </Link>

            {/* Dashboard Link */}
            {dashboardLink && (
              <Link 
                to={dashboardLink.path}
                className={`${isActive(dashboardLink.path) ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : actualTheme === 'dark' ? 'text-slate-300 hover:text-red-400' : 'text-slate-500 hover:text-red-600'} px-3 py-1 rounded-lg font-semibold transition border border-transparent hover:border-red-100 dark:hover:border-red-900`}
              >
                {dashboardLink.label}
              </Link>
            )}

            {/* Notification Bell - Admin Only */}
            {user?.role === UserRole.ADMIN && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`relative p-2 transition ${
                    actualTheme === 'dark' ? 'text-slate-300 hover:text-red-400' : 'text-slate-500 hover:text-red-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                    <div className={`absolute right-0 mt-2 w-96 rounded-2xl shadow-2xl overflow-hidden z-50 ${
                      actualTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'
                    }`}>
                      <div className={`px-4 py-3 border-b flex items-center justify-between ${
                        actualTheme === 'dark' ? 'border-slate-700 bg-slate-700' : 'border-slate-100 bg-slate-50'
                      }`}>
                        <h3 className={`font-bold flex items-center gap-2 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          <span>🔔</span> Bildirimler
                          {unreadCount > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{unreadCount} yeni</span>
                          )}
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Tümünü Okundu İşaretle
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className={`py-8 text-center ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                            <div className="text-3xl mb-2">🔕</div>
                            <p className="text-sm">Bildirim yok</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.actionUrl) {
                                  navigate(notif.actionUrl);
                                }
                                setIsNotifOpen(false);
                              }}
                              className={`px-4 py-3 border-b cursor-pointer transition ${
                                actualTheme === 'dark'
                                  ? `border-slate-700 hover:bg-slate-700 ${!notif.isRead ? 'bg-red-900/20' : ''}`
                                  : `border-slate-50 hover:bg-slate-50 ${!notif.isRead ? 'bg-red-50/50' : ''}`
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg relative ${
                                    actualTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                                  }`}>
                                    {getNotifIcon(notif.type)}
                                    <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(notif.priority)}`}></span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold text-sm ${
                                      actualTheme === 'dark'
                                        ? (!notif.isRead ? 'text-white' : 'text-slate-300')
                                        : (!notif.isRead ? 'text-slate-900' : 'text-slate-600')
                                    }`}>
                                      {notif.title}
                                    </span>
                                    {!notif.isRead && (
                                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                  </div>
                                  <p className={`text-xs mt-0.5 line-clamp-2 ${
                                    actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>{notif.message}</p>
                                  <p className={`text-[10px] mt-1 ${
                                    actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                                  }`}>{formatTimeAgo(notif.timestamp)}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className={`px-4 py-3 border-t ${
                          actualTheme === 'dark' ? 'border-slate-700 bg-slate-700' : 'border-slate-100 bg-slate-50'
                        }`}>
                          <Link
                            to="/admin?tab=notifications"
                            onClick={() => setIsNotifOpen(false)}
                            className="block w-full text-center text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Tüm Bildirimleri Görüntüle →
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition ${
                actualTheme === 'dark' 
                  ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={actualTheme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
            >
              {actualTheme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {/* Currency Badge */}
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              actualTheme === 'dark' 
                ? 'bg-slate-700 border-slate-600 text-slate-300' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              USD: <span className={`font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{exchangeRate.toFixed(2)}₺</span>
            </div>

            {/* Cart Icon */}
            <Link 
              to="/cart"
              className={`relative p-2 transition group ${
                actualTheme === 'dark' ? 'text-slate-300 hover:text-red-400' : 'text-slate-500 hover:text-red-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile (Simulation Switcher) */}
            <div className="relative group">
              <button className={`flex items-center gap-2 text-sm font-medium transition ${
                actualTheme === 'dark' ? 'text-slate-300 hover:text-red-400' : 'text-slate-700 hover:text-red-600'
              }`}>
                <span>{user ? user.name.split(' ')[0] : 'Giriş Yap'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown for Sim */}
              <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl overflow-hidden hidden group-hover:block p-2 ${
                actualTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white border border-slate-100'
              }`}>
                <div className={`text-[10px] px-2 pb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                  SİMÜLASYON MODU
                </div>
                <button onClick={() => login('u_admin')} className={`block w-full text-left px-3 py-2 text-xs rounded-lg ${
                  actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-600' : 'text-slate-700 hover:bg-red-50'
                }`}>👑 Admin</button>
                <button onClick={() => login('u_tech_1')} className={`block w-full text-left px-3 py-2 text-xs rounded-lg ${
                  actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-600' : 'text-slate-700 hover:bg-red-50'
                }`}>🔧 Teknisyen</button>
                <button onClick={() => login('u_dealer_approved')} className={`block w-full text-left px-3 py-2 text-xs rounded-lg ${
                  actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-600' : 'text-slate-700 hover:bg-red-50'
                }`}>🏢 Bayi (Onaylı)</button>
                <button onClick={() => login('u_dealer_pending')} className={`block w-full text-left px-3 py-2 text-xs rounded-lg ${
                  actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-600' : 'text-slate-700 hover:bg-red-50'
                }`}>⏳ Bayi (Bekleyen)</button>
                <button onClick={() => login('u_customer')} className={`block w-full text-left px-3 py-2 text-xs rounded-lg ${
                  actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-600' : 'text-slate-700 hover:bg-red-50'
                }`}>👤 Son Kullanıcı</button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl ${
                actualTheme === 'dark' ? 'text-yellow-400' : 'text-slate-600'
              }`}
            >
              {actualTheme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link to="/cart" className="relative p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={`md:hidden border-t p-4 space-y-3 ${
          actualTheme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
        }`}>
          <Link 
            to="/" 
            onClick={() => setIsMenuOpen(false)}
            className={`block w-full text-left font-medium px-3 py-2 rounded-lg ${
              actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            🏠 Ana Sayfa
          </Link>
          <Link 
            to="/products"
            onClick={() => setIsMenuOpen(false)}
            className={`block w-full text-left font-medium px-3 py-2 rounded-lg ${
              actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            📦 Ürünler
          </Link>
          <Link 
            to="/service"
            onClick={() => setIsMenuOpen(false)}
            className={`block w-full text-left font-medium px-3 py-2 rounded-lg ${
              actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            🔧 Teknik Servis
          </Link>
          
          {dashboardLink && (
            <Link 
              to={dashboardLink.path}
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-left font-medium px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600"
            >
              ⚙️ {dashboardLink.label}
            </Link>
          )}

          {user?.role === UserRole.ADMIN && unreadCount > 0 && (
            <Link 
              to="/admin?tab=notifications"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-2 w-full text-left font-medium px-3 py-2 rounded-lg ${
                actualTheme === 'dark' ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>🔔</span> Bildirimler
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            </Link>
          )}

          <div className={`pt-3 mt-3 border-t ${actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className={`text-[10px] px-3 mb-2 ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              SİMÜLASYON MODU
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { login('u_admin'); setIsMenuOpen(false); }} className={`px-3 py-2 text-xs rounded-lg text-left ${
                actualTheme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-slate-50 text-slate-700'
              }`}>👑 Admin</button>
              <button onClick={() => { login('u_tech_1'); setIsMenuOpen(false); }} className={`px-3 py-2 text-xs rounded-lg text-left ${
                actualTheme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-slate-50 text-slate-700'
              }`}>🔧 Teknisyen</button>
              <button onClick={() => { login('u_dealer_approved'); setIsMenuOpen(false); }} className={`px-3 py-2 text-xs rounded-lg text-left ${
                actualTheme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-slate-50 text-slate-700'
              }`}>🏢 Bayi</button>
              <button onClick={() => { login('u_customer'); setIsMenuOpen(false); }} className={`px-3 py-2 text-xs rounded-lg text-left ${
                actualTheme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-slate-50 text-slate-700'
              }`}>👤 Müşteri</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
