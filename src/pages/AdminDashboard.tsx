import React, { useState, useMemo } from 'react';
import { useProducts, ProductFilters, StockMovement, StockMovementType } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useRepair } from '../context/RepairContext';
import { useOrder } from '../context/OrderContext';
import { useNotifications, NotificationType, NotificationPriority, Notification } from '../context/NotificationContext';
import { useCurrency } from '../context/CurrencyContext';
import { Product, UserRole, RepairStatus, OrderStatus, Order, RepairRecord, WarrantyResult, OrderFilters, RepairFilters, StatusHistoryEntry, User } from '../types';
import { formatCurrency } from '../utils/pricing';
import SEO from '../components/SEO';
import CategoriesTab from '../components/admin/CategoriesTab';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { usersAPI, settingsAPI } from '../services/api';

const ITEMS_PER_PAGE = 10;

const AdminDashboard: React.FC = () => {
  const { user, users, approveDealer } = useAuth();
  const { products, categories, addProduct, updateProduct, deleteProduct, updateStock, getFilteredProducts, addStockMovement, getProductStockHistory, stockMovements } = useProducts();
  const { repairRecords, updateRepairStatus, assignTechnician, generateServiceLabel, sendToWarranty, concludeWarranty, getFilteredRepairs, createRepairFromAdmin } = useRepair();
  const { orders, updateOrderStatus, updateTrackingNumber, getFilteredOrders, generateInvoiceHTML } = useOrder();
  const { showToast, ToastContainer } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const { exchangeRate, setExchangeRate } = useCurrency();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'products' | 'dealers' | 'repairs' | 'orders' | 'notifications' | 'reports' | 'customers' | 'users' | 'settings' | 'promotions'>('dashboard');
  
  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  
  // --- Filters ---
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    stockStatus: 'all'
  });

  // --- Modals ---
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; productId: string; productName: string }>({
    isOpen: false, productId: '', productName: ''
  });
  
  // --- Warranty / RMA Modals State ---
  const [rmaModalOpen, setRmaModalOpen] = useState(false);
  const [rmaConcludeModalOpen, setRmaConcludeModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairRecord | null>(null);
  const [rmaFormData, setRmaFormData] = useState({ supplier: '', rmaCode: '' });
  const [concludeData, setConcludeData] = useState({ result: 'repaired' as WarrantyResult, notes: '', swapSerial: '' });
  
  // --- Stock Management Modal ---
  const [stockModal, setStockModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const [stockMovementForm, setStockMovementForm] = useState({ type: 'in' as StockMovementType, quantity: '', reason: '' });

  // --- Product Form State ---
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', shelf_location: '', price_usd: '', stock: '',
    categoryId: '', subCategoryId: '', models: '', critical_limit: '3', dealer_discount: '10'
  });

  const technicians = users.filter(u => u.role === UserRole.TECHNICIAN);
  const suppliers = ["Arena Bilgisayar", "KVK Teknoloji", "Penta", "Asus Türkiye", "MSI ServisPoint"];

  // --- Computed Data ---
  const filteredProducts = useMemo(() => getFilteredProducts(filters), [products, filters]);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const pendingDealers = users.filter(u => u.role === UserRole.DEALER && !u.is_approved);
  const criticalStockProducts = products.filter(p => p.stock <= p.critical_limit);
  const activeRepairs = repairRecords.filter(r => r.status !== RepairStatus.DELIVERED && r.status !== RepairStatus.CANCELLED);

  // --- Stats ---
  const stats = useMemo(() => ({
    totalProducts: products.length,
    criticalStock: criticalStockProducts.length,
    activeRepairs: activeRepairs.length,
    pendingDealers: pendingDealers.length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
  }), [products, criticalStockProducts, activeRepairs, pendingDealers, orders]);

  // --- Auth Check ---
  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <SEO title="Erişim Engellendi" />
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-slate-800">Erişim Engellendi</h2>
          <p className="text-slate-500 mt-2">Bu sayfayı görüntülemek için Admin olmalısınız.</p>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const modelList = newProduct.models.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);

    const productToAdd: Product = {
      id: '',
      name: newProduct.name,
      sku: newProduct.sku,
      shelf_location: newProduct.shelf_location,
      categoryId: newProduct.categoryId,
      subCategoryId: newProduct.subCategoryId,
      description: 'Yeni eklenen ürün',
      image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      price_usd: parseFloat(newProduct.price_usd),
      stock: parseInt(newProduct.stock),
      dealer_discount_percent: parseInt(newProduct.dealer_discount) || 10,
      vat_rate: 0.20,
      critical_limit: parseInt(newProduct.critical_limit) || 3,
      compatible_models: modelList
    };

    addProduct(productToAdd);
    setNewProduct({ name: '', sku: '', shelf_location: '', price_usd: '', stock: '', categoryId: '', subCategoryId: '', models: '', critical_limit: '3', dealer_discount: '10' });
    showToast(`"${productToAdd.name}" başarıyla eklendi!`, 'success');
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProduct(editingProduct.id, editingProduct);
    setEditingProduct(null);
    showToast('Ürün güncellendi!', 'success');
  };

  const handleDeleteProduct = () => {
    deleteProduct(deleteConfirm.productId);
    setDeleteConfirm({ isOpen: false, productId: '', productName: '' });
    showToast('Ürün silindi!', 'success');
  };

  const openWarrantyModal = (record: RepairRecord) => {
    setSelectedRepair(record);
    if (record.status === RepairStatus.IN_WARRANTY) {
        setRmaConcludeModalOpen(true);
    } else {
        setRmaFormData({ supplier: '', rmaCode: '' });
        setRmaModalOpen(true);
    }
  };

  const handleSubmitRma = () => {
    if (selectedRepair && rmaFormData.supplier && rmaFormData.rmaCode) {
        sendToWarranty(selectedRepair.tracking_code, rmaFormData.supplier, rmaFormData.rmaCode);
        setRmaModalOpen(false);
        setSelectedRepair(null);
      showToast('Cihaz garantiye gönderildi!', 'success');
    }
  };

  const handleSubmitConclusion = () => {
    if (selectedRepair) {
        concludeWarranty(selectedRepair.tracking_code, concludeData.result, concludeData.notes, concludeData.swapSerial);
        setRmaConcludeModalOpen(false);
        setSelectedRepair(null);
        setConcludeData({ result: 'repaired', notes: '', swapSerial: '' });
      showToast('Garanti süreci kapatıldı!', 'success');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-700';
      case OrderStatus.PREPARING:
      case OrderStatus.PROCESSING: return 'bg-amber-100 text-amber-700';
      case OrderStatus.SHIPPED: return 'bg-indigo-100 text-indigo-700';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-700';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Reset page when filters change
  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <SEO title="Yönetim Paneli" />
      <ToastContainer />
      
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Yönetim Paneli</h1>
        <p className="text-slate-500 mt-1">NotebookPro operasyon merkezi</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'categories', label: 'Kategoriler', icon: '📂' },
          { id: 'products', label: 'Ürünler', icon: '📦' },
          { id: 'dealers', label: 'Bayiler', icon: '🏢', badge: pendingDealers.length },
          { id: 'repairs', label: 'Servis', icon: '🔧', badge: activeRepairs.length },
          { id: 'orders', label: 'Siparişler', icon: '🛒' },
          { id: 'notifications', label: 'Bildirimler', icon: '🔔', badge: unreadCount },
          { id: 'reports', label: 'Raporlar', icon: '📈' },
          { id: 'customers', label: 'Müşteriler', icon: '👥' },
          { id: 'users', label: 'Kullanıcılar', icon: '👨‍💻' },
          { id: 'promotions', label: 'Kampanyalar', icon: '🏷️' },
          { id: 'settings', label: 'Ayarlar', icon: '⚙️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge ? (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
          </div>

      {/* ========== CATEGORIES TAB ========== */}
      {activeTab === 'categories' && (
        <CategoriesTab showToast={showToast} />
      )}

      {/* ========== DASHBOARD TAB ========== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Today's Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Günaydın! 👋</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-xs text-slate-400">Toplam Ciro</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                  <div className="text-2xl font-bold">{orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length}</div>
                  <div className="text-xs text-slate-300">Bugünkü Sipariş</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                  <div className="text-2xl font-bold">{repairRecords.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length}</div>
                  <div className="text-xs text-slate-300">Bugünkü Servis</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                  <div className="text-2xl font-bold text-amber-400">{stats.pendingOrders}</div>
                  <div className="text-xs text-slate-300">Bekleyen Sipariş</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                  <div className="text-2xl font-bold text-red-400">{stats.criticalStock}</div>
                  <div className="text-xs text-slate-300">Kritik Stok</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">⚡</span>
              Hızlı İşlemler
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('products')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition group"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition">📦</div>
                <span className="text-sm font-medium text-slate-700">Yeni Ürün</span>
              </button>
              <button
                onClick={() => setActiveTab('repairs')}
                className="flex flex-col items-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition group"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition">🔧</div>
                <span className="text-sm font-medium text-slate-700">Yeni Servis</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition group"
              >
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition">🛒</div>
                <span className="text-sm font-medium text-slate-700">Siparişler</span>
              </button>
              <button
                onClick={() => setActiveTab('dealers')}
                className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition">🏢</div>
                <span className="text-sm font-medium text-slate-700">Bayi Onay</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Toplam Ürün" value={stats.totalProducts} icon="📦" color="blue" />
            <StatCard title="Kritik Stok" value={stats.criticalStock} icon="⚠️" color="red" />
            <StatCard title="Aktif Servis" value={stats.activeRepairs} icon="🔧" color="amber" />
            <StatCard title="Bekleyen Bayi" value={stats.pendingDealers} icon="🏢" color="purple" />
          </div>

          {/* Two Column Layout: Recent Orders & Recent Repairs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-green-500">🛒</span> Son Siparişler
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Tümünü Gör →
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="px-6 py-3 hover:bg-slate-50/50 transition flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{order.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-800 truncate">{order.customerName}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</div>
                      <div className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm">
                    Henüz sipariş yok
                  </div>
                )}
              </div>
            </div>

            {/* Recent Repairs Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-amber-500">🔧</span> Son Servis Kayıtları
                </h3>
                <button
                  onClick={() => setActiveTab('repairs')}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Tümünü Gör →
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {repairRecords.slice(0, 5).map(repair => (
                  <div key={repair.id} className="px-6 py-3 hover:bg-slate-50/50 transition flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-red-600 font-bold">{repair.tracking_code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          repair.status === RepairStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                          repair.status === RepairStatus.IN_PROGRESS ? 'bg-cyan-100 text-cyan-700' :
                          repair.status === RepairStatus.IN_WARRANTY ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {repair.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 truncate">
                        {repair.customer_name} • {repair.device_brand} {repair.device_model}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xs text-slate-400">{new Date(repair.created_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                  </div>
                ))}
                {repairRecords.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm">
                    Henüz servis kaydı yok
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mini Sales Chart - Last 7 Days */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-blue-500">📈</span> Son 7 Gün Satış Performansı
            </h3>
            <MiniSalesChart orders={orders} />
          </div>

          {/* Critical Stock Alerts */}
          {criticalStockProducts.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <h3 className="font-bold text-red-900 text-lg mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm">!</span>
                Kritik Stok Uyarıları
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {criticalStockProducts.slice(0, 6).map(p => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-red-100 flex justify-between items-center">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-2xl font-bold text-red-600">{p.stock}</p>
                      <p className="text-[10px] text-red-400">Limit: {p.critical_limit}</p>
                    </div>
                  </div>
                ))}
              </div>
              {criticalStockProducts.length > 6 && (
                <button
                  onClick={() => { setActiveTab('products'); handleFilterChange({ stockStatus: 'critical' }); }}
                  className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  +{criticalStockProducts.length - 6} ürün daha →
                </button>
              )}
            </div>
          )}

          {/* Pending Dealers Alert */}
          {pendingDealers.length > 0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
              <h3 className="font-bold text-purple-900 text-lg mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">🏢</span>
                Onay Bekleyen Bayiler ({pendingDealers.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {pendingDealers.slice(0, 3).map(dealer => (
                  <div key={dealer.id} className="bg-white px-4 py-2 rounded-xl border border-purple-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                      {dealer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{dealer.name}</div>
                      <div className="text-xs text-slate-500">{dealer.company_details?.taxTitle || dealer.email}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('dealers')}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
              >
                Tümünü Görüntüle ve Onayla
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== PRODUCTS TAB ========== */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Import/Export Bar */}
          <ImportExportBar 
            products={products}
            orders={orders}
            repairRecords={repairRecords}
            onImportProducts={(importedProducts) => {
              importedProducts.forEach(p => addProduct(p));
              showToast(`${importedProducts.length} ürün başarıyla eklendi!`, 'success');
            }}
            showToast={showToast}
          />
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Add Product Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h3 className="font-bold text-lg text-slate-800 mb-4">➕ Yeni Ürün Ekle</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
               <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ürün Adı *</label>
                <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                    value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
               </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SKU *</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
                        value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Raf Yeri</label>
                  <input placeholder="A-01" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
                        value={newProduct.shelf_location} onChange={e => setNewProduct({...newProduct, shelf_location: e.target.value})} />
                  </div>
               </div>

              <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                     <label className="block text-xs font-bold text-slate-500 mb-1">Kategori *</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
                        value={newProduct.categoryId} onChange={e => setNewProduct({...newProduct, categoryId: e.target.value, subCategoryId: ''})}>
                    <option value="">Kategori Seçin</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  
                  {newProduct.categoryId && categories.find(c => c.id === newProduct.categoryId)?.subCategories?.length ? (
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none mt-2"
                          value={newProduct.subCategoryId} onChange={e => setNewProduct({...newProduct, subCategoryId: e.target.value})}>
                      <option value="">Alt Kategori Seçin...</option>
                      {categories.find(c => c.id === newProduct.categoryId)?.subCategories?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : null}
                  </div>
                  <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Fiyat (USD) *</label>
                  <input required type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
                        value={newProduct.price_usd} onChange={e => setNewProduct({...newProduct, price_usd: e.target.value})} />
                  </div>
               </div>

              <div className="grid grid-cols-3 gap-3">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Stok *</label>
                  <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
                        value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kritik</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
                    value={newProduct.critical_limit} onChange={e => setNewProduct({...newProduct, critical_limit: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Bayi %</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
                    value={newProduct.dealer_discount} onChange={e => setNewProduct({...newProduct, dealer_discount: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Uyumlu Modeller <span className="text-red-500 font-normal">(Excel yapıştır)</span>
                 </label>
                 <textarea 
                  placeholder="Her satır bir model..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none font-mono"
                  rows={4}
                    value={newProduct.models} 
                    onChange={e => setNewProduct({...newProduct, models: e.target.value})} 
                 />
               </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition shadow-lg">
                Ürünü Kaydet
               </button>
            </form>
          </div>

          {/* Product List */}
          <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-bold text-lg text-slate-800">📦 Ürün Listesi</h3>
              <div className="text-sm text-slate-500">
                {filteredProducts.length} ürün bulundu
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ara: isim, SKU, model..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
                  value={filters.search}
                  onChange={e => handleFilterChange({ search: e.target.value })}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                value={filters.category}
                onChange={e => handleFilterChange({ category: e.target.value })}
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                value={filters.stockStatus}
                onChange={e => handleFilterChange({ stockStatus: e.target.value as any })}
              >
                <option value="all">Tüm Stok Durumu</option>
                <option value="in_stock">Stokta</option>
                <option value="critical">Kritik Seviye</option>
                <option value="out_of_stock">Tükendi</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="px-4 py-3 text-left rounded-tl-lg">Ürün</th>
                    <th className="px-4 py-3 text-left">SKU / Raf</th>
                    <th className="px-4 py-3 text-right">Fiyat</th>
                    <th className="px-4 py-3 text-center">Stok</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 max-w-[200px] truncate">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.compatible_models.length} uyumlu model</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-slate-600">{p.sku}</div>
                        <div className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">{p.shelf_location || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">${p.price_usd}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setStockModal({ isOpen: true, product: p }); setStockMovementForm({ type: 'in', quantity: '', reason: '' }); }}
                          className={`inline-flex items-center justify-center w-10 h-8 rounded-lg font-bold text-sm cursor-pointer hover:ring-2 hover:ring-offset-1 transition ${
                            p.stock === 0 ? 'bg-red-100 text-red-700 hover:ring-red-300' :
                            p.stock <= p.critical_limit ? 'bg-amber-100 text-amber-700 hover:ring-amber-300' :
                            'bg-green-100 text-green-700 hover:ring-green-300'
                          }`}
                          title="Stok Yönetimi"
                        >
                          {p.stock}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingProduct({ ...p })}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Düzenle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, productId: p.id, productName: p.name })}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  Sayfa {currentPage} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition"
                  >
                    ← Önceki
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                          currentPage === page
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition"
                  >
                    Sonraki →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* ========== DEALERS TAB ========== */}
      {activeTab === 'dealers' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-4">🏢 Onay Bekleyen Bayiler</h3>
           {pendingDealers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-slate-500">Tüm başvurular işlendi!</p>
            </div>
           ) : (
             <div className="grid gap-4">
                {pendingDealers.map(d => (
                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl gap-4">
                     <div>
                        <h4 className="font-bold text-slate-800">{d.name}</h4>
                        <p className="text-xs text-slate-500">{d.email} | {d.phone}</p>
                        {d.company_details && (
                      <div className="mt-2 text-xs bg-white p-2 rounded inline-block text-slate-600 border border-slate-100">
                            {d.company_details.taxTitle} - VKN: {d.company_details.taxNumber}
                          </div>
                        )}
                     </div>
                     <button 
                    onClick={() => { approveDealer(d.id); showToast(`${d.name} onaylandı!`, 'success'); }}
                    className="bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-md"
                     >
                    ✓ Onayla
                     </button>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {/* ========== REPAIRS TAB ========== */}
      {activeTab === 'repairs' && (
        <RepairsTab
          repairRecords={repairRecords}
          getFilteredRepairs={getFilteredRepairs}
          createRepairFromAdmin={createRepairFromAdmin}
          updateRepairStatus={updateRepairStatus}
          assignTechnician={assignTechnician}
          generateServiceLabel={generateServiceLabel}
          openWarrantyModal={openWarrantyModal}
          showToast={showToast}
          technicians={technicians}
        />
      )}

      {/* ========== ORDERS TAB ========== */}
      {activeTab === 'orders' && (
        <OrdersTab 
          orders={orders}
          getFilteredOrders={getFilteredOrders}
          updateOrderStatus={updateOrderStatus}
          updateTrackingNumber={updateTrackingNumber}
          generateInvoiceHTML={generateInvoiceHTML}
          getStatusBadge={getStatusBadge}
          formatCurrency={formatCurrency}
          showToast={showToast}
          setSelectedOrder={setSelectedOrder}
        />
      )}

      {/* ========== NOTIFICATIONS TAB ========== */}
      {activeTab === 'notifications' && (
        <NotificationsTab
          notifications={notifications}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          deleteNotification={deleteNotification}
          clearAll={clearAll}
          showToast={showToast}
        />
      )}

      {/* ========== REPORTS TAB ========== */}
      {activeTab === 'reports' && (
        <ReportsTab
          orders={orders}
          products={products}
          repairRecords={repairRecords}
          formatCurrency={formatCurrency}
        />
      )}

      {/* ========== CUSTOMERS TAB ========== */}
      {activeTab === 'customers' && (
        <CustomersTab
          orders={orders}
          repairRecords={repairRecords}
          formatCurrency={formatCurrency}
        />
      )}

      {/* ========== USERS TAB ========== */}
      {activeTab === 'users' && (
        <UsersTab
          orders={orders}
          repairRecords={repairRecords}
          users={users}
          formatCurrency={formatCurrency}
          showToast={showToast}
        />
      )}

      {/* ========== PROMOTIONS TAB ========== */}
      {activeTab === 'promotions' && (
        <PromotionsTab showToast={showToast} />
      )}

      {/* ========== SETTINGS TAB ========== */}
      {activeTab === 'settings' && (
        <SettingsTab
          showToast={showToast}
          exchangeRate={exchangeRate}
          setExchangeRate={setExchangeRate}
        />
      )}

      {/* ========== MODALS ========== */}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Ürün Düzenle</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-red-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleEditProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ürün Adı</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SKU</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={editingProduct.sku}
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Raf Yeri</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={editingProduct.shelf_location}
                    onChange={e => setEditingProduct({ ...editingProduct, shelf_location: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Fiyat (USD)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={editingProduct.price_usd}
                    onChange={e => setEditingProduct({ ...editingProduct, price_usd: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Stok</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kritik Limit</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={editingProduct.critical_limit}
                    onChange={e => setEditingProduct({ ...editingProduct, critical_limit: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                  value={editingProduct.categoryId}
                  onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}>
                  <option value="">Seçiniz</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bayi İndirimi (%)</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                  value={editingProduct.dealer_discount_percent || 0}
                  onChange={e => setEditingProduct({ ...editingProduct, dealer_discount_percent: parseInt(e.target.value) })} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold">
                  İptal
                          </button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                  Kaydet
                          </button>
              </div>
            </form>
           </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Ürünü Sil"
        message={`"${deleteConfirm.productName}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        confirmStyle="danger"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteConfirm({ isOpen: false, productId: '', productName: '' })}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">Sipariş Detayı</h3>
                 <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-red-600">✕</button>
              </div>
              <div className="p-6">
                 <div className="mb-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Sipariş No</p>
                    <p className="font-mono text-slate-900">{selectedOrder.id}</p>
                 </div>
                 <div className="mb-6">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Ürünler</p>
                    <div className="space-y-2">
                       {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                            <div>
                               <span className="font-medium text-slate-800">{item.product.name}</span>
                               <div className="text-xs text-slate-400">{item.product.sku}</div>
                            </div>
                            <div className="font-bold text-slate-600">x{item.quantity}</div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl">
                    <span>Toplam Tutar</span>
                    <span className="font-bold text-xl">{formatCurrency(selectedOrder.totalAmount)}</span>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {/* Warranty Send Modal */}
      {rmaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Garantiye Gönder</h3>
                <div className="space-y-4">
                    <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tedarikçi</label>
                        <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                            value={rmaFormData.supplier}
                  onChange={e => setRmaFormData({ ...rmaFormData, supplier: e.target.value })}
                        >
                  <option value="">Seçiniz</option>
                            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">RMA Kodu</label>
                        <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                            value={rmaFormData.rmaCode}
                  onChange={e => setRmaFormData({ ...rmaFormData, rmaCode: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                <button onClick={() => setRmaModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">İptal</button>
                <button onClick={handleSubmitRma} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm">Gönder</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Warranty Conclude Modal */}
      {rmaConcludeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Garanti Sonuçlandır</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Sonuç</label>
                        <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                            value={concludeData.result}
                  onChange={e => setConcludeData({ ...concludeData, result: e.target.value as WarrantyResult })}
                >
                  <option value="repaired">Onarıldı</option>
                  <option value="swapped">Değişim</option>
                  <option value="refunded">İade</option>
                  <option value="rejected">Ret</option>
                        </select>
                    </div>
                    {concludeData.result === 'swapped' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Yeni Seri No</label>
                            <input 
                    className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm"
                                value={concludeData.swapSerial}
                    onChange={e => setConcludeData({ ...concludeData, swapSerial: e.target.value })}
                            />
                        </div>
                    )}
                    <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Notlar</label>
                        <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                            rows={3}
                            value={concludeData.notes}
                  onChange={e => setConcludeData({ ...concludeData, notes: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                <button onClick={() => setRmaConcludeModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">İptal</button>
                <button onClick={handleSubmitConclusion} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-sm">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {stockModal.isOpen && stockModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">📦 Stok Yönetimi</h3>
                <div className="text-sm text-slate-500">{stockModal.product.name}</div>
              </div>
              <button onClick={() => setStockModal({ isOpen: false, product: null })} className="text-slate-400 hover:text-red-600 text-xl">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Current Stock Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-blue-700">{stockModal.product.stock}</div>
                  <div className="text-xs text-blue-600">Mevcut Stok</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-amber-700">{stockModal.product.critical_limit}</div>
                  <div className="text-xs text-amber-600">Kritik Limit</div>
                </div>
                <div className={`p-4 rounded-xl text-center ${
                  stockModal.product.stock === 0 ? 'bg-red-50' :
                  stockModal.product.stock <= stockModal.product.critical_limit ? 'bg-amber-50' : 'bg-green-50'
                }`}>
                  <div className={`text-xl font-bold ${
                    stockModal.product.stock === 0 ? 'text-red-700' :
                    stockModal.product.stock <= stockModal.product.critical_limit ? 'text-amber-700' : 'text-green-700'
                  }`}>
                    {stockModal.product.stock === 0 ? 'Tükendi' :
                     stockModal.product.stock <= stockModal.product.critical_limit ? 'Kritik' : 'Normal'}
                  </div>
                  <div className="text-xs text-slate-600">Durum</div>
                </div>
              </div>

              {/* Add Stock Movement Form */}
              <div className="bg-slate-50 p-4 rounded-xl mb-6">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span>➕</span> Stok Hareketi Ekle
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">İşlem Tipi</label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                      value={stockMovementForm.type}
                      onChange={e => setStockMovementForm(prev => ({ ...prev, type: e.target.value as StockMovementType }))}
                    >
                      <option value="in">📥 Giriş</option>
                      <option value="out">📤 Çıkış</option>
                      <option value="sale">🛒 Satış</option>
                      <option value="return">↩️ İade</option>
                      <option value="adjustment">⚖️ Düzeltme</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Miktar</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                      placeholder="Adet"
                      value={stockMovementForm.quantity}
                      onChange={e => setStockMovementForm(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Açıklama</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                      placeholder="Nedeni..."
                      value={stockMovementForm.reason}
                      onChange={e => setStockMovementForm(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const qty = parseInt(stockMovementForm.quantity);
                    if (qty > 0 && stockMovementForm.reason && stockModal.product) {
                      addStockMovement(
                        stockModal.product.id,
                        stockMovementForm.type,
                        qty,
                        stockMovementForm.reason
                      );
                      setStockMovementForm({ type: 'in', quantity: '', reason: '' });
                      // Refresh product in modal
                      const updatedProduct = products.find(p => p.id === stockModal.product?.id);
                      if (updatedProduct) {
                        setStockModal({ isOpen: true, product: updatedProduct });
                      }
                      showToast('Stok hareketi kaydedildi!', 'success');
                    } else {
                      showToast('Miktar ve açıklama gerekli!', 'warning');
                    }
                  }}
                  className="mt-3 w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
                >
                  Hareketi Kaydet
                </button>
              </div>

              {/* Stock History */}
              <div>
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span>📋</span> Stok Geçmişi
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getProductStockHistory(stockModal.product.id).length === 0 ? (
                    <div className="text-center py-8 text-slate-400">Henüz hareket kaydı yok</div>
                  ) : (
                    getProductStockHistory(stockModal.product.id).map(movement => (
                      <div key={movement.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                          movement.type === 'in' || movement.type === 'return' ? 'bg-green-100' :
                          movement.type === 'out' || movement.type === 'sale' ? 'bg-red-100' :
                          'bg-amber-100'
                        }`}>
                          {movement.type === 'in' ? '📥' :
                           movement.type === 'out' ? '📤' :
                           movement.type === 'sale' ? '🛒' :
                           movement.type === 'return' ? '↩️' : '⚖️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                            <span className="text-slate-600 text-sm">{movement.reason}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {movement.previousStock} → {movement.newStock} • {new Date(movement.createdAt).toLocaleString('tr-TR')}
                          </div>
                        </div>
                        {movement.reference && (
                          <span className="text-xs bg-slate-200 px-2 py-1 rounded font-mono">{movement.reference}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Repairs Tab Component  
const RepairsTab: React.FC<{
  repairRecords: RepairRecord[];
  getFilteredRepairs: (filters: RepairFilters) => RepairRecord[];
  createRepairFromAdmin: (data: any) => RepairRecord;
  updateRepairStatus: (trackingCode: string, status: RepairStatus, note?: string) => void;
  assignTechnician: (trackingCode: string, name: string) => void;
  generateServiceLabel: (record: RepairRecord) => void;
  openWarrantyModal: (record: RepairRecord) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  technicians: User[];
}> = ({ repairRecords, getFilteredRepairs, createRepairFromAdmin, updateRepairStatus, assignTechnician, generateServiceLabel, openWarrantyModal, showToast, technicians }) => {
  const [repairFilters, setRepairFilters] = useState<RepairFilters>({ search: '', status: 'all' });
  const [showNewRepairForm, setShowNewRepairForm] = useState(false);
  const [selectedRepairDetail, setSelectedRepairDetail] = useState<RepairRecord | null>(null);
  const [newRepairData, setNewRepairData] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    device_brand: '', device_model: '', serial_number: '',
    issue_description: '', estimated_cost_tl: ''
  });

  const filteredRepairs = getFilteredRepairs(repairFilters);
  const deviceBrands = ['Apple', 'Asus', 'Lenovo', 'Dell', 'HP', 'MSI', 'Acer', 'Samsung', 'Huawei', 'Monster', 'Casper', 'Diğer'];

  const handleCreateRepair = (e: React.FormEvent) => {
    e.preventDefault();
    const record = createRepairFromAdmin({
      ...newRepairData,
      estimated_cost_tl: newRepairData.estimated_cost_tl ? parseFloat(newRepairData.estimated_cost_tl) : undefined
    });
    showToast(`Servis kaydı oluşturuldu: ${record.tracking_code}`, 'success');
    setShowNewRepairForm(false);
    setNewRepairData({ customer_name: '', customer_phone: '', customer_email: '', device_brand: '', device_model: '', serial_number: '', issue_description: '', estimated_cost_tl: '' });
  };

  const getStatusColor = (status: RepairStatus) => {
    const colors: Record<string, string> = {
      [RepairStatus.RECEIVED]: 'bg-slate-100 text-slate-700',
      [RepairStatus.DIAGNOSING]: 'bg-blue-100 text-blue-700',
      [RepairStatus.WAITING_PARTS]: 'bg-amber-100 text-amber-700',
      [RepairStatus.WAITING_APPROVAL]: 'bg-purple-100 text-purple-700',
      [RepairStatus.IN_PROGRESS]: 'bg-cyan-100 text-cyan-700',
      [RepairStatus.AT_PARTNER]: 'bg-indigo-100 text-indigo-700',
      [RepairStatus.IN_WARRANTY]: 'bg-orange-100 text-orange-700',
      [RepairStatus.COMPLETED]: 'bg-green-100 text-green-700',
      [RepairStatus.DELIVERED]: 'bg-emerald-100 text-emerald-700',
      [RepairStatus.CANCELLED]: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-lg text-slate-800">🔧 Servis Takip Merkezi</h3>
          <button
            onClick={() => setShowNewRepairForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition flex items-center gap-2"
          >
            <span>+</span> Yeni Servis Kaydı
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="Ara: Takip no, müşteri, telefon, cihaz..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-red-500 outline-none"
              value={repairFilters.search}
              onChange={e => setRepairFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            value={repairFilters.status}
            onChange={e => setRepairFilters(prev => ({ ...prev, status: e.target.value as RepairStatus | 'all' }))}
          >
            <option value="all">Tüm Durumlar</option>
            {Object.values(RepairStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Takip No</th>
                <th className="px-4 py-3 text-left">Müşteri / Cihaz</th>
                <th className="px-4 py-3 text-left">Arıza</th>
                <th className="px-4 py-3 text-left">Teknisyen</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">Servis kaydı bulunamadı</td></tr>
              ) : filteredRepairs.map(r => (
                <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${r.status === RepairStatus.IN_WARRANTY ? 'bg-orange-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-red-600 font-bold">{r.tracking_code}</div>
                    <div className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString('tr-TR')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.customer_name}</div>
                    <div className="text-xs text-slate-500">{r.device_brand} {r.device_model}</div>
                    <div className="text-[10px] text-slate-400">{r.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px]">
                    <div className="truncate" title={r.issue_description}>{r.issue_description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="bg-white border border-slate-200 text-xs rounded p-1.5 outline-none w-full max-w-[120px]"
                      value={r.assigned_technician_id || ''}
                      onChange={e => assignTechnician(r.tracking_code, e.target.value)}
                    >
                      <option value="">Atanmadı</option>
                      {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className={`text-xs font-medium rounded-full px-3 py-1 outline-none cursor-pointer ${getStatusColor(r.status)}`}
                      value={r.status}
                      onChange={e => updateRepairStatus(r.tracking_code, e.target.value as RepairStatus)}
                    >
                      {Object.values(RepairStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedRepairDetail(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Detay & Timeline">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button onClick={() => generateServiceLabel(r)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg" title="Etiket">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openWarrantyModal(r)}
                        className={`p-2 rounded-lg ${r.status === RepairStatus.IN_WARRANTY ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                        title={r.status === RepairStatus.IN_WARRANTY ? 'Sonuçlandır' : 'RMA/Garanti'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Repair Form Modal */}
      {showNewRepairForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">➕ Yeni Servis Kaydı</h3>
              <button onClick={() => setShowNewRepairForm(false)} className="text-slate-400 hover:text-red-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateRepair} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Müşteri Adı *</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={newRepairData.customer_name} onChange={e => setNewRepairData(prev => ({ ...prev, customer_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Telefon *</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    placeholder="05XX XXX XX XX"
                    value={newRepairData.customer_phone} onChange={e => setNewRepairData(prev => ({ ...prev, customer_phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">E-posta</label>
                  <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={newRepairData.customer_email} onChange={e => setNewRepairData(prev => ({ ...prev, customer_email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Marka *</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={newRepairData.device_brand} onChange={e => setNewRepairData(prev => ({ ...prev, device_brand: e.target.value }))}>
                    <option value="">Seçiniz</option>
                    {deviceBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Model *</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    placeholder="Örn: MacBook Pro A1708"
                    value={newRepairData.device_model} onChange={e => setNewRepairData(prev => ({ ...prev, device_model: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Seri No</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono"
                    value={newRepairData.serial_number} onChange={e => setNewRepairData(prev => ({ ...prev, serial_number: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tahmini Ücret (₺)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={newRepairData.estimated_cost_tl} onChange={e => setNewRepairData(prev => ({ ...prev, estimated_cost_tl: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Arıza Açıklaması *</label>
                <textarea required rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                  placeholder="Müşterinin şikayetini detaylı yazınız..."
                  value={newRepairData.issue_description} onChange={e => setNewRepairData(prev => ({ ...prev, issue_description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewRepairForm(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold">İptal</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repair Detail & Timeline Modal */}
      {selectedRepairDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Servis Detayı</h3>
                <div className="font-mono text-red-600 text-sm">{selectedRepairDetail.tracking_code}</div>
              </div>
              <button onClick={() => setSelectedRepairDetail(null)} className="text-slate-400 hover:text-red-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer & Device Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Müşteri</div>
                  <div className="font-medium text-slate-800">{selectedRepairDetail.customer_name}</div>
                  <div className="text-xs text-slate-500">{selectedRepairDetail.customer_phone}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Cihaz</div>
                  <div className="font-medium text-slate-800">{selectedRepairDetail.device_brand} {selectedRepairDetail.device_model}</div>
                  {selectedRepairDetail.serial_number && <div className="text-xs text-slate-500 font-mono">{selectedRepairDetail.serial_number}</div>}
                </div>
              </div>

              {/* Issue */}
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <div className="text-xs text-amber-600 font-bold mb-1">Arıza Açıklaması</div>
                <div className="text-sm text-amber-900">{selectedRepairDetail.issue_description}</div>
              </div>

              {/* Timeline */}
              <div>
                <div className="text-xs text-slate-500 font-bold mb-3">📅 Durum Geçmişi</div>
                <div className="space-y-3">
                  {(selectedRepairDetail.statusHistory || []).map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        {idx < (selectedRepairDetail.statusHistory?.length || 0) - 1 && <div className="w-0.5 h-full bg-slate-200"></div>}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(entry.status)}`}>{entry.status}</span>
                          <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString('tr-TR')}</span>
                        </div>
                        {entry.note && <div className="text-xs text-slate-600 mt-1">{entry.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Promotions Tab Component
interface Promotion {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  categories?: string[];
}

const PromotionsTab: React.FC<{
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}> = ({ showToast }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: 'promo-1',
      code: 'YAZ2024',
      name: 'Yaz Kampanyası',
      type: 'percentage',
      value: 15,
      minOrderAmount: 1000,
      maxDiscount: 500,
      usageLimit: 100,
      usedCount: 34,
      validFrom: new Date('2024-06-01'),
      validTo: new Date('2024-08-31'),
      isActive: true,
    },
    {
      id: 'promo-2',
      code: 'ILKSIPARIS',
      name: 'İlk Sipariş İndirimi',
      type: 'fixed',
      value: 200,
      minOrderAmount: 500,
      usageLimit: 500,
      usedCount: 127,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31'),
      isActive: true,
    },
    {
      id: 'promo-3',
      code: 'UCRETSIZ',
      name: 'Ücretsiz Kargo',
      type: 'shipping',
      value: 100,
      minOrderAmount: 2000,
      usedCount: 89,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31'),
      isActive: true,
    },
    {
      id: 'promo-4',
      code: 'BLACKFRIDAY',
      name: 'Black Friday',
      type: 'percentage',
      value: 25,
      maxDiscount: 1000,
      usageLimit: 200,
      usedCount: 200,
      validFrom: new Date('2024-11-25'),
      validTo: new Date('2024-11-30'),
      isActive: false,
    },
  ]);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    name: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'shipping',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validTo: '',
  });

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const promo: Promotion = {
      id: `promo-${Date.now()}`,
      code: newPromo.code.toUpperCase(),
      name: newPromo.name,
      type: newPromo.type,
      value: parseFloat(newPromo.value) || 0,
      minOrderAmount: newPromo.minOrderAmount ? parseFloat(newPromo.minOrderAmount) : undefined,
      maxDiscount: newPromo.maxDiscount ? parseFloat(newPromo.maxDiscount) : undefined,
      usageLimit: newPromo.usageLimit ? parseInt(newPromo.usageLimit) : undefined,
      usedCount: 0,
      validFrom: new Date(newPromo.validFrom),
      validTo: new Date(newPromo.validTo),
      isActive: true,
    };
    setPromotions(prev => [promo, ...prev]);
    setShowNewForm(false);
    setNewPromo({ code: '', name: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', validFrom: '', validTo: '' });
    showToast(`"${promo.code}" kampanyası oluşturuldu!`, 'success');
  };

  const togglePromoStatus = (id: string) => {
    setPromotions(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
    showToast('Kampanya durumu güncellendi', 'success');
  };

  const deletePromo = (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    showToast('Kampanya silindi', 'success');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`"${code}" kopyalandı!`, 'info');
  };

  const getTypeLabel = (type: Promotion['type']) => {
    switch (type) {
      case 'percentage': return '% İndirim';
      case 'fixed': return 'Sabit İndirim';
      case 'shipping': return 'Kargo';
      default: return type;
    }
  };

  const getTypeColor = (type: Promotion['type']) => {
    switch (type) {
      case 'percentage': return 'bg-purple-100 text-purple-700';
      case 'fixed': return 'bg-blue-100 text-blue-700';
      case 'shipping': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Stats
  const activePromos = promotions.filter(p => p.isActive);
  const totalUsage = promotions.reduce((sum, p) => sum + p.usedCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🏷️</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{promotions.length}</div>
              <div className="text-xs text-slate-500">Toplam Kampanya</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">✅</div>
            <div>
              <div className="text-2xl font-bold text-green-600">{activePromos.length}</div>
              <div className="text-xs text-slate-500">Aktif Kampanya</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalUsage}</div>
              <div className="text-xs text-slate-500">Toplam Kullanım</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">⏰</div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {promotions.filter(p => new Date(p.validTo) < new Date()).length}
              </div>
              <div className="text-xs text-slate-500">Süresi Dolan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <span>🏷️</span> Kampanya Yönetimi
        </h2>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition flex items-center gap-2"
        >
          <span>+</span> Yeni Kampanya
        </button>
      </div>

      {/* Promotions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-6 py-3 text-left">Kampanya</th>
                <th className="px-6 py-3 text-left">Kod</th>
                <th className="px-6 py-3 text-center">Tip</th>
                <th className="px-6 py-3 text-center">Değer</th>
                <th className="px-6 py-3 text-center">Kullanım</th>
                <th className="px-6 py-3 text-center">Geçerlilik</th>
                <th className="px-6 py-3 text-center">Durum</th>
                <th className="px-6 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(promo => {
                const isExpired = new Date(promo.validTo) < new Date();
                const isMaxedOut = promo.usageLimit && promo.usedCount >= promo.usageLimit;
                return (
                  <tr key={promo.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition ${isExpired || isMaxedOut ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{promo.name}</div>
                      {promo.minOrderAmount && (
                        <div className="text-xs text-slate-400">Min. {promo.minOrderAmount}₺</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => copyCode(promo.code)}
                        className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200 transition flex items-center gap-1"
                      >
                        {promo.code}
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(promo.type)}`}>
                        {getTypeLabel(promo.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">
                      {promo.type === 'percentage' ? `%${promo.value}` : `${promo.value}₺`}
                      {promo.maxDiscount && <div className="text-xs text-slate-400 font-normal">max {promo.maxDiscount}₺</div>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-slate-800">{promo.usedCount}</div>
                      {promo.usageLimit && (
                        <div className="text-xs text-slate-400">/ {promo.usageLimit}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-xs text-slate-600">
                        {new Date(promo.validFrom).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-xs text-slate-400">
                        → {new Date(promo.validTo).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isExpired ? (
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">Süresi Doldu</span>
                      ) : isMaxedOut ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Limit Doldu</span>
                      ) : promo.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aktif</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Pasif</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => togglePromoStatus(promo.id)}
                          className={`p-2 rounded-lg transition ${
                            promo.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'
                          }`}
                          title={promo.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                        >
                          {promo.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => deletePromo(promo.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Promotion Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">🏷️ Yeni Kampanya Oluştur</h3>
              <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-red-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreatePromo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kampanya Kodu *</label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:border-red-500 outline-none"
                    placeholder="ÖRNEK2024"
                    value={newPromo.code}
                    onChange={e => setNewPromo(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kampanya Adı *</label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                    placeholder="Yaz Kampanyası"
                    value={newPromo.name}
                    onChange={e => setNewPromo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">İndirim Tipi *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                    value={newPromo.type}
                    onChange={e => setNewPromo(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="percentage">% Yüzdelik İndirim</option>
                    <option value="fixed">₺ Sabit İndirim</option>
                    <option value="shipping">Ücretsiz Kargo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {newPromo.type === 'percentage' ? 'İndirim Yüzdesi (%) *' : 'İndirim Tutarı (₺) *'}
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                    placeholder={newPromo.type === 'percentage' ? '15' : '200'}
                    value={newPromo.value}
                    onChange={e => setNewPromo(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Min. Sipariş Tutarı (₺)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                    placeholder="500"
                    value={newPromo.minOrderAmount}
                    onChange={e => setNewPromo(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Max. İndirim (₺)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                    placeholder="500"
                    value={newPromo.maxDiscount}
                    onChange={e => setNewPromo(prev => ({ ...prev, maxDiscount: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kullanım Limiti</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                  placeholder="100 (boş = sınırsız)"
                  value={newPromo.usageLimit}
                  onChange={e => setNewPromo(prev => ({ ...prev, usageLimit: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Başlangıç Tarihi *</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                    value={newPromo.validFrom}
                    onChange={e => setNewPromo(prev => ({ ...prev, validFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Bitiş Tarihi *</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                    value={newPromo.validTo}
                    onChange={e => setNewPromo(prev => ({ ...prev, validTo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700"
                >
                  Kampanya Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Import/Export Bar Component
const ImportExportBar: React.FC<{
  products: Product[];
  orders: Order[];
  repairRecords: RepairRecord[];
  onImportProducts: (products: Product[]) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}> = ({ products, orders, repairRecords, onImportProducts, showToast }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [exportType, setExportType] = useState<'products' | 'orders' | 'repairs'>('products');

  // Export to CSV
  const exportToCSV = (type: 'products' | 'orders' | 'repairs') => {
    let csvContent = '';
    let filename = '';

    if (type === 'products') {
      const headers = ['SKU', 'Ürün Adı', 'Kategori', 'Fiyat (USD)', 'Stok', 'Kritik Limit', 'Raf Yeri', 'Uyumlu Modeller'];
      csvContent = headers.join(';') + '\n';
      products.forEach(p => {
        csvContent += [
          p.sku,
          p.name,
          p.category?.name || p.categoryId,
          p.price_usd,
          p.stock,
          p.critical_limit,
          p.shelf_location || '',
          p.compatible_models.join(', ')
        ].join(';') + '\n';
      });
      filename = `urunler_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'orders') {
      const headers = ['Sipariş No', 'Müşteri', 'Telefon', 'Toplam Tutar', 'Durum', 'Tarih', 'Kargo No'];
      csvContent = headers.join(';') + '\n';
      orders.forEach(o => {
        csvContent += [
          o.id,
          o.customerName,
          o.customerPhone || '',
          o.totalAmount,
          o.status,
          new Date(o.createdAt).toLocaleDateString('tr-TR'),
          o.trackingNumber || ''
        ].join(';') + '\n';
      });
      filename = `siparisler_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Takip No', 'Müşteri', 'Telefon', 'Cihaz', 'Arıza', 'Durum', 'Tarih'];
      csvContent = headers.join(';') + '\n';
      repairRecords.forEach(r => {
        csvContent += [
          r.tracking_code,
          r.customer_name,
          r.customer_phone,
          `${r.device_brand || ''} ${r.device_model}`,
          r.issue_description.replace(/;/g, ','),
          r.status,
          new Date(r.created_at).toLocaleDateString('tr-TR')
        ].join(';') + '\n';
      });
      filename = `servisler_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    showToast(`${filename} indirildi!`, 'success');
  };

  // Handle file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(';');
        
        // Simple validation
        if (!headers.includes('SKU') && !headers.includes('Ürün Adı')) {
          showToast('Geçersiz dosya formatı! SKU ve Ürün Adı sütunları gerekli.', 'error');
          return;
        }

        const newProducts: Product[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(';');
          if (values.length < 4) continue;

          const product: Product = {
            id: `import-${Date.now()}-${i}`,
            sku: values[0] || `SKU-${Date.now()}-${i}`,
            name: values[1] || 'İsimsiz Ürün',
            categoryId: values[2] || '',
            subCategoryId: '',
            price_usd: parseFloat(values[3]) || 0,
            stock: parseInt(values[4]) || 0,
            critical_limit: parseInt(values[5]) || 3,
            shelf_location: values[6] || '',
            compatible_models: values[7] ? values[7].split(',').map(m => m.trim()) : [],
            vat_rate: 0.20,
            description: 'Import edildi'
          };
          newProducts.push(product);
        }

        if (newProducts.length > 0) {
          onImportProducts(newProducts);
        } else {
          showToast('İçe aktarılacak ürün bulunamadı', 'warning');
        }
      } catch (err) {
        showToast('Dosya işlenirken hata oluştu', 'error');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download template
  const downloadTemplate = () => {
    const headers = ['SKU', 'Ürün Adı', 'Kategori', 'Fiyat (USD)', 'Stok', 'Kritik Limit', 'Raf Yeri', 'Uyumlu Modeller'];
    const example = ['SCR-001', 'MacBook Pro 13" Ekran', 'screen', '150', '10', '3', 'A-01', 'A1706, A1708, A1989'];
    const csvContent = headers.join(';') + '\n' + example.join(';') + '\n';
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'urun_sablonu.csv';
    link.click();
    showToast('Şablon indirildi!', 'info');
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-xl">📥</div>
          <div>
            <h3 className="font-bold text-slate-800">Import / Export</h3>
            <p className="text-xs text-slate-500">CSV formatında toplu veri aktarımı</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition flex items-center gap-2"
          >
            <span>📤</span> Ürün Import
          </button>
          
          {/* Download Template */}
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition flex items-center gap-2"
          >
            <span>📋</span> Şablon İndir
          </button>
          
          {/* Export Dropdown */}
          <div className="flex">
            <select
              value={exportType}
              onChange={e => setExportType(e.target.value as any)}
              className="bg-green-50 text-green-700 rounded-l-xl px-3 py-2 text-sm font-medium border-r border-green-200 outline-none"
            >
              <option value="products">Ürünler</option>
              <option value="orders">Siparişler</option>
              <option value="repairs">Servisler</option>
            </select>
            <button
              onClick={() => exportToCSV(exportType)}
              className="px-4 py-2 bg-green-600 text-white rounded-r-xl text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
            >
              <span>📥</span> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab: React.FC<{
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}> = ({ showToast, exchangeRate, setExchangeRate }) => {
  const [settings, setSettings] = useState({
    // Currency
    customExchangeRate: exchangeRate.toString(),
    autoUpdateRate: false,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyNewOrder: true,
    notifyLowStock: true,
    notifyNewRepair: true,
    notifyNewDealer: true,
    
    // Business
    companyName: 'NotebookPro',
    companyAddress: 'Levent, İstanbul, Türkiye',
    companyPhone: '+90 212 XXX XX XX',
    companyEmail: 'info@notebookpro.com',
    taxNumber: '1234567890',
    taxOffice: 'Beşiktaş V.D.',
    
    // System
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    
    // Stock
    defaultCriticalLimit: 3,
    lowStockAlertEnabled: true,
    
    // Repair
    defaultTechnician: '',
    autoAssignRepairs: false,
  });

  const handleSave = () => {
    // Update exchange rate
    const newRate = parseFloat(settings.customExchangeRate);
    if (!isNaN(newRate) && newRate > 0) {
      setExchangeRate(newRate);
    }
    showToast('Ayarlar kaydedildi!', 'success');
  };

  const handleReset = () => {
    setSettings(prev => ({
      ...prev,
      customExchangeRate: '35.00',
    }));
    setExchangeRate(35.00);
    showToast('Ayarlar varsayılana döndürüldü', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>⚙️</span> Sistem Ayarları
            </h2>
            <p className="text-sm text-slate-500 mt-1">Uygulama yapılandırması ve tercihler</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition"
            >
              Varsayılana Dön
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">💰</span>
            Döviz Ayarları
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">USD/TRY Kuru</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono focus:border-red-500 outline-none"
                  value={settings.customExchangeRate}
                  onChange={e => setSettings(prev => ({ ...prev, customExchangeRate: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      showToast('TCMB\'den kurlar çekiliyor...', 'info');
                      const res = await settingsAPI.getTcmbRate();
                      if (res.success && res.data?.rate) {
                        setSettings(prev => ({ ...prev, customExchangeRate: res.data.rate.toString() }));
                        showToast(`Güncel Kur (${res.data.rate} ₺) başarıyla çekildi! Lütfen kaydedin.`, 'success');
                      }
                    } catch (error) {
                      showToast('TCMB kur bilgisi alınamadı. İnternet veya sunucu kaynaklı sorun olabilir.', 'error');
                    }
                  }}
                  className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition whitespace-nowrap"
                >
                  TCMB'den Çek
                </button>
                <span className="px-4 py-3 bg-slate-100 rounded-xl text-slate-600 font-bold hidden sm:block">₺</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Tüm USD fiyatlar bu kurla TL'ye çevrilir</p>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-slate-100">
              <div>
                <div className="font-medium text-slate-700 text-sm">Otomatik Kur Güncelleme</div>
                <div className="text-xs text-slate-400">TCMB'den günlük kur çek</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.autoUpdateRate}
                  onChange={e => setSettings(prev => ({ ...prev, autoUpdateRate: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">🔔</span>
            Bildirim Ayarları
          </h3>
          <div className="space-y-3">
            {[
              { key: 'notifyNewOrder', label: 'Yeni Sipariş', desc: 'Yeni sipariş geldiğinde' },
              { key: 'notifyLowStock', label: 'Düşük Stok', desc: 'Stok kritik seviyeye düştüğünde' },
              { key: 'notifyNewRepair', label: 'Yeni Servis', desc: 'Yeni servis talebi oluşturulduğunda' },
              { key: 'notifyNewDealer', label: 'Bayi Başvurusu', desc: 'Yeni bayi başvurusu geldiğinde' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-slate-700 text-sm">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={(settings as any)[item.key]}
                    onChange={e => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">🏢</span>
            Firma Bilgileri
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Firma Adı</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                value={settings.companyName}
                onChange={e => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Telefon</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                  value={settings.companyPhone}
                  onChange={e => setSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">E-posta</label>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                  value={settings.companyEmail}
                  onChange={e => setSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Adres</label>
              <textarea
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none resize-none"
                value={settings.companyAddress}
                onChange={e => setSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Vergi No</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:border-red-500 outline-none"
                  value={settings.taxNumber}
                  onChange={e => setSettings(prev => ({ ...prev, taxNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Vergi Dairesi</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                  value={settings.taxOffice}
                  onChange={e => setSettings(prev => ({ ...prev, taxOffice: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">🛠️</span>
            Sistem Ayarları
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-slate-700 text-sm">Bakım Modu</div>
                <div className="text-xs text-slate-400">Siteyi geçici olarak kapat</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.maintenanceMode}
                  onChange={e => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div>
                <div className="font-medium text-slate-700 text-sm">Debug Modu</div>
                <div className="text-xs text-slate-400">Geliştirici loglarını aç</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.debugMode}
                  onChange={e => setSettings(prev => ({ ...prev, debugMode: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 mb-2">Varsayılan Kritik Stok Limiti</label>
              <input
                type="number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
                value={settings.defaultCriticalLimit}
                onChange={e => setSettings(prev => ({ ...prev, defaultCriticalLimit: parseInt(e.target.value) || 3 }))}
              />
              <p className="text-xs text-slate-400 mt-1">Yeni ürünler için varsayılan değer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">⚠️</span>
          Tehlikeli Bölge
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => showToast('Önbellek temizlendi!', 'success')}
            className="px-4 py-3 bg-white border border-red-200 rounded-xl text-red-600 font-medium text-sm hover:bg-red-100 transition"
          >
            🗑️ Önbelleği Temizle
          </button>
          <button
            onClick={() => showToast('Demo: Veriler sıfırlandı', 'info')}
            className="px-4 py-3 bg-white border border-red-200 rounded-xl text-red-600 font-medium text-sm hover:bg-red-100 transition"
          >
            🔄 Demo Verileri Sıfırla
          </button>
          <button
            onClick={() => showToast('Demo: Export başlatıldı', 'info')}
            className="px-4 py-3 bg-white border border-red-200 rounded-xl text-red-600 font-medium text-sm hover:bg-red-100 transition"
          >
            📦 Tüm Verileri Export Et
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl">
        <h3 className="font-bold mb-4">Sistem Bilgileri</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Versiyon</div>
            <div className="font-mono">v1.1.0</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Ortam</div>
            <div className="font-mono">Development</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Son Güncelleme</div>
            <div className="font-mono">2024-12-05</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">React</div>
            <div className="font-mono">v18.x</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customers Tab Component
const CustomersTab: React.FC<{
  orders: Order[];
  repairRecords: RepairRecord[];
  formatCurrency: (amount: number) => string;
}> = ({ orders, repairRecords, formatCurrency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    phone: string;
    email: string;
    orders: Order[];
    repairs: RepairRecord[];
    totalSpent: number;
    lastActivity: Date;
  } | null>(null);

  // Build customer list from orders and repairs
  const customers = useMemo(() => {
    const customerMap: Record<string, {
      name: string;
      phone: string;
      email: string;
      orders: Order[];
      repairs: RepairRecord[];
      totalSpent: number;
      lastActivity: Date;
    }> = {};

    // From orders
    orders.forEach(order => {
      const key = order.customerPhone || order.customerEmail || order.customerName;
      if (!customerMap[key]) {
        customerMap[key] = {
          name: order.customerName,
          phone: order.customerPhone || '',
          email: order.customerEmail || '',
          orders: [],
          repairs: [],
          totalSpent: 0,
          lastActivity: new Date(order.createdAt),
        };
      }
      customerMap[key].orders.push(order);
      customerMap[key].totalSpent += order.totalAmount;
      const orderDate = new Date(order.createdAt);
      if (orderDate > customerMap[key].lastActivity) {
        customerMap[key].lastActivity = orderDate;
      }
    });

    // From repairs
    repairRecords.forEach(repair => {
      const key = repair.customer_phone || repair.customer_email || repair.customer_name;
      if (!customerMap[key]) {
        customerMap[key] = {
          name: repair.customer_name,
          phone: repair.customer_phone,
          email: repair.customer_email || '',
          orders: [],
          repairs: [],
          totalSpent: 0,
          lastActivity: new Date(repair.created_at),
        };
      }
      customerMap[key].repairs.push(repair);
      const repairDate = new Date(repair.created_at);
      if (repairDate > customerMap[key].lastActivity) {
        customerMap[key].lastActivity = repairDate;
      }
    });

    return Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders, repairRecords]);

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  // Stats
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0,
    repeatCustomers: customers.filter(c => c.orders.length > 1 || c.repairs.length > 1).length,
  }), [customers]);

  const getRoleBadge = (customer: typeof customers[0]) => {
    if (customer.orders.length >= 5 || customer.totalSpent > 50000) {
      return { label: 'VIP Müşteri', bg: 'bg-yellow-100 text-yellow-700' };
    }
    if (customer.orders.length >= 2 || customer.repairs.length >= 2) {
      return { label: 'Düzenli', bg: 'bg-green-100 text-green-700' };
    }
    return { label: 'Standart', bg: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalCustomers}</div>
              <div className="text-xs text-slate-500">Toplam Müşteri</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-xs text-slate-500">Toplam Ciro</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.avgSpent)}</div>
              <div className="text-xs text-slate-500">Ort. Harcama</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">🔄</div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{stats.repeatCustomers}</div>
              <div className="text-xs text-slate-500">Tekrar Eden</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Müşteri ara: isim, telefon, e-posta..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">👥 Müşteri Listesi</h3>
            <span className="text-sm text-slate-500">{filteredCustomers.length} müşteri</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-6 py-3 text-left">Müşteri</th>
                <th className="px-6 py-3 text-left">İletişim</th>
                <th className="px-6 py-3 text-center">Sipariş</th>
                <th className="px-6 py-3 text-center">Servis</th>
                <th className="px-6 py-3 text-right">Toplam Harcama</th>
                <th className="px-6 py-3 text-center">Durum</th>
                <th className="px-6 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Müşteri bulunamadı</td></tr>
              ) : (
                filteredCustomers.map((customer, idx) => {
                  const badge = getRoleBadge(customer);
                  return (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{customer.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Son: {customer.lastActivity.toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700">{customer.phone || '-'}</div>
                        <div className="text-xs text-slate-400">{customer.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-lg font-bold">
                          {customer.orders.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-lg font-bold">
                          {customer.repairs.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Detay"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{selectedCustomer.name}</h3>
                  <div className="text-xs text-slate-500">{selectedCustomer.phone} • {selectedCustomer.email}</div>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-red-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-700">{selectedCustomer.orders.length}</div>
                  <div className="text-xs text-green-600">Sipariş</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-amber-700">{selectedCustomer.repairs.length}</div>
                  <div className="text-xs text-amber-600">Servis Kaydı</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(selectedCustomer.totalSpent)}</div>
                  <div className="text-xs text-blue-600">Toplam Harcama</div>
                </div>
              </div>

              {/* Lists */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-amber-500">🔧</span> Son Servis Kayıtları
                </h4>
                {selectedCustomer.repairs.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.repairs.map(repair => (
                      <div key={repair.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-start">
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{repair.device_brand} {repair.device_model}</div>
                          <div className="text-xs text-slate-500 mt-1">{repair.issue_description}</div>
                        </div>
                        <div className="text-right whitespace-nowrap ml-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            repair.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            repair.status === 'DELIVERED' ? 'bg-slate-200 text-slate-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {repair.status}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">{new Date(repair.created_at).toLocaleDateString('tr-TR')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                    Henüz servis kaydı yok
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-green-500">📦</span> Son Siparişleri
                </h4>
                {selectedCustomer.orders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.orders.map(order => (
                      <div key={order.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <div className="font-mono font-medium text-slate-800 text-sm">#{order.id.slice(0,8).toUpperCase()}</div>
                          <div className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <div className="text-right whitespace-nowrap ml-4">
                          <div className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{order.items.length} ürün</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                    Henüz siparişi yok
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Users Tab Component
const UsersTab: React.FC<{
  orders: Order[];
  repairRecords: RepairRecord[];
  users: User[];
  formatCurrency: (amount: number) => string;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}> = ({ orders, repairRecords, users, formatCurrency, showToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshUsers } = useAuth();
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER'
  });
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    role: string;
    isApproved: boolean;
    orders: Order[];
    repairs: RepairRecord[];
    totalSpent: number;
    lastActivity: Date;
  } | null>(null);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await usersAPI.create(newUserData);
      showToast('Kullanıcı başarıyla eklendi', 'success');
      setShowAddModal(false);
      setNewUserData({ name: '', email: '', phone: '', password: '', role: 'CUSTOMER' });
      if (refreshUsers) await refreshUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Kullanıcı eklenirken bir hata oluştu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await usersAPI.update(userId, { role: newRole });
      showToast('Kullanıcı rolü güncellendi', 'success');
      if (refreshUsers) await refreshUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Rol güncellenirken bir hata oluştu', 'error');
    }
  };

  // Build customer list directly from DB users
  const customers = useMemo(() => {
    return users.map(user => {
      // Find orders matching this user
      const userOrders = orders.filter(o => o.userId === user.id || (o.customerEmail && o.customerEmail === user.email));
      
      // Find repairs matching this user (as customer or technician)
      const userRepairs = repairRecords.filter(r => 
        r.assigned_technician_id === user.id || 
        (r.customer_email && r.customer_email === user.email) ||
        (user.role === 'CUSTOMER' && r.userId === user.id)
      );

      const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      
      let lastActivity = new Date(user.created_at || Date.now());
      if (userOrders.length > 0) {
        const lastOrderDate = new Date(userOrders[userOrders.length - 1].createdAt);
        if (lastOrderDate > lastActivity) lastActivity = lastOrderDate;
      }
      if (userRepairs.length > 0) {
        const lastRepairDate = new Date(userRepairs[0].created_at);
        if (lastRepairDate > lastActivity) lastActivity = lastRepairDate;
      }

      return {
        id: user.id,
        name: user.name,
        phone: user.phone || '',
        email: user.email,
        role: user.role,
        isApproved: user.is_approved,
        orders: userOrders,
        repairs: userRepairs,
        totalSpent,
        lastActivity,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [users, orders, repairRecords]);

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  // Stats
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0,
    repeatCustomers: customers.filter(c => c.orders.length > 1 || c.repairs.length > 1).length,
  }), [customers]);

  const getRoleBadge = (customer: typeof customers[0]) => {
    switch (customer.role) {
      case 'ADMIN': return { label: 'Yönetici', bg: 'bg-purple-100 text-purple-700' };
      case 'TECHNICIAN': return { label: 'Teknisyen', bg: 'bg-blue-100 text-blue-700' };
      case 'DEALER': return { label: 'Bayi', bg: 'bg-amber-100 text-amber-700' };
      case 'CUSTOMER':
      default:
        if (customer.orders.length >= 5 || customer.totalSpent > 50000) {
          return { label: 'VIP Müşteri', bg: 'bg-yellow-100 text-yellow-700' };
        }
        if (customer.orders.length >= 1 || customer.repairs.length >= 1) {
          return { label: 'Aktif', bg: 'bg-green-100 text-green-700' };
        }
        return { label: 'Yeni', bg: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalCustomers}</div>
              <div className="text-xs text-slate-500">Toplam Müşteri</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-xs text-slate-500">Toplam Ciro</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.avgSpent)}</div>
              <div className="text-xs text-slate-500">Ort. Harcama</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">🔄</div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{stats.repeatCustomers}</div>
              <div className="text-xs text-slate-500">Tekrar Eden</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Müşteri ara: isim, telefon, e-posta..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">👥 Kullanıcı Listesi</h3>
            <span className="text-sm text-slate-500">{filteredCustomers.length} kullanıcı</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition flex items-center gap-2"
          >
            <span>+</span> Ekle
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-6 py-3 text-left">Kullanıcı</th>
                <th className="px-6 py-3 text-left">İletişim</th>
                <th className="px-6 py-3 text-center">Sipariş</th>
                <th className="px-6 py-3 text-center">Servis</th>
                <th className="px-6 py-3 text-right">Toplam Harcama</th>
                <th className="px-6 py-3 text-center">Rol</th>
                <th className="px-6 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Müşteri bulunamadı</td></tr>
              ) : (
                filteredCustomers.map((customer, idx) => {
                  const badge = getRoleBadge(customer);
                  return (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{customer.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Son: {customer.lastActivity.toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700">{customer.phone || '-'}</div>
                        <div className="text-xs text-slate-400">{customer.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-lg font-bold">
                          {customer.orders.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-lg font-bold">
                          {customer.repairs.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          className={`px-2 py-1 rounded outline-none font-medium text-xs cursor-pointer border-transparent hover:border-slate-200 transition ${badge.bg}`}
                          value={customer.role}
                          onChange={(e) => handleRoleChange(customer.id, e.target.value)}
                        >
                          <option value="CUSTOMER">Müşteri</option>
                          <option value="DEALER">Bayi</option>
                          <option value="TECHNICIAN">Teknisyen</option>
                          <option value="ADMIN">Yönetici</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Detay"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{selectedCustomer.name}</h3>
                  <div className="text-xs text-slate-500">{selectedCustomer.phone} • {selectedCustomer.email}</div>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-red-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-700">{selectedCustomer.orders.length}</div>
                  <div className="text-xs text-green-600">Sipariş</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-amber-700">{selectedCustomer.repairs.length}</div>
                  <div className="text-xs text-amber-600">Servis</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(selectedCustomer.totalSpent)}</div>
                  <div className="text-xs text-blue-600">Toplam</div>
                </div>
              </div>

              {/* Orders */}
              {selectedCustomer.orders.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span>🛒</span> Siparişler
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.orders.map(order => (
                      <div key={order.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-mono text-sm text-slate-600">{order.id}</div>
                          <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800">{formatCurrency(order.totalAmount)}</div>
                          <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                            order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' :
                            order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-700' :
                            order.status === OrderStatus.PROCESSING ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{order.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repairs */}
              {selectedCustomer.repairs.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span>🔧</span> Servis Kayıtları
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.repairs.map(repair => (
                      <div key={repair.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-mono text-sm text-red-600">{repair.tracking_code}</div>
                          <div className="text-xs text-slate-500">{repair.device_brand} {repair.device_model}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                            repair.status === RepairStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                            repair.status === RepairStatus.DELIVERED ? 'bg-emerald-100 text-emerald-700' :
                            repair.status === RepairStatus.IN_PROGRESS ? 'bg-cyan-100 text-cyan-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{repair.status}</div>
                          <div className="text-xs text-slate-400 mt-1">{new Date(repair.created_at).toLocaleDateString('tr-TR')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    const phone = selectedCustomer.phone.replace(/\s/g, '');
                    window.open(`https://wa.me/90${phone}`, '_blank');
                  }}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <span>💬</span> WhatsApp
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${selectedCustomer.name}\n${selectedCustomer.phone}\n${selectedCustomer.email}`);
                    showToast('Bilgiler kopyalandı!', 'success');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition flex items-center justify-center gap-2"
                >
                  <span>📋</span> Bilgileri Kopyala
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Kullanıcı / Müşteri Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ad Soyad *</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500"
                    value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">E-posta *</label>
                  <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500"
                    value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Telefon</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500"
                    placeholder="05XX XXX XX XX"
                    value={newUserData.phone} onChange={e => setNewUserData({...newUserData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Geçici Şifre *</label>
                  <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500"
                    value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Rol *</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500"
                    value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})}>
                    <option value="CUSTOMER">Müşteri</option>
                    <option value="DEALER">Bayi</option>
                    <option value="TECHNICIAN">Teknisyen</option>
                    <option value="ADMIN">Yönetici</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold">İptal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
                  {isSubmitting ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Reports Tab Component
const ReportsTab: React.FC<{
  orders: Order[];
  products: Product[];
  repairRecords: RepairRecord[];
  formatCurrency: (amount: number) => string;
}> = ({ orders, products, repairRecords, formatCurrency }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Filter orders by period
  const filteredOrders = useMemo(() => {
    if (selectedPeriod === 'all') return orders;
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orders.filter(order => new Date(order.createdAt) >= cutoff);
  }, [orders, selectedPeriod]);

  // Filter repairs by period
  const filteredRepairs = useMemo(() => {
    if (selectedPeriod === 'all') return repairRecords;
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return repairRecords.filter(repair => new Date(repair.created_at) >= cutoff);
  }, [repairRecords, selectedPeriod]);

  // Sales Stats
  const salesStats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = filteredOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    // By status
    const byStatus = Object.values(OrderStatus).map(status => ({
      status,
      count: filteredOrders.filter(o => o.status === status).length,
      revenue: filteredOrders.filter(o => o.status === status).reduce((s, o) => s + o.totalAmount, 0)
    }));

    // Daily sales for chart
    const dailySales: { date: string; revenue: number; count: number }[] = [];
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayOrders = filteredOrders.filter(o => new Date(o.createdAt).toDateString() === dateStr);
      dailySales.push({
        date: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
        count: dayOrders.length
      });
    }

    return { totalRevenue, orderCount, avgOrderValue, byStatus, dailySales };
  }, [filteredOrders, selectedPeriod]);

  // Top Products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { product: Product; quantity: number; revenue: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = { product: item.product, quantity: 0, revenue: 0 };
        }
        productSales[item.product.id].quantity += item.quantity;
        productSales[item.product.id].revenue += item.quantity * item.product.price_usd * 34.5; // approx TRY
      });
    });
    return Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  }, [filteredOrders]);

  // Category Distribution
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = item.product.category?.name || 'Diğer';
        if (!stats[cat]) stats[cat] = { count: 0, revenue: 0 };
        stats[cat].count += item.quantity;
        stats[cat].revenue += item.quantity * item.product.price_usd * 34.5;
      });
    });
    return Object.entries(stats).map(([category, data]) => ({
      category: category.toUpperCase(),
      ...data
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Repair Stats
  const repairStats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    Object.values(RepairStatus).forEach(s => byStatus[s] = 0);
    filteredRepairs.forEach(r => byStatus[r.status]++);

    const byBrand: Record<string, number> = {};
    filteredRepairs.forEach(r => {
      byBrand[r.device_brand] = (byBrand[r.device_brand] || 0) + 1;
    });

    const topBrands = Object.entries(byBrand).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { total: filteredRepairs.length, byStatus, topBrands };
  }, [filteredRepairs]);

  // Stock Summary
  const stockSummary = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.price_usd * p.stock * 34.5), 0);
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
    const criticalCount = products.filter(p => p.stock <= p.critical_limit).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    return { totalValue, totalItems, criticalCount, outOfStock };
  }, [products]);

  const maxDailySale = Math.max(...salesStats.dailySales.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <span>📊</span> Raporlar & Analytics
        </h2>
        <div className="flex gap-2">
          {[
            { value: '7d', label: 'Son 7 Gün' },
            { value: '30d', label: 'Son 30 Gün' },
            { value: '90d', label: 'Son 90 Gün' },
            { value: 'all', label: 'Tüm Zamanlar' },
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedPeriod === period.value
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl text-white">
          <div className="text-green-100 text-sm mb-1">Toplam Ciro</div>
          <div className="text-3xl font-bold">{formatCurrency(salesStats.totalRevenue)}</div>
          <div className="text-green-200 text-xs mt-2">{salesStats.orderCount} sipariş</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl text-white">
          <div className="text-blue-100 text-sm mb-1">Ortalama Sepet</div>
          <div className="text-3xl font-bold">{formatCurrency(salesStats.avgOrderValue)}</div>
          <div className="text-blue-200 text-xs mt-2">sipariş başına</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-2xl text-white">
          <div className="text-amber-100 text-sm mb-1">Servis Kayıtları</div>
          <div className="text-3xl font-bold">{repairStats.total}</div>
          <div className="text-amber-200 text-xs mt-2">{filteredRepairs.filter(r => r.status === RepairStatus.COMPLETED).length} tamamlandı</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-5 rounded-2xl text-white">
          <div className="text-purple-100 text-sm mb-1">Stok Değeri</div>
          <div className="text-3xl font-bold">{formatCurrency(stockSummary.totalValue)}</div>
          <div className="text-purple-200 text-xs mt-2">{stockSummary.totalItems} adet</div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-green-500">💰</span> Satış Grafiği
        </h3>
        <div className="h-64 flex items-end gap-1">
          {salesStats.dailySales.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center group">
              <div className="w-full flex flex-col items-center justify-end h-48">
                <div
                  className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-300 hover:from-green-600 hover:to-green-500 cursor-pointer relative min-h-[2px]"
                  style={{ height: `${Math.max((day.revenue / maxDailySale) * 100, 1)}%` }}
                >
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                    {formatCurrency(day.revenue)}
                    <br />
                    {day.count} sipariş
                  </div>
                </div>
              </div>
              {selectedPeriod === '7d' && (
                <div className="text-[9px] text-slate-400 mt-2 text-center">{day.date}</div>
              )}
            </div>
          ))}
        </div>
        {selectedPeriod !== '7d' && (
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>{salesStats.dailySales[0]?.date}</span>
            <span>{salesStats.dailySales[salesStats.dailySales.length - 1]?.date}</span>
          </div>
        )}
      </div>

      {/* Two Column: Top Products & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-blue-500">🏆</span> En Çok Satan Ürünler
          </h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Veri yok</div>
            ) : (
              topProducts.map((item, idx) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{item.product.name}</div>
                    <div className="text-xs text-slate-400">{item.product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{item.quantity} adet</div>
                    <div className="text-xs text-slate-400">{formatCurrency(item.revenue)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-purple-500">📦</span> Kategori Dağılımı
          </h3>
          <div className="space-y-3">
            {categoryStats.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Veri yok</div>
            ) : (
              categoryStats.map(cat => {
                const totalRevenue = categoryStats.reduce((s, c) => s + c.revenue, 0);
                const percentage = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{cat.category}</span>
                      <span className="text-slate-500">{cat.count} adet • {formatCurrency(cat.revenue)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Repair & Stock Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repair Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-amber-500">🔧</span> Servis Durumu Dağılımı
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(repairStats.byStatus).filter(([_, count]) => (count as number) > 0).map(([status, count]) => (
              <div key={status} className="bg-slate-50 p-3 rounded-xl">
                <div className="text-2xl font-bold text-slate-800">{count as number}</div>
                <div className="text-xs text-slate-500 truncate">{status}</div>
              </div>
            ))}
          </div>
          {repairStats.topBrands.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-bold mb-2">EN ÇOK SERVİS EDİLEN MARKALAR</div>
              <div className="flex flex-wrap gap-2">
                {repairStats.topBrands.map(([brand, count]) => (
                  <span key={brand} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                    {brand}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stock Health */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-red-500">📊</span> Stok Durumu
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-green-700">{products.length}</div>
              <div className="text-xs text-green-600">Toplam Ürün</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-blue-700">{stockSummary.totalItems}</div>
              <div className="text-xs text-blue-600">Toplam Stok</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-amber-700">{stockSummary.criticalCount}</div>
              <div className="text-xs text-amber-600">Kritik Seviye</div>
            </div>
            <div className="bg-red-50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-red-700">{stockSummary.outOfStock}</div>
              <div className="text-xs text-red-600">Stok Tükendi</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Toplam Stok Değeri</span>
              <span className="font-bold text-slate-900">{formatCurrency(stockSummary.totalValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-indigo-500">🛒</span> Sipariş Durumu Özeti
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {salesStats.byStatus.map(item => (
            <div key={item.status} className={`p-4 rounded-xl ${
              item.status === OrderStatus.PENDING ? 'bg-yellow-50' :
              item.status === OrderStatus.CONFIRMED ? 'bg-blue-50' :
              item.status === OrderStatus.PREPARING || item.status === OrderStatus.PROCESSING ? 'bg-amber-50' :
              item.status === OrderStatus.SHIPPED ? 'bg-indigo-50' :
              item.status === OrderStatus.DELIVERED ? 'bg-green-50' :
              'bg-red-50'
            }`}>
              <div className={`text-2xl font-bold ${
                item.status === OrderStatus.PENDING ? 'text-yellow-700' :
                item.status === OrderStatus.CONFIRMED ? 'text-blue-700' :
                item.status === OrderStatus.PREPARING || item.status === OrderStatus.PROCESSING ? 'text-amber-700' :
                item.status === OrderStatus.SHIPPED ? 'text-indigo-700' :
                item.status === OrderStatus.DELIVERED ? 'text-green-700' :
                'text-red-700'
              }`}>{item.count}</div>
              <div className="text-xs text-slate-600">{item.status}</div>
              <div className="text-xs text-slate-400 mt-1">{formatCurrency(item.revenue)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Notifications Tab Component
const NotificationsTab: React.FC<{
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}> = ({ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll, showToast }) => {
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (filterRead === 'unread' && n.isRead) return false;
    if (filterRead === 'read' && !n.isRead) return false;
    return true;
  });

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

  const getNotifTypeLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER: return 'Sipariş';
      case NotificationType.REPAIR: return 'Servis';
      case NotificationType.STOCK: return 'Stok';
      case NotificationType.DEALER: return 'Bayi';
      case NotificationType.SYSTEM: return 'Sistem';
      default: return 'Diğer';
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT: return { bg: 'bg-red-100 text-red-700', label: 'Acil' };
      case NotificationPriority.HIGH: return { bg: 'bg-orange-100 text-orange-700', label: 'Yüksek' };
      case NotificationPriority.MEDIUM: return { bg: 'bg-blue-100 text-blue-700', label: 'Orta' };
      case NotificationPriority.LOW: return { bg: 'bg-slate-100 text-slate-600', label: 'Düşük' };
      default: return { bg: 'bg-slate-100 text-slate-600', label: 'Normal' };
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

  // Stats by type
  const statsByType = Object.values(NotificationType).map(type => ({
    type,
    icon: getNotifIcon(type),
    label: getNotifTypeLabel(type),
    total: notifications.filter(n => n.type === type).length,
    unread: notifications.filter(n => n.type === type && !n.isRead).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">🔔</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{notifications.length}</div>
              <div className="text-xs text-slate-500">Toplam</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">📬</div>
            <div>
              <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
              <div className="text-xs text-slate-500">Okunmamış</div>
            </div>
          </div>
        </div>
        {statsByType.slice(0, 4).map(stat => (
          <div key={stat.type} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">{stat.icon}</div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stat.total}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
              value={filterType}
              onChange={e => setFilterType(e.target.value as NotificationType | 'all')}
            >
              <option value="all">Tüm Tipler</option>
              {Object.values(NotificationType).map(type => (
                <option key={type} value={type}>{getNotifTypeLabel(type)}</option>
              ))}
            </select>
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
              value={filterRead}
              onChange={e => setFilterRead(e.target.value as 'all' | 'unread' | 'read')}
            >
              <option value="all">Tümü</option>
              <option value="unread">Okunmamış</option>
              <option value="read">Okunmuş</option>
            </select>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => { markAllAsRead(); showToast('Tüm bildirimler okundu işaretlendi', 'success'); }}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition"
              >
                ✓ Tümünü Okundu İşaretle
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => { clearAll(); showToast('Tüm bildirimler silindi', 'success'); }}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition"
              >
                🗑 Tümünü Sil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">
            {filterType === 'all' ? 'Tüm Bildirimler' : getNotifTypeLabel(filterType as NotificationType)}
            <span className="text-slate-400 font-normal ml-2">({filteredNotifications.length})</span>
          </h3>
        </div>
        <div className="divide-y divide-slate-50">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <div className="text-4xl mb-3">🔕</div>
              <p>Bildirim bulunamadı</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`px-6 py-4 hover:bg-slate-50/50 transition ${!notif.isRead ? 'bg-red-50/30' : ''}`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                      {getNotifIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold ${!notif.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getPriorityBadge(notif.priority).bg}`}>
                            {getPriorityBadge(notif.priority).label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {getNotifTypeLabel(notif.type)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-2">{formatTimeAgo(notif.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notif.isRead && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Okundu İşaretle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => { deleteNotification(notif.id); showToast('Bildirim silindi', 'success'); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab: React.FC<{
  orders: Order[];
  getFilteredOrders: (filters: OrderFilters) => Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateTrackingNumber: (orderId: string, trackingNumber: string, shippingCompany?: string) => void;
  generateInvoiceHTML: (order: Order) => string;
  getStatusBadge: (status: OrderStatus) => string;
  formatCurrency: (amount: number) => string;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  setSelectedOrder: (order: Order | null) => void;
}> = ({ orders, getFilteredOrders, updateOrderStatus, updateTrackingNumber, generateInvoiceHTML, getStatusBadge, formatCurrency, showToast, setSelectedOrder }) => {
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({
    search: '',
    status: 'all'
  });
  const [trackingModal, setTrackingModal] = useState<{ isOpen: boolean; order: Order | null }>({ isOpen: false, order: null });
  const [trackingData, setTrackingData] = useState({ trackingNumber: '', shippingCompany: 'Yurtiçi Kargo' });

  const shippingCompanies = ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo', 'Sürat Kargo', 'UPS', 'DHL'];
  
  const filteredOrders = getFilteredOrders(orderFilters);

  const handlePrintInvoice = (order: Order) => {
    const invoiceHTML = generateInvoiceHTML(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    showToast('Fatura yazdırılıyor...', 'info');
  };

  const handleSaveTracking = () => {
    if (trackingModal.order && trackingData.trackingNumber) {
      updateTrackingNumber(trackingModal.order.id, trackingData.trackingNumber, trackingData.shippingCompany);
      if (trackingModal.order.status === OrderStatus.PROCESSING) {
        updateOrderStatus(trackingModal.order.id, OrderStatus.SHIPPED);
      }
      showToast('Kargo bilgileri kaydedildi!', 'success');
      setTrackingModal({ isOpen: false, order: null });
      setTrackingData({ trackingNumber: '', shippingCompany: 'Yurtiçi Kargo' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="Ara: Sipariş no, müşteri adı, telefon, kargo no..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
              value={orderFilters.search}
              onChange={e => setOrderFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-500 outline-none"
            value={orderFilters.status}
            onChange={e => setOrderFilters(prev => ({ ...prev, status: e.target.value as OrderStatus | 'all' }))}
          >
            <option value="all">Tüm Durumlar</option>
            {Object.values(OrderStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800">🛒 Siparişler</h3>
          <span className="text-sm text-slate-500">{filteredOrders.length} sipariş</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="px-4 py-3 text-left rounded-tl-lg">Sipariş No</th>
                <th className="px-4 py-3 text-left">Müşteri</th>
                <th className="px-4 py-3 text-left">Kargo</th>
                <th className="px-4 py-3 text-right">Tutar</th>
                <th className="px-4 py-3 text-left">Tarih</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Sipariş bulunamadı</td></tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-slate-700">{order.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{order.customerName}</div>
                    <div className="text-xs text-slate-400">{order.customerPhone || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {order.trackingNumber ? (
                      <div>
                        <div className="font-mono text-xs text-green-600 font-bold">{order.trackingNumber}</div>
                        <div className="text-[10px] text-slate-400">{order.shippingCompany}</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setTrackingModal({ isOpen: true, order }); setTrackingData({ trackingNumber: '', shippingCompany: 'Yurtiçi Kargo' }); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Kargo Ekle
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <select
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase outline-none cursor-pointer ${getStatusBadge(order.status)}`}
                      value={order.status}
                      onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    >
                      {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Detay"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePrintInvoice(order)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Fatura"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                      {order.trackingNumber && (
                        <button
                          onClick={() => { setTrackingModal({ isOpen: true, order }); setTrackingData({ trackingNumber: order.trackingNumber || '', shippingCompany: order.shippingCompany || 'Yurtiçi Kargo' }); }}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Kargo Düzenle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking Modal */}
      {trackingModal.isOpen && trackingModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">📦 Kargo Bilgileri</h3>
              <button onClick={() => setTrackingModal({ isOpen: false, order: null })} className="text-slate-400 hover:text-red-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-xs text-slate-500">Sipariş</div>
                <div className="font-mono font-bold text-slate-800">{trackingModal.order.id}</div>
                <div className="text-sm text-slate-600">{trackingModal.order.customerName}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kargo Firması</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                  value={trackingData.shippingCompany}
                  onChange={e => setTrackingData(prev => ({ ...prev, shippingCompany: e.target.value }))}
                >
                  {shippingCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Takip Numarası</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono"
                  placeholder="Kargo takip numarasını girin"
                  value={trackingData.trackingNumber}
                  onChange={e => setTrackingData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setTrackingModal({ isOpen: false, order: null })}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveTracking}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mini Sales Chart Component
const MiniSalesChart: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }),
        fullDate: date.toDateString(),
      });
    }
    return days;
  }, []);

  const salesData = useMemo(() => {
    return last7Days.map(day => {
      const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === day.fullDate);
      const total = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const count = dayOrders.length;
      return { ...day, total, count };
    });
  }, [orders, last7Days]);

  const maxSale = Math.max(...salesData.map(d => d.total), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 h-40">
        {salesData.map((day, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center justify-end h-32">
              <div
                className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all duration-500 hover:from-red-600 hover:to-red-500 cursor-pointer relative group min-h-[4px]"
                style={{ height: `${Math.max((day.total / maxSale) * 100, 3)}%` }}
              >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  {day.count} sipariş
                  <br />
                  {formatCurrency(day.total)}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 text-center">{day.date}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-4">
        <div className="text-slate-500">
          Son 7 günde <span className="font-bold text-slate-800">{salesData.reduce((s, d) => s + d.count, 0)}</span> sipariş
        </div>
        <div className="text-slate-500">
          Toplam: <span className="font-bold text-green-600">{formatCurrency(salesData.reduce((s, d) => s + d.total, 0))}</span>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'blue' | 'red' | 'amber' | 'purple' | 'green' | 'emerald';
  large?: boolean;
}> = ({ title, value, subtitle, icon, color, large }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    red: 'bg-red-50 border-red-100 text-red-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
    green: 'bg-green-50 border-green-100 text-green-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  };

  return (
    <div className={`${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {subtitle && <span className="text-xs opacity-70">{subtitle}</span>}
      </div>
      <div className={`font-bold ${large ? 'text-2xl' : 'text-3xl'}`}>{value}</div>
      <div className="text-xs mt-1 opacity-70">{title}</div>
    </div>
  );
};

export default AdminDashboard;
