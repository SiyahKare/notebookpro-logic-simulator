
import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useRepair } from '../context/RepairContext';
import { useOrder } from '../context/OrderContext';
import { ProductCategory, Product, UserRole, RepairStatus, OrderStatus, Order, RepairRecord, WarrantyResult } from '../types';
import { formatCurrency } from '../utils/pricing';
import SEO from '../components/SEO';

const AdminDashboard: React.FC = () => {
  const { user, users, approveDealer } = useAuth();
  const { products, addProduct, updateStock } = useProducts();
  const { repairRecords, updateRepairStatus, assignTechnician, generateServiceLabel, sendToWarranty, concludeWarranty } = useRepair();
  const { orders, updateOrderStatus } = useOrder();
  
  const [activeTab, setActiveTab] = useState<'products' | 'dealers' | 'repairs' | 'orders'>('products');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // --- Warranty / RMA Modals State ---
  const [rmaModalOpen, setRmaModalOpen] = useState(false);
  const [rmaConcludeModalOpen, setRmaConcludeModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairRecord | null>(null);
  
  // RMA Form Data
  const [rmaFormData, setRmaFormData] = useState({ supplier: '', rmaCode: '' });
  const [concludeData, setConcludeData] = useState({ result: 'repaired' as WarrantyResult, notes: '', swapSerial: '' });

  // --- Product Form State ---
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    shelf_location: '',
    price_usd: '',
    stock: '',
    category: ProductCategory.SCREEN,
    models: ''
  });

  const technicians = ["Ahmet Usta", "Mehmet Ç.", "Ayşe Tek.", "Stajyer Can"];
  const suppliers = ["Arena Bilgisayar", "KVK Teknoloji", "Penta", "Asus Türkiye", "MSI ServisPoint"];

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <SEO title="Erişim Engellendi" />
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h2 className="text-xl font-bold text-slate-800">Erişim Engellendi</h2>
          <p className="text-slate-500">Bu sayfayı görüntülemek için Admin olmalısınız.</p>
        </div>
      </div>
    );
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();

    // BULK PASTE LOGIC: Split by both Comma (,) and Newline (\n) to support Excel paste
    const modelList = newProduct.models
      .split(/[\n,]+/) // Regex: Split by newline OR comma
      .map(s => s.trim()) // Remove whitespace
      .filter(s => s.length > 0); // Remove empty lines

    const productToAdd: Product = {
      id: '', // Will be generated in Context
      name: newProduct.name,
      sku: newProduct.sku,
      shelf_location: newProduct.shelf_location,
      category: newProduct.category,
      description: 'Yeni eklenen ürün',
      image_url: 'https://picsum.photos/200/300', // Placeholder
      price_usd: parseFloat(newProduct.price_usd),
      stock: parseInt(newProduct.stock),
      dealer_discount_percent: 10,
      vat_rate: 0.20,
      critical_limit: 3,
      compatible_models: modelList
    };

    addProduct(productToAdd);
    setNewProduct({ name: '', sku: '', shelf_location: '', price_usd: '', stock: '', category: ProductCategory.SCREEN, models: '' });
    alert(`Ürün ve ${modelList.length} adet uyumlu model başarıyla eklendi!`);
  };

  // --- Warranty Handlers ---
  const openWarrantyModal = (record: RepairRecord) => {
    setSelectedRepair(record);
    if (record.status === RepairStatus.IN_WARRANTY) {
        // Already in warranty, open conclusion modal
        setRmaConcludeModalOpen(true);
    } else {
        // New warranty process
        setRmaFormData({ supplier: '', rmaCode: '' });
        setRmaModalOpen(true);
    }
  };

  const handleSubmitRma = () => {
    if (selectedRepair && rmaFormData.supplier && rmaFormData.rmaCode) {
        sendToWarranty(selectedRepair.tracking_code, rmaFormData.supplier, rmaFormData.rmaCode);
        setRmaModalOpen(false);
        setSelectedRepair(null);
    }
  };

  const handleSubmitConclusion = () => {
    if (selectedRepair) {
        concludeWarranty(selectedRepair.tracking_code, concludeData.result, concludeData.notes, concludeData.swapSerial);
        setRmaConcludeModalOpen(false);
        setSelectedRepair(null);
        setConcludeData({ result: 'repaired', notes: '', swapSerial: '' });
    }
  };

  // Helper for Badge Colors
  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PROCESSING: return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.SHIPPED: return 'bg-blue-100 text-blue-700';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-700';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // --- Filter Logic ---
  const pendingDealers = users.filter(u => u.role === UserRole.DEALER && !u.is_approved);
  const criticalStockProducts = products.filter(p => p.stock <= p.critical_limit);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen relative">
      <SEO title="Yönetim Paneli" />
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Yönetim Paneli</h1>
        <p className="text-slate-500 mt-2">NotebookPro sistem parametrelerini buradan yönetebilirsiniz.</p>
      </header>

      {/* STOCK ALERTS WIDGET */}
      {criticalStockProducts.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">!</div>
             <h3 className="font-bold text-red-900 text-lg">Kritik Stok Uyarıları</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {criticalStockProducts.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm flex justify-between items-center">
                 <div>
                    <p className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.sku}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{p.stock}</p>
                    <p className="text-[10px] text-red-400">Limit: {p.critical_limit}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-slate-200 overflow-x-auto">
        <button onClick={() => setActiveTab('products')} className={`pb-3 px-4 font-medium text-sm whitespace-nowrap transition ${activeTab === 'products' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-800'}`}>Ürün Yönetimi</button>
        <button onClick={() => setActiveTab('dealers')} className={`pb-3 px-4 font-medium text-sm whitespace-nowrap transition ${activeTab === 'dealers' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-800'}`}>Bayi Onayları {pendingDealers.length > 0 && <span className="ml-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingDealers.length}</span>}</button>
        <button onClick={() => setActiveTab('repairs')} className={`pb-3 px-4 font-medium text-sm whitespace-nowrap transition ${activeTab === 'repairs' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-800'}`}>Servis Takip</button>
        <button onClick={() => setActiveTab('orders')} className={`pb-3 px-4 font-medium text-sm whitespace-nowrap transition ${activeTab === 'orders' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-800'}`}>Siparişler</button>
      </div>

      {/* CONTENT: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Yeni Ürün Ekle</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">Ürün Adı</label>
                 <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-red-500 outline-none" 
                    value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">SKU (Stok Kodu)</label>
                    <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-red-500 outline-none" 
                        value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Raf Yeri</label>
                    <input required placeholder="Örn: A-01" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-red-500 outline-none" 
                        value={newProduct.shelf_location} onChange={e => setNewProduct({...newProduct, shelf_location: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                     <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-red-500 outline-none"
                        value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as ProductCategory})}>
                        {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fiyat (USD)</label>
                    <input required type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-red-500 outline-none" 
                        value={newProduct.price_usd} onChange={e => setNewProduct({...newProduct, price_usd: e.target.value})} />
                  </div>
               </div>
               <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Stok Adedi</label>
                    <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-red-500 outline-none" 
                        value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between">
                    <span>Uyumlu Modeller</span>
                    <span className="text-red-500 font-normal">Toplu Yapıştır (Excel)</span>
                 </label>
                 <textarea 
                    placeholder="Excel'den kopyalayıp yapıştırabilirsiniz.&#10;Asus X550&#10;Lenovo Z580&#10;Dell 3521" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:border-red-500 outline-none font-mono" 
                    rows={5}
                    value={newProduct.models} 
                    onChange={e => setNewProduct({...newProduct, models: e.target.value})} 
                 />
                 <p className="text-[10px] text-slate-400 mt-1">Her satır bir model olarak kaydedilir.</p>
               </div>
               <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition">
                 Ürünü Sisteme Kaydet
               </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Envanter Listesi</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Ürün Adı</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Raf</th>
                    <th className="px-4 py-3">Fiyat (USD)</th>
                    <th className="px-4 py-3">Uyumlu Model</th>
                    <th className="px-4 py-3 rounded-tr-lg">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs font-bold bg-slate-100 rounded-md inline-block mt-2 px-2">{p.shelf_location || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">${p.price_usd}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {p.compatible_models.length} Adet
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          className={`w-16 border rounded p-1 text-center focus:border-red-500 outline-none ${p.stock <= p.critical_limit ? 'bg-red-50 border-red-300 text-red-700 font-bold' : 'bg-white'}`}
                          value={p.stock}
                          onChange={(e) => updateStock(p.id, parseInt(e.target.value))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: DEALERS */}
      {activeTab === 'dealers' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-lg text-slate-800 mb-4">Onay Bekleyen Bayi Başvuruları</h3>
           {pendingDealers.length === 0 ? (
             <p className="text-slate-500 text-center py-10">Şu anda onay bekleyen başvuru yok.</p>
           ) : (
             <div className="grid gap-4">
                {pendingDealers.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-red-100 hover:shadow-sm transition">
                     <div>
                        <h4 className="font-bold text-slate-800">{d.name}</h4>
                        <p className="text-xs text-slate-500">{d.email} | {d.phone}</p>
                        {d.company_details && (
                          <div className="mt-2 text-xs bg-slate-50 p-2 rounded inline-block text-slate-600">
                            {d.company_details.taxTitle} - VKN: {d.company_details.taxNumber}
                          </div>
                        )}
                     </div>
                     <button 
                        onClick={() => approveDealer(d.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition shadow-green-200 shadow-md"
                     >
                        Onayla & Yetkilendir
                     </button>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {/* CONTENT: REPAIRS */}
      {activeTab === 'repairs' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-lg text-slate-800 mb-4">Servis Takip Merkezi</h3>
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">İşlemler</th>
                    <th className="px-4 py-3">Takip No</th>
                    <th className="px-4 py-3">Müşteri / Cihaz</th>
                    <th className="px-4 py-3">Arıza</th>
                    <th className="px-4 py-3">Teknisyen</th>
                    <th className="px-4 py-3 rounded-tr-lg">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {repairRecords.map(r => (
                    <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50 ${r.status === RepairStatus.IN_WARRANTY ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3 flex gap-2">
                         <button onClick={() => generateServiceLabel(r)} className="text-xs bg-slate-800 text-white px-2 py-1 rounded hover:bg-red-600 transition">
                           Etiket
                         </button>
                         <button 
                            onClick={() => openWarrantyModal(r)} 
                            className={`text-xs px-2 py-1 rounded transition ${r.status === RepairStatus.IN_WARRANTY ? 'bg-green-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                         >
                           {r.status === RepairStatus.IN_WARRANTY ? 'Sonuçlandır' : 'Garanti/RMA'}
                         </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-red-600 font-bold">{r.tracking_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{r.customer_name}</div>
                        <div className="text-xs text-slate-500">{r.device_brand} {r.device_model}</div>
                        {r.status === RepairStatus.IN_WARRANTY && r.supplier_name && (
                            <div className="mt-1 text-[9px] bg-orange-100 text-orange-800 px-1 rounded w-fit">
                                Tedarikçi: {r.supplier_name}
                            </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={r.issue_description}>{r.issue_description}</td>
                      <td className="px-4 py-3">
                        <select
                           className="bg-white border border-slate-200 text-xs rounded p-1 outline-none focus:border-red-500"
                           value={r.assigned_technician || ''}
                           onChange={(e) => assignTechnician(r.tracking_code, e.target.value)}
                        >
                           <option value="">Atanmadı</option>
                           {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          className={`bg-slate-100 border-none text-xs font-medium text-slate-700 rounded p-2 outline-none focus:ring-2 ring-red-200 cursor-pointer ${r.status === RepairStatus.IN_WARRANTY ? 'bg-orange-200 text-orange-900 font-bold' : ''}`}
                          value={r.status}
                          onChange={(e) => updateRepairStatus(r.tracking_code, e.target.value as RepairStatus)}
                        >
                          {Object.values(RepairStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-lg text-slate-800 mb-4">Sipariş Yönetimi</h3>
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Sipariş No</th>
                    <th className="px-4 py-3">Müşteri</th>
                    <th className="px-4 py-3">Toplam Tutar</th>
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 rounded-tr-lg">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-500">Henüz sipariş bulunmuyor.</td></tr>
                  ) : orders.map(order => (
                    <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50">
                       <td className="px-4 py-3 font-mono font-bold text-slate-700">{order.id}</td>
                       <td className="px-4 py-3 text-slate-800 font-medium">{order.customerName}</td>
                       <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(order.totalAmount)}</td>
                       <td className="px-4 py-3 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                       <td className="px-4 py-3">
                          <div className="relative">
                            <select 
                                className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer ${getStatusBadge(order.status)}`}
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            >
                                {Object.values(OrderStatus).map(s => <option key={s} value={s} className="bg-white text-slate-800">{s}</option>)}
                            </select>
                          </div>
                       </td>
                       <td className="px-4 py-3">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-slate-400 hover:text-red-600 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
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
                         <div key={idx} className="flex justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
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
      
      {/* WARRANTY SEND MODAL */}
      {rmaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Garantiye / Tedarikçiye Gönder</h3>
                <p className="text-sm text-slate-500 mb-4">Cihazı yetkili servise veya tedarikçiye yönlendiriyorsunuz.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tedarikçi / Yetkili Servis</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-500"
                            value={rmaFormData.supplier}
                            onChange={(e) => setRmaFormData({...rmaFormData, supplier: e.target.value})}
                        >
                            <option value="">Firma Seçiniz</option>
                            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Dış Takip No (RMA Code)</label>
                        <input 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-500"
                            placeholder="Örn: KVK-123456"
                            value={rmaFormData.rmaCode}
                            onChange={(e) => setRmaFormData({...rmaFormData, rmaCode: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setRmaModalOpen(false)} className="w-1/2 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200">İptal</button>
                        <button onClick={handleSubmitRma} className="w-1/2 py-2 bg-orange-500 text-white rounded-lg font-bold text-xs hover:bg-orange-600 shadow-orange-200 shadow-md">Gönder</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* WARRANTY CONCLUDE MODAL */}
      {rmaConcludeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Garanti Sürecini Sonuçlandır</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Sonuç</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-500"
                            value={concludeData.result}
                            onChange={(e) => setConcludeData({...concludeData, result: e.target.value as WarrantyResult})}
                        >
                            <option value="repaired">Onarıldı (Repaired)</option>
                            <option value="swapped">Değişim (Swap)</option>
                            <option value="refunded">İade (Refund)</option>
                            <option value="rejected">Ret (Rejected)</option>
                        </select>
                    </div>
                    
                    {concludeData.result === 'swapped' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Yeni Cihaz Seri No</label>
                            <input 
                                className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm outline-none focus:border-yellow-500"
                                placeholder="Yeni Serial Number"
                                value={concludeData.swapSerial}
                                onChange={(e) => setConcludeData({...concludeData, swapSerial: e.target.value})}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Açıklama / Notlar</label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-500"
                            rows={3}
                            value={concludeData.notes}
                            onChange={(e) => setConcludeData({...concludeData, notes: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setRmaConcludeModalOpen(false)} className="w-1/2 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200">İptal</button>
                        <button onClick={handleSubmitConclusion} className="w-1/2 py-2 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 shadow-green-200 shadow-md">Kaydet ve Kapat</button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
