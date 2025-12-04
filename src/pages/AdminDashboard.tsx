import React, { useState, useMemo } from 'react';
import { useProducts, ProductFilters } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useRepair } from '../context/RepairContext';
import { useOrder } from '../context/OrderContext';
import { ProductCategory, Product, UserRole, RepairStatus, OrderStatus, Order, RepairRecord, WarrantyResult, OrderFilters, RepairFilters, StatusHistoryEntry } from '../types';
import { formatCurrency } from '../utils/pricing';
import SEO from '../components/SEO';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const ITEMS_PER_PAGE = 10;

const AdminDashboard: React.FC = () => {
  const { user, users, approveDealer } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, updateStock, getFilteredProducts } = useProducts();
  const { repairRecords, updateRepairStatus, assignTechnician, generateServiceLabel, sendToWarranty, concludeWarranty, getFilteredRepairs, createRepairFromAdmin } = useRepair();
  const { orders, updateOrderStatus, updateTrackingNumber, getFilteredOrders, generateInvoiceHTML } = useOrder();
  const { showToast, ToastContainer } = useToast();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'dealers' | 'repairs' | 'orders'>('dashboard');
  
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

  // --- Product Form State ---
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', shelf_location: '', price_usd: '', stock: '',
    category: ProductCategory.SCREEN, models: '', critical_limit: '3', dealer_discount: '10'
  });

  const technicians = ["Ahmet Usta", "Mehmet Ç.", "Ayşe Tek.", "Stajyer Can"];
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
      category: newProduct.category,
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
    setNewProduct({ name: '', sku: '', shelf_location: '', price_usd: '', stock: '', category: ProductCategory.SCREEN, models: '', critical_limit: '3', dealer_discount: '10' });
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
      case OrderStatus.PROCESSING: return 'bg-amber-100 text-amber-700';
      case OrderStatus.SHIPPED: return 'bg-blue-100 text-blue-700';
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
      <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'products', label: 'Ürünler', icon: '📦' },
          { id: 'dealers', label: 'Bayiler', icon: '🏢', badge: pendingDealers.length },
          { id: 'repairs', label: 'Servis', icon: '🔧', badge: activeRepairs.length },
          { id: 'orders', label: 'Siparişler', icon: '🛒' },
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

      {/* ========== DASHBOARD TAB ========== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Toplam Ürün" value={stats.totalProducts} icon="📦" color="blue" />
            <StatCard title="Kritik Stok" value={stats.criticalStock} icon="⚠️" color="red" />
            <StatCard title="Aktif Servis" value={stats.activeRepairs} icon="🔧" color="amber" />
            <StatCard title="Bekleyen Bayi" value={stats.pendingDealers} icon="🏢" color="purple" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Toplam Sipariş" value={stats.totalOrders} subtitle={`${stats.pendingOrders} beklemede`} icon="🛒" color="green" />
            <StatCard title="Toplam Ciro" value={formatCurrency(stats.totalRevenue)} icon="💰" color="emerald" large />
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
        </div>
      )}
      </div>
      )}

      {/* ========== PRODUCTS TAB ========== */}
      {activeTab === 'products' && (
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
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
                        value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as ProductCategory})}>
                    {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                     </select>
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
                onChange={e => handleFilterChange({ category: e.target.value as ProductCategory | 'all' })}
              >
                <option value="all">Tüm Kategoriler</option>
                {Object.values(ProductCategory).map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
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
                        <span className={`inline-flex items-center justify-center w-10 h-8 rounded-lg font-bold text-sm ${
                          p.stock === 0 ? 'bg-red-100 text-red-700' :
                          p.stock <= p.critical_limit ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {p.stock}
                        </span>
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
                  value={editingProduct.category}
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}>
                  {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
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
  technicians: string[];
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
                      value={r.assigned_technician || ''}
                      onChange={e => assignTechnician(r.tracking_code, e.target.value)}
                    >
                      <option value="">Atanmadı</option>
                      {technicians.map(t => <option key={t} value={t}>{t}</option>)}
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
