import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { OrderStatus, UserRole } from '../types';
import { formatCurrency } from '../utils/pricing';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

const DealerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { orders } = useOrder();
  const { products } = useProducts();
  const { exchangeRate } = useCurrency();
  const { actualTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'prices'>('overview');

  // Check dealer status
  if (!user || user.role !== UserRole.DEALER) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SEO title="Erişim Engellendi" />
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Erişim Engellendi
          </h2>
          <p className={`mt-2 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Bu sayfayı görüntülemek için Bayi hesabı gereklidir.
          </p>
        </div>
      </div>
    );
  }

  if (!user.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SEO title="Onay Bekliyor" />
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Onay Bekleniyor
          </h2>
          <p className={`mt-2 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Bayi başvurunuz henüz onaylanmamış. Onaylandığında size bildirim göndereceğiz.
          </p>
          <div className={`mt-6 p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <strong>Başvuru Tarihi:</strong> {new Date(user.created_at).toLocaleDateString('tr-TR')}
            </p>
            {user.company_details && (
              <p className={`text-sm mt-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                <strong>Firma:</strong> {user.company_details.taxTitle}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dealer's orders
  const dealerOrders = orders.filter(o => o.userId === user.id);
  
  // Stats
  const stats = useMemo(() => ({
    totalOrders: dealerOrders.length,
    pendingOrders: dealerOrders.filter(o => o.status === OrderStatus.PROCESSING).length,
    totalSpent: dealerOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    thisMonthOrders: dealerOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }).length
  }), [dealerOrders]);

  // Calculate dealer price
  const calculateDealerPrice = (priceUsd: number, discount: number = 0) => {
    const base = priceUsd * exchangeRate * 1.20;
    const discounted = base * (1 - discount / 100);
    return Math.floor(discounted) + 0.90;
  };

  return (
    <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <SEO title="Bayi Paneli" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Hoş Geldiniz, {user.name}
              </h1>
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {user.company_details?.taxTitle || 'Bayi Hesabı'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-8 p-1 rounded-xl w-fit ${
          actualTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          {[
            { id: 'overview', label: 'Genel Bakış', icon: '📊' },
            { id: 'orders', label: 'Siparişlerim', icon: '🛒' },
            { id: 'products', label: 'Ürünler', icon: '📦' },
            { id: 'prices', label: 'Fiyat Listesi', icon: '💰' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? actualTheme === 'dark'
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-slate-900 shadow-sm'
                  : actualTheme === 'dark'
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-6 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                <div className="text-3xl mb-2">🛒</div>
                <div className={`text-3xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {stats.totalOrders}
                </div>
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Toplam Sipariş
                </div>
              </div>
              <div className={`p-6 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                <div className="text-3xl mb-2">⏳</div>
                <div className={`text-3xl font-bold text-amber-600`}>
                  {stats.pendingOrders}
                </div>
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bekleyen
                </div>
              </div>
              <div className={`p-6 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                <div className="text-3xl mb-2">💰</div>
                <div className={`text-2xl font-bold text-green-600`}>
                  {formatCurrency(stats.totalSpent)}
                </div>
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Toplam Harcama
                </div>
              </div>
              <div className={`p-6 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                <div className="text-3xl mb-2">📅</div>
                <div className={`text-3xl font-bold text-blue-600`}>
                  {stats.thisMonthOrders}
                </div>
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bu Ay
                </div>
              </div>
            </div>

            {/* Company Info */}
            {user.company_details && (
              <div className={`p-6 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                <h3 className={`font-bold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  🏢 Firma Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Ticari Unvan</p>
                    <p className={actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}>{user.company_details.taxTitle}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Vergi No</p>
                    <p className={actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}>{user.company_details.taxNumber}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Vergi Dairesi</p>
                    <p className={actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}>{user.company_details.taxOffice}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Adres</p>
                    <p className={actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}>{user.company_details.address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className={`p-6 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
              <h3 className={`font-bold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                ⚡ Hızlı İşlemler
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to="/products" className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                  <span className="text-2xl">🛍️</span>
                  <span className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Sipariş Ver</span>
                </Link>
                <button onClick={() => setActiveTab('prices')} className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition">
                  <span className="text-2xl">📋</span>
                  <span className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>Fiyat Listesi</span>
                </button>
                <button onClick={() => setActiveTab('orders')} className="flex flex-col items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition">
                  <span className="text-2xl">📦</span>
                  <span className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>Siparişlerim</span>
                </button>
                <Link to="/service" className="flex flex-col items-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition">
                  <span className="text-2xl">🔧</span>
                  <span className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>Servis Talebi</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className={`rounded-2xl overflow-hidden ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className={`font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Sipariş Geçmişi
              </h3>
            </div>
            {dealerOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">📭</div>
                <p className={actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                  Henüz siparişiniz bulunmuyor.
                </p>
                <Link to="/products" className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition">
                  Sipariş Ver
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {dealerOrders.map(order => (
                  <div key={order.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-mono text-sm ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {order.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                        order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                        order.status === OrderStatus.PROCESSING ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {order.items.length} ürün • {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                        {order.trackingNumber && (
                          <p className={`text-xs mt-1 ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            Kargo: {order.trackingNumber}
                          </p>
                        )}
                      </div>
                      <span className={`font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.filter(p => p.stock > 0).map(product => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className={`rounded-2xl overflow-hidden ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm hover:shadow-lg transition`}
              >
                <div className="aspect-video relative">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  {product.dealer_discount_percent && (
                    <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      -%{product.dealer_discount_percent}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h4 className={`font-medium text-sm line-clamp-2 mb-2 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {product.name}
                  </h4>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-slate-400 line-through">
                        {calculateDealerPrice(product.price_usd, 0).toLocaleString('tr-TR')}₺
                      </div>
                      <div className={`text-lg font-bold text-green-600`}>
                        {calculateDealerPrice(product.price_usd, product.dealer_discount_percent).toLocaleString('tr-TR')}₺
                      </div>
                    </div>
                    <span className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {product.stock} adet
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Price List Tab */}
        {activeTab === 'prices' && (
          <div className={`rounded-2xl overflow-hidden ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className={`font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Bayi Fiyat Listesi
              </h3>
              <button className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition">
                📥 Excel İndir
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={actualTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}>
                    <th className="px-6 py-3 text-left">SKU</th>
                    <th className="px-6 py-3 text-left">Ürün</th>
                    <th className="px-6 py-3 text-right">Liste Fiyatı</th>
                    <th className="px-6 py-3 text-center">İndirim</th>
                    <th className="px-6 py-3 text-right">Bayi Fiyatı</th>
                    <th className="px-6 py-3 text-center">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-3 font-mono text-xs">{product.sku}</td>
                      <td className={`px-6 py-3 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {product.name}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-400">
                        {calculateDealerPrice(product.price_usd, 0).toLocaleString('tr-TR')}₺
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-green-600 font-medium">%{product.dealer_discount_percent || 0}</span>
                      </td>
                      <td className={`px-6 py-3 text-right font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {calculateDealerPrice(product.price_usd, product.dealer_discount_percent).toLocaleString('tr-TR')}₺
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.stock === 0 ? 'bg-red-100 text-red-700' :
                          product.stock <= product.critical_limit ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerDashboard;

