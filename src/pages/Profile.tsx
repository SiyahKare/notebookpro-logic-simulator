import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useRepair } from '../context/RepairContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { FadeIn, AnimatedCounter } from '../components/AnimatedComponents';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { orders } = useOrder();
  const { repairRecords } = useRepair();
  const { favoritesCount } = useFavorites();
  const { actualTheme, setTheme, theme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: ''
  });

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Giriş Yapmalısınız
          </h2>
          <p className={`mb-6 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Profil sayfasını görüntülemek için giriş yapın.
          </p>
          <Link to="/" className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const userOrders = orders.filter(o => o.userId === user.id);
  const userRepairs = repairRecords.filter(r => r.customer_email === user.email);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = () => {
    // TODO: Save to backend
    setIsEditing(false);
  };

  const getRoleBadge = () => {
    const badges: Record<string, { color: string; label: string; icon: string }> = {
      ADMIN: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', label: 'Yönetici', icon: '👑' },
      DEALER_APPROVED: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', label: 'Onaylı Bayi', icon: '🏢' },
      DEALER_PENDING: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', label: 'Bayi Beklemede', icon: '⏳' },
      TECHNICIAN: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Teknisyen', icon: '🔧' },
      CUSTOMER: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', label: 'Müşteri', icon: '👤' }
    };
    return badges[user.role] || badges.CUSTOMER;
  };

  const badge = getRoleBadge();

  return (
    <>
      <SEO title="Profilim" description="Hesap bilgilerinizi ve ayarlarınızı yönetin" />
      
      <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Profile Header */}
          <FadeIn>
            <div className={`rounded-2xl p-6 mb-6 ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-4xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 px-2 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                    {badge.icon}
                  </span>
                </div>
                
                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {user.name}
                  </h1>
                  <p className={`${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {user.email}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-4 py-2 rounded-xl font-medium transition ${
                      actualTheme === 'dark' 
                        ? 'bg-slate-700 text-white hover:bg-slate-600' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isEditing ? 'İptal' : 'Düzenle'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl font-medium bg-red-100 text-red-600 hover:bg-red-200 transition dark:bg-red-900/30 dark:text-red-400"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Stats Cards */}
          <FadeIn delay={100}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Link to="/orders" className={`p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50'} shadow-sm transition group`}>
                <div className="text-3xl font-bold text-red-600">
                  <AnimatedCounter end={userOrders.length} />
                </div>
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'} group-hover:text-red-600 transition`}>
                  Siparişlerim
                </div>
              </Link>
              
              <Link to="/service" className={`p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50'} shadow-sm transition group`}>
                <div className="text-3xl font-bold text-blue-600">
                  <AnimatedCounter end={userRepairs.length} />
                </div>
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'} group-hover:text-blue-600 transition`}>
                  Servis Kayıtları
                </div>
              </Link>
              
              <Link to="/favorites" className={`p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50'} shadow-sm transition group`}>
                <div className="text-3xl font-bold text-pink-600">
                  <AnimatedCounter end={favoritesCount} />
                </div>
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'} group-hover:text-pink-600 transition`}>
                  Favorilerim
                </div>
              </Link>
              
              <div className={`p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                <div className="text-3xl font-bold text-green-600">
                  <AnimatedCounter end={user.role === 'DEALER_APPROVED' ? 15 : 0} suffix="%" />
                </div>
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  İndirim Oranı
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Tabs */}
          <FadeIn delay={200}>
            <div className={`rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm overflow-hidden`}>
              {/* Tab Headers */}
              <div className={`flex border-b ${actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                {[
                  { key: 'overview', label: 'Genel Bakış', icon: '📋' },
                  { key: 'settings', label: 'Ayarlar', icon: '⚙️' },
                  { key: 'security', label: 'Güvenlik', icon: '🔒' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                      activeTab === tab.key
                        ? 'text-red-600 border-b-2 border-red-600'
                        : actualTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Kişisel Bilgiler
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Ad Soyad
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className={`w-full px-4 py-2 rounded-xl border ${
                                actualTheme === 'dark' 
                                  ? 'bg-slate-700 border-slate-600 text-white' 
                                  : 'bg-white border-slate-200'
                              }`}
                            />
                          ) : (
                            <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                          )}
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            E-posta
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              value={formData.email}
                              onChange={e => setFormData({ ...formData, email: e.target.value })}
                              className={`w-full px-4 py-2 rounded-xl border ${
                                actualTheme === 'dark' 
                                  ? 'bg-slate-700 border-slate-600 text-white' 
                                  : 'bg-white border-slate-200'
                              }`}
                            />
                          ) : (
                            <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.email}</p>
                          )}
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Telefon
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={e => setFormData({ ...formData, phone: e.target.value })}
                              className={`w-full px-4 py-2 rounded-xl border ${
                                actualTheme === 'dark' 
                                  ? 'bg-slate-700 border-slate-600 text-white' 
                                  : 'bg-white border-slate-200'
                              }`}
                            />
                          ) : (
                            <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.phone}</p>
                          )}
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Rol
                          </label>
                          <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{badge.label}</p>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <button
                          onClick={handleSave}
                          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                        >
                          Değişiklikleri Kaydet
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Görünüm
                      </h3>
                      <div className="flex gap-3">
                        {['light', 'dark', 'system'].map(t => (
                          <button
                            key={t}
                            onClick={() => setTheme(t as any)}
                            className={`px-4 py-2 rounded-xl font-medium transition ${
                              theme === t
                                ? 'bg-red-600 text-white'
                                : actualTheme === 'dark'
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {t === 'light' ? '☀️ Açık' : t === 'dark' ? '🌙 Koyu' : '💻 Sistem'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Bildirimler
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: 'E-posta Bildirimleri', desc: 'Sipariş ve kampanya bildirimleri' },
                          { label: 'SMS Bildirimleri', desc: 'Sipariş durumu güncellemeleri' },
                          { label: 'Push Bildirimleri', desc: 'Anlık bildirimler' }
                        ].map((item, i) => (
                          <label key={i} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                            actualTheme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                          } transition`}>
                            <div>
                              <div className={`font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.label}</div>
                              <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</div>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-red-600 focus:ring-red-500" />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Şifre Değiştir
                      </h3>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Mevcut Şifre
                          </label>
                          <input
                            type="password"
                            className={`w-full px-4 py-2 rounded-xl border ${
                              actualTheme === 'dark' 
                                ? 'bg-slate-700 border-slate-600 text-white' 
                                : 'bg-white border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Yeni Şifre
                          </label>
                          <input
                            type="password"
                            className={`w-full px-4 py-2 rounded-xl border ${
                              actualTheme === 'dark' 
                                ? 'bg-slate-700 border-slate-600 text-white' 
                                : 'bg-white border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Yeni Şifre (Tekrar)
                          </label>
                          <input
                            type="password"
                            className={`w-full px-4 py-2 rounded-xl border ${
                              actualTheme === 'dark' 
                                ? 'bg-slate-700 border-slate-600 text-white' 
                                : 'bg-white border-slate-200'
                            }`}
                          />
                        </div>
                        <button className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
                          Şifreyi Güncelle
                        </button>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-xl border-2 border-dashed ${actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                      <h4 className={`font-semibold mb-2 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        🔐 İki Faktörlü Doğrulama
                      </h4>
                      <p className={`text-sm mb-3 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Hesabınızı daha güvenli hale getirmek için 2FA'yı etkinleştirin.
                      </p>
                      <button className={`px-4 py-2 rounded-xl font-medium ${
                        actualTheme === 'dark' 
                          ? 'bg-slate-700 text-white hover:bg-slate-600' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      } transition`}>
                        2FA'yı Etkinleştir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  );
};

export default Profile;

