import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRepair } from '../context/RepairContext';
import { useTheme } from '../context/ThemeContext';
import { RepairStatus, UserRole } from '../types';
import SEO from '../components/SEO';

const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const { repairRecords, updateRepairStatus, createRepairFromAdmin } = useRepair();
  const { actualTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'assigned' | 'all' | 'completed' | 'new'>('assigned');
  const [selectedRepair, setSelectedRepair] = useState<string | null>(null);
  
  // Form State
  const [updateForm, setUpdateForm] = useState({
    status: RepairStatus.RECEIVED,
    note: '',
    estimatedCost: '',
    finalCost: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // New Repair Form State
  const [newRepairForm, setNewRepairForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    device_brand: '',
    device_model: '',
    serial_number: '',
    issue_description: '',
    estimated_cost_tl: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // Handle Selection
  const handleSelectRepair = (repair: any) => {
    if (selectedRepair === repair.id) {
      setSelectedRepair(null);
    } else {
      setSelectedRepair(repair.id);
      setUpdateForm({
        status: repair.status,
        note: '', // Clear note on new selection
        estimatedCost: repair.estimated_cost_tl?.toString() || '',
        finalCost: repair.price_to_customer?.toString() || ''
      });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent, repair: any) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateRepairStatus(
        repair.tracking_code,
        updateForm.status,
        updateForm.note.trim() || undefined,
        updateForm.estimatedCost ? parseFloat(updateForm.estimatedCost) : undefined,
        updateForm.finalCost ? parseFloat(updateForm.finalCost) : undefined
      );
      // Başarılı olursa notu temizle ama detay açık kalsın
      setUpdateForm(prev => ({ ...prev, note: '' }));
      alert('Kayıt başarıyla güncellendi.');
    } catch (error) {
      alert('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createRepairFromAdmin({
        ...newRepairForm,
        estimated_cost_tl: newRepairForm.estimated_cost_tl ? parseFloat(newRepairForm.estimated_cost_tl) : undefined,
      });
      alert('Yeni servis kaydı başarıyla oluşturuldu.');
      setNewRepairForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        device_brand: '',
        device_model: '',
        serial_number: '',
        issue_description: '',
        estimated_cost_tl: ''
      });
      setActiveTab('assigned');
    } catch (error) {
      alert('Kayıt oluşturulurken bir hata oluştu.');
    } finally {
      setIsCreating(false);
    }
  };

  // Check technician role
  if (!user || user.role !== UserRole.TECHNICIAN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SEO title="Erişim Engellendi" />
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Erişim Engellendi
          </h2>
          <p className={`mt-2 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Bu sayfayı görüntülemek için Teknisyen hesabı gereklidir.
          </p>
        </div>
      </div>
    );
  }

  // Get technician's repairs
  const myRepairs = repairRecords.filter(r => r.assigned_technician_id === user.id || r.assigned_technician === user.name);
  const activeRepairs = myRepairs.filter(r => 
    r.status !== RepairStatus.DELIVERED && r.status !== RepairStatus.CANCELLED
  );
  const completedRepairs = myRepairs.filter(r => 
    r.status === RepairStatus.DELIVERED || r.status === RepairStatus.COMPLETED
  );

  // Stats
  const stats = useMemo(() => ({
    assigned: activeRepairs.length,
    completed: completedRepairs.length,
    inProgress: myRepairs.filter(r => r.status === RepairStatus.IN_PROGRESS).length,
    waiting: myRepairs.filter(r => 
      r.status === RepairStatus.WAITING_PARTS || r.status === RepairStatus.WAITING_APPROVAL
    ).length
  }), [myRepairs, activeRepairs, completedRepairs]);

  const getStatusColor = (status: RepairStatus) => {
    const colors: Record<string, string> = {
      [RepairStatus.RECEIVED]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      [RepairStatus.DIAGNOSING]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      [RepairStatus.WAITING_PARTS]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      [RepairStatus.WAITING_APPROVAL]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
      [RepairStatus.IN_PROGRESS]: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
      [RepairStatus.COMPLETED]: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      [RepairStatus.DELIVERED]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getFilteredRepairs = () => {
    switch (activeTab) {
      case 'assigned':
        return activeRepairs;
      case 'completed':
        return completedRepairs;
      default:
        return myRepairs;
    }
  };

  return (
    <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <SEO title="Teknisyen Paneli" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl">
              🔧
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Teknisyen Paneli
              </h1>
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Hoş geldin, {user.name}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-5 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <div className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {stats.assigned}
                </div>
                <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Atanan İş
                </div>
              </div>
            </div>
          </div>
          <div className={`p-5 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl flex items-center justify-center text-2xl">
                ⚙️
              </div>
              <div>
                <div className={`text-2xl font-bold text-cyan-600`}>
                  {stats.inProgress}
                </div>
                <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Devam Eden
                </div>
              </div>
            </div>
          </div>
          <div className={`p-5 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center text-2xl">
                ⏳
              </div>
              <div>
                <div className={`text-2xl font-bold text-amber-600`}>
                  {stats.waiting}
                </div>
                <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Beklemede
                </div>
              </div>
            </div>
          </div>
          <div className={`p-5 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <div className={`text-2xl font-bold text-green-600`}>
                  {stats.completed}
                </div>
                <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tamamlanan
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-6 p-1 rounded-xl w-fit ${
          actualTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          {[
            { id: 'assigned', label: 'Atanan İşler', count: activeRepairs.length },
            { id: 'all', label: 'Tüm İşlerim', count: myRepairs.length },
            { id: 'completed', label: 'Tamamlanan', count: completedRepairs.length },
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
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id 
                  ? 'bg-red-600 text-white' 
                  : actualTheme === 'dark' ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
          <div className={`w-px mx-1 ${actualTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              activeTab === 'new'
                ? 'bg-red-600 text-white shadow-sm'
                : actualTheme === 'dark'
                  ? 'text-red-400 hover:bg-slate-700 hover:text-red-300'
                  : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <span className="text-lg leading-none">+</span> Yeni Kayıt
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'new' ? (
          <div className={`rounded-2xl p-6 ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm max-w-2xl`}>
            <h2 className={`text-xl font-bold mb-6 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Yeni Servis Kaydı Oluştur</h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Müşteri Adı Soyadı *</label>
                  <input
                    required
                    type="text"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                      actualTheme === 'dark'
                        ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                        : 'bg-slate-50 border-slate-200 focus:border-red-500 focus:ring-red-500'
                    } border focus:ring-1 outline-none transition-shadow`}
                    value={newRepairForm.customer_name}
                    onChange={e => setNewRepairForm({ ...newRepairForm, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Telefon Numarası *</label>
                  <input
                    required
                    type="tel"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                      actualTheme === 'dark'
                        ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                        : 'bg-slate-50 border-slate-200 focus:border-red-500 focus:ring-red-500'
                    } border focus:ring-1 outline-none transition-shadow`}
                    value={newRepairForm.customer_phone}
                    onChange={e => setNewRepairForm({ ...newRepairForm, customer_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>E-posta Adresi</label>
                <input
                  type="email"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                    actualTheme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                      : 'bg-slate-50 border-slate-200 focus:border-red-500 focus:ring-red-500'
                  } border focus:ring-1 outline-none transition-shadow`}
                  value={newRepairForm.customer_email}
                  onChange={e => setNewRepairForm({ ...newRepairForm, customer_email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Cihaz Markası *</label>
                  <input
                    required
                    type="text"
                    placeholder="Örn: Apple, Asus"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                      actualTheme === 'dark'
                        ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                        : 'bg-slate-50 border-slate-200 focus:border-red-500 focus:ring-red-500'
                    } border focus:ring-1 outline-none transition-shadow`}
                    value={newRepairForm.device_brand}
                    onChange={e => setNewRepairForm({ ...newRepairForm, device_brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Cihaz Modeli *</label>
                  <input
                    required
                    type="text"
                    placeholder="Örn: MacBook Pro, ROG Strix"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                      actualTheme === 'dark'
                        ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                        : 'bg-slate-50 border-slate-200 focus:border-red-500 focus:ring-red-500'
                    } border focus:ring-1 outline-none transition-shadow`}
                    value={newRepairForm.device_model}
                    onChange={e => setNewRepairForm({ ...newRepairForm, device_model: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Seri Numarası</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono uppercase ${
                    actualTheme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                      : 'bg-slate-50 border-slate-200 focus:border-red-500 focus:ring-red-500'
                  } border focus:ring-1 outline-none transition-shadow`}
                  value={newRepairForm.serial_number}
                  onChange={e => setNewRepairForm({ ...newRepairForm, serial_number: e.target.value })}
                />
              </div>

              <div>
                <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Arıza Açıklaması / Şikayet *</label>
                <textarea
                  required
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm resize-none ${
                    actualTheme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                      : 'bg-slate-50 border-slate-200 focus:border-red-500 focus:ring-red-500'
                  } border focus:ring-1 outline-none transition-shadow`}
                  value={newRepairForm.issue_description}
                  onChange={e => setNewRepairForm({ ...newRepairForm, issue_description: e.target.value })}
                />
              </div>

              <div>
                <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Tahmini Tutar (₺)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                    actualTheme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                      : 'bg-slate-50 border-slate-200 focus:border-red-500 focus:ring-red-500'
                  } border focus:ring-1 outline-none transition-shadow`}
                  value={newRepairForm.estimated_cost_tl}
                  onChange={e => setNewRepairForm({ ...newRepairForm, estimated_cost_tl: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('assigned')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                    actualTheme === 'dark'
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`flex-[2] py-3 rounded-xl font-bold text-white transition-colors ${
                    isCreating
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20'
                  }`}
                >
                  {isCreating ? 'Oluşturuluyor...' : 'Kaydı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {getFilteredRepairs().length === 0 ? (
              <div className={`col-span-full p-12 rounded-2xl text-center ${
                actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div className="text-5xl mb-4">📭</div>
                <p className={actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                  Bu kategoride iş bulunmuyor.
                </p>
              </div>
            ) : (
              getFilteredRepairs().map(repair => (
                <div
                  key={repair.id}
                  className={`rounded-2xl overflow-hidden ${
                    actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
                  } shadow-sm ${selectedRepair === repair.id ? 'ring-2 ring-red-500' : ''}`}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-mono text-red-600 font-bold">{repair.tracking_code}</div>
                        <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {new Date(repair.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(repair.status)}`}>
                        {repair.status}
                      </span>
                    </div>

                    {/* Customer & Device */}
                    <div className="mb-3">
                      <div className={`font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {repair.customer_name}
                      </div>
                      <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {repair.device_brand} {repair.device_model}
                        {repair.serial_number && (
                          <span className="font-mono ml-2 text-xs">S/N: {repair.serial_number}</span>
                        )}
                      </div>
                    </div>

                    {/* Issue */}
                    <div className={`p-3 rounded-xl mb-3 ${
                      actualTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
                    }`}>
                      <div className={`text-xs font-bold mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Arıza Açıklaması
                      </div>
                      <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {repair.issue_description}
                      </div>
                    </div>

                    {/* Expand Button */}
                    {repair.status !== RepairStatus.DELIVERED && repair.status !== RepairStatus.CANCELLED && (
                      <div className="flex gap-2">
                          <button
                            onClick={() => handleSelectRepair(repair)}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                              selectedRepair === repair.id
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : actualTheme === 'dark'
                                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {selectedRepair === repair.id ? 'Daralt ⬆️' : 'İşlem Yap / Detay 📝'}
                          </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details & Form */}
                  {selectedRepair === repair.id && (
                    <div className={`px-4 pb-4 pt-2 border-t ${
                      actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-100'
                    }`}>
                      {/* Exisiting Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                          <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Telefon</div>
                          <div className={actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}>{repair.customer_phone}</div>
                        </div>
                        {repair.customer_email && (
                          <div>
                            <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>E-posta</div>
                            <div className={actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}>{repair.customer_email}</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Update Form */}
                      {repair.status !== RepairStatus.DELIVERED && repair.status !== RepairStatus.CANCELLED && (
                        <form onSubmit={(e) => handleUpdateSubmit(e, repair)} className={`p-4 rounded-xl mb-4 ${
                          actualTheme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'
                        }`}>
                          <h4 className={`text-sm font-bold mb-3 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            Kayıt Güncelle
                          </h4>
                          
                          <div className="space-y-3">
                            {/* Durum */}
                            <div>
                              <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                Yeni Durum
                              </label>
                              <select
                                required
                                className={`w-full px-3 py-2 rounded-lg text-sm ${
                                  actualTheme === 'dark'
                                    ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                                    : 'bg-white border-slate-200 focus:border-red-500 focus:ring-red-500'
                                } border focus:ring-1 outline-none transition-shadow`}
                                value={updateForm.status}
                                onChange={e => setUpdateForm(prev => ({ ...prev, status: e.target.value as RepairStatus }))}
                              >
                                {Object.values(RepairStatus).map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>

                            {/* Teknisyen Notu */}
                            <div>
                              <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                Yapılan İşlemler / Arıza Notu
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Müşterinin de görebileceği işlem notları (Opsiyonel)"
                                className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                                  actualTheme === 'dark'
                                    ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                                    : 'bg-white border-slate-200 focus:border-red-500 focus:ring-red-500'
                                } border focus:ring-1 outline-none transition-shadow`}
                                value={updateForm.note}
                                onChange={e => setUpdateForm(prev => ({ ...prev, note: e.target.value }))}
                              />
                            </div>
                            
                            {/* Ücretlendirme */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Tahmini Ücret (₺)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="..."
                                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                                    actualTheme === 'dark'
                                      ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                                      : 'bg-white border-slate-200 focus:border-red-500 focus:ring-red-500'
                                  } border focus:ring-1 outline-none transition-shadow`}
                                  value={updateForm.estimatedCost}
                                  onChange={e => setUpdateForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className={`block text-xs mb-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Kesin Fiyat (₺)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="Müşteriye yansıyacak..."
                                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                                    actualTheme === 'dark'
                                      ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500 focus:ring-red-500'
                                      : 'bg-white border-slate-200 focus:border-red-500 focus:ring-red-500'
                                  } border focus:ring-1 outline-none transition-shadow`}
                                  value={updateForm.finalCost}
                                  onChange={e => setUpdateForm(prev => ({ ...prev, finalCost: e.target.value }))}
                                />
                              </div>
                            </div>
                            
                            <button
                              type="submit"
                              disabled={isUpdating}
                              className={`w-full mt-2 py-2.5 rounded-lg text-sm font-bold text-white transition-colors ${
                                isUpdating 
                                  ? 'bg-red-400 cursor-not-allowed' 
                                  : 'bg-red-600 hover:bg-red-700 shadow-sm'
                              }`}
                            >
                              {isUpdating ? 'Güncelleniyor...' : 'Güncelle ve Kaydet'}
                            </button>
                          </div>
                        </form>
                      )}
                      
                      {/* Status History */}
                      {repair.statusHistory && repair.statusHistory.length > 0 && (
                        <div className="mt-4">
                          <div className={`text-xs font-bold mb-2 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Durum Geçmişi
                          </div>
                          <div className="space-y-2">
                            {repair.statusHistory.slice(0, 3).map((entry, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                <span className={actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                                  {entry.status}
                                </span>
                                <span className={actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>
                                  {new Date(entry.timestamp).toLocaleString('tr-TR')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard;

