import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRepair } from '../context/RepairContext';
import { useTheme } from '../context/ThemeContext';
import { RepairStatus, UserRole } from '../types';
import SEO from '../components/SEO';

const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const { repairRecords, updateRepairStatus } = useRepair();
  const { actualTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'assigned' | 'all' | 'completed'>('assigned');
  const [selectedRepair, setSelectedRepair] = useState<string | null>(null);

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
  const myRepairs = repairRecords.filter(r => r.assigned_technician === user.name);
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
        </div>

        {/* Repairs List */}
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

                  {/* Status Update */}
                  {repair.status !== RepairStatus.DELIVERED && repair.status !== RepairStatus.CANCELLED && (
                    <div className="flex gap-2">
                      <select
                        className={`flex-1 px-3 py-2 rounded-xl text-sm ${
                          actualTheme === 'dark'
                            ? 'bg-slate-700 text-white border-slate-600'
                            : 'bg-slate-50 border border-slate-200'
                        }`}
                        value={repair.status}
                        onChange={e => updateRepairStatus(repair.tracking_code, e.target.value as RepairStatus)}
                      >
                        {Object.values(RepairStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setSelectedRepair(selectedRepair === repair.id ? null : repair.id)}
                        className={`px-3 py-2 rounded-xl ${
                          actualTheme === 'dark'
                            ? 'bg-slate-700 hover:bg-slate-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        📝
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedRepair === repair.id && (
                  <div className={`px-4 pb-4 pt-2 border-t ${
                    actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-100'
                  }`}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                      {repair.estimated_cost_tl && (
                        <div>
                          <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Tahmini Ücret</div>
                          <div className="text-green-600 font-bold">{repair.estimated_cost_tl.toLocaleString('tr-TR')}₺</div>
                        </div>
                      )}
                    </div>
                    
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
      </div>
    </div>
  );
};

export default TechnicianDashboard;

