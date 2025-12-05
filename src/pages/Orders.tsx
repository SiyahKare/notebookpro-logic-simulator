import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { FadeIn } from '../components/AnimatedComponents';
import { formatCurrency } from '../utils/pricing';
import { OrderStatus } from '../types';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const { orders } = useOrder();
  const { actualTheme } = useTheme();
  
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className={`text-2xl font-bold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Giriş Yapmalısınız
          </h2>
          <Link to="/" className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const userOrders = orders
    .filter(o => o.userId === user.id)
    .filter(o => filter === 'all' || o.status === filter)
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

  const getStatusInfo = (status: OrderStatus) => {
    const statuses = {
      [OrderStatus.PENDING]: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '⏳' },
      [OrderStatus.CONFIRMED]: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '✓' },
      [OrderStatus.PREPARING]: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '📦' },
      [OrderStatus.SHIPPED]: { label: 'Kargoya Verildi', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: '🚚' },
      [OrderStatus.DELIVERED]: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '✅' },
      [OrderStatus.CANCELLED]: { label: 'İptal Edildi', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '✕' }
    };
    return statuses[status] || statuses[OrderStatus.PENDING];
  };

  return (
    <>
      <SEO title="Siparişlerim" description="Sipariş geçmişinizi görüntüleyin ve takip edin" />
      
      <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  📦 Siparişlerim
                </h1>
                <p className={`${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Toplam {userOrders.length} sipariş
                </p>
              </div>
              
              {/* Filter */}
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
                className={`px-4 py-2 rounded-xl border font-medium ${
                  actualTheme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <option value="all">Tüm Siparişler</option>
                <option value={OrderStatus.PENDING}>Beklemede</option>
                <option value={OrderStatus.CONFIRMED}>Onaylandı</option>
                <option value={OrderStatus.PREPARING}>Hazırlanıyor</option>
                <option value={OrderStatus.SHIPPED}>Kargoda</option>
                <option value={OrderStatus.DELIVERED}>Teslim Edildi</option>
                <option value={OrderStatus.CANCELLED}>İptal Edildi</option>
              </select>
            </div>
          </FadeIn>

          {/* Orders List */}
          {userOrders.length === 0 ? (
            <FadeIn delay={100}>
              <div className={`text-center py-16 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-6xl mb-4">📭</div>
                <h3 className={`text-xl font-bold mb-2 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Henüz siparişiniz yok
                </h3>
                <p className={`mb-6 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  İlk siparişinizi vermek için ürünlerimize göz atın.
                </p>
                <Link to="/products" className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
                  Ürünlere Göz At
                </Link>
              </div>
            </FadeIn>
          ) : (
            <div className="space-y-4">
              {userOrders.map((order, index) => {
                const statusInfo = getStatusInfo(order.status);
                const isExpanded = selectedOrder === order.id;
                
                return (
                  <FadeIn key={order.id} delay={index * 50}>
                    <div className={`rounded-2xl overflow-hidden ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                      {/* Order Header */}
                      <button
                        onClick={() => setSelectedOrder(isExpanded ? null : order.id)}
                        className={`w-full p-4 flex items-center justify-between ${
                          actualTheme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                        } transition`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                            actualTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                          }`}>
                            {statusInfo.icon}
                          </div>
                          <div className="text-left">
                            <div className={`font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              #{order.id.slice(-8).toUpperCase()}
                            </div>
                            <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              }) : 'Tarih yok'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <div className={`text-right ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <div className="font-bold">{formatCurrency(order.totalAmount)}</div>
                            <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              {order.items.length} ürün
                            </div>
                          </div>
                          <svg 
                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className={`border-t ${actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-100'} p-4`}>
                          {/* Order Items */}
                          <div className="space-y-3 mb-4">
                            {order.items.map((item, i) => (
                              <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${
                                actualTheme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'
                              }`}>
                                <img 
                                  src={item.product.image_url} 
                                  alt={item.product.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className={`font-medium truncate ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {item.product.name}
                                  </div>
                                  <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {item.quantity} adet × {formatCurrency(item.unitPrice)}
                                  </div>
                                </div>
                                <div className={`font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {formatCurrency(item.quantity * item.unitPrice)}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Order Actions */}
                          <div className="flex flex-wrap gap-2">
                            {order.status === OrderStatus.SHIPPED && (
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                                🚚 Kargo Takibi
                              </button>
                            )}
                            {order.status === OrderStatus.DELIVERED && (
                              <button className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition">
                                ⭐ Değerlendir
                              </button>
                            )}
                            <button className={`px-4 py-2 rounded-xl text-sm font-medium ${
                              actualTheme === 'dark' 
                                ? 'bg-slate-700 text-white hover:bg-slate-600' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            } transition`}>
                              📄 Fatura İndir
                            </button>
                            {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
                              <button className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-200 transition dark:bg-red-900/30 dark:text-red-400">
                                ✕ İptal Et
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Orders;

