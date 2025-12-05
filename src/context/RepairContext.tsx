import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { RepairRecord, RepairStatus, WarrantyResult, RepairFilters, StatusHistoryEntry } from '../types';
import { repairsAPI } from '../services/api';
import { generateRepairQRLink } from '../utils/helpers';
import { useAuth } from './AuthContext';

// API'den gelen repair formatı
interface APIRepair {
  id: string;
  trackingCode: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber?: string;
  issueDescription: string;
  technicianNotes?: string;
  status: string;
  priority: string;
  estimatedCost?: number;
  finalCost?: number;
  isPaid: boolean;
  warrantyStatus?: string;
  warrantyNotes?: string;
  technicianId?: string;
  receivedAt: string;
  diagnosedAt?: string;
  repairedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: {
    status: string;
    note?: string;
    createdBy?: string;
    createdAt: string;
  }[];
}

// Status mapping API -> Frontend
const mapAPIStatusToRepairStatus = (status: string): RepairStatus => {
  const statusMap: Record<string, RepairStatus> = {
    'RECEIVED': RepairStatus.RECEIVED,
    'DIAGNOSING': RepairStatus.DIAGNOSING,
    'WAITING_PARTS': RepairStatus.WAITING_PARTS,
    'WAITING_APPROVAL': RepairStatus.WAITING_APPROVAL,
    'IN_REPAIR': RepairStatus.IN_PROGRESS,
    'QUALITY_CHECK': RepairStatus.IN_PROGRESS,
    'READY': RepairStatus.COMPLETED,
    'DELIVERED': RepairStatus.DELIVERED,
    'CANCELLED': RepairStatus.CANCELLED,
  };
  return statusMap[status] || RepairStatus.RECEIVED;
};

// Status mapping Frontend -> API
const mapRepairStatusToAPIStatus = (status: RepairStatus): string => {
  const statusMap: Record<RepairStatus, string> = {
    [RepairStatus.RECEIVED]: 'RECEIVED',
    [RepairStatus.DIAGNOSING]: 'DIAGNOSING',
    [RepairStatus.WAITING_PARTS]: 'WAITING_PARTS',
    [RepairStatus.WAITING_APPROVAL]: 'WAITING_APPROVAL',
    [RepairStatus.IN_PROGRESS]: 'IN_REPAIR',
    [RepairStatus.AT_PARTNER]: 'IN_REPAIR',
    [RepairStatus.IN_WARRANTY]: 'IN_REPAIR',
    [RepairStatus.COMPLETED]: 'READY',
    [RepairStatus.DELIVERED]: 'DELIVERED',
    [RepairStatus.CANCELLED]: 'CANCELLED',
  };
  return statusMap[status] || 'RECEIVED';
};

// API repair'ı frontend formatına çevir
const mapAPIRepairToRepairRecord = (apiRepair: APIRepair): RepairRecord => ({
  id: apiRepair.id,
  tracking_code: apiRepair.trackingCode,
  customer_name: apiRepair.customerName,
  customer_phone: apiRepair.customerPhone,
  customer_email: apiRepair.customerEmail,
  device_brand: apiRepair.deviceBrand,
  device_model: apiRepair.deviceModel,
  serial_number: apiRepair.serialNumber,
  issue_description: apiRepair.issueDescription,
  status: mapAPIStatusToRepairStatus(apiRepair.status),
  statusHistory: apiRepair.statusHistory?.map(sh => ({
    status: mapAPIStatusToRepairStatus(sh.status),
    timestamp: new Date(sh.createdAt),
    note: sh.note,
    updatedBy: sh.createdBy,
  })) || [],
  technician_notes: apiRepair.technicianNotes,
  assigned_technician_id: apiRepair.technicianId,
  estimated_cost_tl: apiRepair.estimatedCost,
  price_to_customer: apiRepair.finalCost,
  is_warranty_claim: apiRepair.warrantyStatus !== null && apiRepair.warrantyStatus !== undefined,
  warranty_result: apiRepair.warrantyStatus as WarrantyResult | undefined,
  created_at: new Date(apiRepair.receivedAt || apiRepair.createdAt),
  updated_at: new Date(apiRepair.updatedAt),
  completed_at: apiRepair.deliveredAt ? new Date(apiRepair.deliveredAt) : undefined,
});

interface RepairContextType {
  repairRecords: RepairRecord[];
  isLoading: boolean;
  error: string | null;
  createRepairRequest: (data: Omit<RepairRecord, 'id' | 'tracking_code' | 'status' | 'created_at' | 'updated_at' | 'assigned_technician' | 'assigned_technician_id' | 'outsourced_to_partner_id' | 'statusHistory'>) => Promise<RepairRecord>;
  createRepairFromAdmin: (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    device_brand: string;
    device_model: string;
    serial_number?: string;
    issue_description: string;
    estimated_cost_tl?: number;
  }) => Promise<RepairRecord>;
  checkStatus: (trackingCode: string, phoneNumber: string) => Promise<RepairRecord | null>;
  updateRepairStatus: (trackingCode: string, newStatus: RepairStatus, note?: string) => Promise<void>;
  getFilteredRepairs: (filters: RepairFilters) => RepairRecord[];
  
  // ERP Features
  assignTechnician: (trackingCode: string, technicianId: string) => Promise<void>;
  sendToPartner: (trackingCode: string, partnerId: string, estimatedCost: number) => void;
  
  // RMA / Warranty Features
  sendToWarranty: (trackingCode: string, supplierName: string, rmaCode: string) => void;
  concludeWarranty: (trackingCode: string, result: WarrantyResult, notes: string, swapSerial?: string) => void;

  generateServiceLabel: (record: RepairRecord) => void;
  refreshRepairs: () => Promise<void>;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

export const RepairProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Servis kayıtlarını yükle
  const refreshRepairs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await repairsAPI.getAll({ limit: 100 });
      
      if (response.success && response.data?.repairs) {
        const mappedRepairs = response.data.repairs.map(mapAPIRepairToRepairRecord);
        setRepairRecords(mappedRepairs);
      }
    } catch (err) {
      console.error('Failed to fetch repairs:', err);
      setError('Servis kayıtları yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // User değiştiğinde kayıtları yükle
  useEffect(() => {
    if (user) {
      refreshRepairs();
    }
  }, [user, refreshRepairs]);

  /**
   * Müşteri tarafından servis talebi oluşturma
   */
  const createRepairRequest = async (data: any): Promise<RepairRecord> => {
    try {
      const response = await repairsAPI.create({
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        deviceBrand: data.device_brand || 'Unknown',
        deviceModel: data.device_model,
        serialNumber: data.serial_number,
        issueDescription: data.issue_description,
      });
      
      if (response.success && response.data) {
        const newRecord = mapAPIRepairToRepairRecord(response.data);
        setRepairRecords(prev => [newRecord, ...prev]);
        return newRecord;
      }
      
      throw new Error('Servis kaydı oluşturulamadı');
    } catch (err) {
      console.error('Failed to create repair:', err);
      throw err;
    }
  };

  /**
   * Admin tarafından servis kaydı oluşturma
   */
  const createRepairFromAdmin = async (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    device_brand: string;
    device_model: string;
    serial_number?: string;
    issue_description: string;
    estimated_cost_tl?: number;
  }): Promise<RepairRecord> => {
    try {
      const response = await repairsAPI.create({
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        deviceBrand: data.device_brand,
        deviceModel: data.device_model,
        serialNumber: data.serial_number,
        issueDescription: data.issue_description,
      });
      
      if (response.success && response.data) {
        const newRecord = mapAPIRepairToRepairRecord(response.data);
        setRepairRecords(prev => [newRecord, ...prev]);
        return newRecord;
      }
      
      throw new Error('Servis kaydı oluşturulamadı');
    } catch (err) {
      console.error('Failed to create repair:', err);
      throw err;
    }
  };

  /**
   * Takip kodu ile sorgulama (Public API)
   */
  const checkStatus = async (trackingCode: string, phoneNumber: string): Promise<RepairRecord | null> => {
    try {
      const response = await repairsAPI.track(trackingCode.trim());
      
      if (response.success && response.data) {
        const record = mapAPIRepairToRepairRecord(response.data);
        
        // Telefon numarası doğrulaması
        const phone = phoneNumber.replace(/\D/g, '');
        const recordPhone = record.customer_phone.replace(/\D/g, '');
        
        if (recordPhone.includes(phone) || phone.includes(recordPhone.slice(-10))) {
          return record;
        }
        return null;
      }
      
      return null;
    } catch {
      // Yerel kayıtlarda ara
      const code = trackingCode.trim();
      const phone = phoneNumber.replace(/\D/g, '');
      return repairRecords.find(record => {
        const recordPhone = record.customer_phone.replace(/\D/g, '');
        return record.tracking_code === code && recordPhone === phone;
      }) || null;
    }
  };

  /**
   * Durum güncelleme + history ekleme
   */
  const updateRepairStatus = async (trackingCode: string, newStatus: RepairStatus, note?: string) => {
    const record = repairRecords.find(r => r.tracking_code === trackingCode);
    if (!record) return;

    try {
      const response = await repairsAPI.updateStatus(record.id, {
        status: mapRepairStatusToAPIStatus(newStatus),
        note,
      });
      
      if (response.success) {
        setRepairRecords(prev => prev.map(r => {
          if (r.tracking_code !== trackingCode) return r;
          
          const historyEntry: StatusHistoryEntry = {
            status: newStatus,
            timestamp: new Date(),
            note: note || `Durum güncellendi: ${newStatus}`
          };

          const currentHistory = r.statusHistory || [];
          
          return {
            ...r,
            status: newStatus,
            statusHistory: [...currentHistory, historyEntry],
            updated_at: new Date()
          };
        }));
      }
    } catch (err) {
      console.error('Failed to update repair status:', err);
      throw err;
    }
  };

  /**
   * Filtrelenmiş servis kayıtları
   */
  const getFilteredRepairs = (filters: RepairFilters): RepairRecord[] => {
    return repairRecords.filter(record => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          record.tracking_code.toLowerCase().includes(searchLower) ||
          record.customer_name.toLowerCase().includes(searchLower) ||
          record.customer_phone.includes(searchLower) ||
          record.device_model.toLowerCase().includes(searchLower) ||
          (record.device_brand && record.device_brand.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && record.status !== filters.status) {
        return false;
      }

      // Date range
      if (filters.dateFrom) {
        const recordDate = new Date(record.created_at);
        if (recordDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const recordDate = new Date(record.created_at);
        if (recordDate > filters.dateTo) return false;
      }

      return true;
    });
  };

  const assignTechnician = async (trackingCode: string, technicianId: string) => {
    const record = repairRecords.find(r => r.tracking_code === trackingCode);
    if (!record) return;

    try {
      const response = await repairsAPI.updateStatus(record.id, {
        status: 'DIAGNOSING',
        technicianId,
        note: `Teknisyen atandı`,
      });
      
      if (response.success) {
        setRepairRecords(prev => prev.map(r => {
          if (r.tracking_code !== trackingCode) return r;

          const historyEntry: StatusHistoryEntry = {
            status: RepairStatus.DIAGNOSING,
            timestamp: new Date(),
            note: `Teknisyen atandı`
          };

          const currentHistory = r.statusHistory || [];

          return {
            ...r,
            assigned_technician_id: technicianId,
            updated_at: new Date(),
            status: r.status === RepairStatus.RECEIVED ? RepairStatus.DIAGNOSING : r.status,
            statusHistory: [...currentHistory, historyEntry]
          };
        }));
      }
    } catch (err) {
      console.error('Failed to assign technician:', err);
      throw err;
    }
  };

  // Local-only işlemler (API desteği yok henüz)
  const sendToPartner = (trackingCode: string, partnerId: string, estimatedCost: number) => {
    setRepairRecords(prev => prev.map(record => {
      if (record.tracking_code !== trackingCode) return record;

      const currentNotes = Array.isArray(record.technician_notes)
        ? record.technician_notes
        : (record.technician_notes ? [record.technician_notes] : []);

      const historyEntry: StatusHistoryEntry = {
        status: RepairStatus.AT_PARTNER,
        timestamp: new Date(),
        note: `Dış servise gönderildi. Maliyet: ${estimatedCost} TL`
      };

      const currentHistory = record.statusHistory || [];

      return {
        ...record,
        status: RepairStatus.AT_PARTNER,
        outsourced_to_partner_id: partnerId,
        cost_to_us: estimatedCost,
        updated_at: new Date(),
        statusHistory: [...currentHistory, historyEntry],
        technician_notes: [...currentNotes, `Dış servise gönderildi. Maliyet: ${estimatedCost} TL`]
      };
    }));
  };

  const sendToWarranty = (trackingCode: string, supplierName: string, rmaCode: string) => {
    setRepairRecords(prev => prev.map(record => {
      if (record.tracking_code !== trackingCode) return record;

      const currentNotes = Array.isArray(record.technician_notes)
        ? record.technician_notes
        : (record.technician_notes ? [record.technician_notes] : []);

      const historyEntry: StatusHistoryEntry = {
        status: RepairStatus.IN_WARRANTY,
        timestamp: new Date(),
        note: `Tedarikçiye sevk: ${supplierName}, RMA: ${rmaCode}`
      };

      const currentHistory = record.statusHistory || [];

      return {
        ...record,
        status: RepairStatus.IN_WARRANTY,
        is_warranty_claim: true,
        supplier_name: supplierName,
        external_rma_code: rmaCode,
        warranty_result: 'pending',
        updated_at: new Date(),
        statusHistory: [...currentHistory, historyEntry],
        technician_notes: [...currentNotes, `Tedarikçiye (${supplierName}) sevk edildi. Dış Takip No: ${rmaCode}`]
      };
    }));
  };

  const concludeWarranty = (trackingCode: string, result: WarrantyResult, notes: string, swapSerial?: string) => {
    setRepairRecords(prev => prev.map(record => {
      if (record.tracking_code !== trackingCode) return record;

      const currentNotes = Array.isArray(record.technician_notes)
        ? record.technician_notes
        : (record.technician_notes ? [record.technician_notes] : []);

      let nextStatus = RepairStatus.COMPLETED;
      if (result === 'rejected') nextStatus = RepairStatus.IN_PROGRESS;

      const historyEntry: StatusHistoryEntry = {
        status: nextStatus,
        timestamp: new Date(),
        note: `Garanti sonuçlandı: ${result.toUpperCase()}. ${notes}`
      };

      const currentHistory = record.statusHistory || [];

      return {
        ...record,
        status: nextStatus,
        warranty_result: result,
        swap_device_serial: swapSerial,
        updated_at: new Date(),
        statusHistory: [...currentHistory, historyEntry],
        technician_notes: [...currentNotes, `Garanti Sonuçlandı: ${result.toUpperCase()}. Not: ${notes} ${swapSerial ? `(Yeni Seri No: ${swapSerial})` : ''}`]
      };
    }));
  };

  const generateServiceLabel = (record: RepairRecord) => {
    const qrUrl = generateRepairQRLink(record.tracking_code);
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Etiket: ${record.tracking_code}</title>
          <style>
            body { font-family: monospace; padding: 20px; text-align: center; border: 2px dashed #000; margin: 10px; }
            .header { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
            .qr-box { margin: 10px auto; width: 150px; height: 150px; }
            .code { font-size: 24px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; }
            .details { text-align: left; border-top: 1px solid #000; padding-top: 10px; }
            .row { margin-bottom: 5px; display: flex; justify-content: space-between; }
            .key { font-weight: bold; }
            .w-tag { background: #000; color: #fff; padding: 2px 5px; font-size: 12px; margin-top:5px; display:inline-block;}
          </style>
        </head>
        <body>
          <div class="header">NotebookPro Service</div>
          <div class="qr-box">
            <img src="${qrUrl}" width="150" height="150" alt="QR" />
          </div>
          <div class="code">${record.tracking_code}</div>
          <div class="details">
            <div class="row"><span class="key">Model:</span> <span>${record.device_model}</span></div>
            <div class="row"><span class="key">Müşteri:</span> <span>${record.customer_name}</span></div>
            <div class="row"><span class="key">Giriş:</span> <span>${new Date(record.created_at).toLocaleDateString()}</span></div>
            <div class="row"><span class="key">Durum:</span> <span>${record.status}</span></div>
            ${record.is_warranty_claim ? '<div class="w-tag">GARANTİ İŞLEMİ</div>' : ''}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <RepairContext.Provider value={{
      repairRecords,
      isLoading,
      error,
      createRepairRequest,
      createRepairFromAdmin,
      checkStatus,
      updateRepairStatus,
      getFilteredRepairs,
      assignTechnician,
      sendToPartner,
      sendToWarranty,
      concludeWarranty,
      generateServiceLabel,
      refreshRepairs,
    }}>
      {children}
    </RepairContext.Provider>
  );
};

export const useRepair = () => {
  const context = useContext(RepairContext);
  if (!context) {
    throw new Error('useRepair must be used within a RepairProvider');
  }
  return context;
};
