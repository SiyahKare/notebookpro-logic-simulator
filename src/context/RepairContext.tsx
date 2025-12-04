import React, { createContext, useState, useContext, ReactNode } from 'react';
import { RepairRecord, RepairStatus, WarrantyResult, RepairFilters, StatusHistoryEntry } from '../types';
import { mockRepairRecords, mockUsers, mockPartners } from '../data/mockData';
import { generateRepairQRLink } from '../utils/helpers';

interface RepairContextType {
  repairRecords: RepairRecord[];
  createRepairRequest: (data: Omit<RepairRecord, 'id' | 'tracking_code' | 'status' | 'created_at' | 'updated_at' | 'assigned_technician' | 'assigned_technician_id' | 'outsourced_to_partner_id' | 'statusHistory'>) => RepairRecord;
  createRepairFromAdmin: (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    device_brand: string;
    device_model: string;
    serial_number?: string;
    issue_description: string;
    estimated_cost_tl?: number;
  }) => RepairRecord;
  checkStatus: (trackingCode: string, phoneNumber: string) => RepairRecord | null;
  updateRepairStatus: (trackingCode: string, newStatus: RepairStatus, note?: string) => void;
  getFilteredRepairs: (filters: RepairFilters) => RepairRecord[];
  
  // ERP Features
  assignTechnician: (trackingCode: string, technicianId: string) => void;
  sendToPartner: (trackingCode: string, partnerId: string, estimatedCost: number) => void;
  
  // RMA / Warranty Features
  sendToWarranty: (trackingCode: string, supplierName: string, rmaCode: string) => void;
  concludeWarranty: (trackingCode: string, result: WarrantyResult, notes: string, swapSerial?: string) => void;

  generateServiceLabel: (record: RepairRecord) => void;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

// Add statusHistory to mock data
const enhancedMockRepairs: RepairRecord[] = mockRepairRecords.map(r => ({
  ...r,
  statusHistory: [
    { status: RepairStatus.RECEIVED, timestamp: r.created_at, note: 'Cihaz teslim alındı' }
  ]
}));

export const RepairProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>(enhancedMockRepairs);

  const generateTrackingCode = (): string => {
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NB-${year}-${randomPart}`;
  };

  /**
   * Müşteri tarafından servis talebi oluşturma
   */
  const createRepairRequest = (data: any): RepairRecord => {
    const newRecord: RepairRecord = {
      ...data,
      id: `rep_${Date.now()}`,
      tracking_code: generateTrackingCode(),
      status: RepairStatus.RECEIVED,
      statusHistory: [{ status: RepairStatus.RECEIVED, timestamp: new Date(), note: 'Servis talebi oluşturuldu' }],
      created_at: new Date(),
      updated_at: new Date(),
    };

    setRepairRecords(prev => [newRecord, ...prev]);
    return newRecord;
  };

  /**
   * Admin tarafından servis kaydı oluşturma
   */
  const createRepairFromAdmin = (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    device_brand: string;
    device_model: string;
    serial_number?: string;
    issue_description: string;
    estimated_cost_tl?: number;
  }): RepairRecord => {
    const newRecord: RepairRecord = {
      id: `rep_${Date.now()}`,
      tracking_code: generateTrackingCode(),
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      device_brand: data.device_brand,
      device_model: data.device_model,
      serial_number: data.serial_number,
      issue_description: data.issue_description,
      estimated_cost_tl: data.estimated_cost_tl,
      status: RepairStatus.RECEIVED,
      statusHistory: [{ status: RepairStatus.RECEIVED, timestamp: new Date(), note: 'Admin tarafından kayıt oluşturuldu' }],
      created_at: new Date(),
      updated_at: new Date(),
    };

    setRepairRecords(prev => [newRecord, ...prev]);
    return newRecord;
  };

  const checkStatus = (trackingCode: string, phoneNumber: string): RepairRecord | null => {
    const code = trackingCode.trim();
    const phone = phoneNumber.replace(/\D/g, '');
    return repairRecords.find(record => {
      const recordPhone = record.customer_phone.replace(/\D/g, '');
      return record.tracking_code === code && recordPhone === phone;
    }) || null;
  };

  /**
   * Durum güncelleme + history ekleme
   */
  const updateRepairStatus = (trackingCode: string, newStatus: RepairStatus, note?: string) => {
    setRepairRecords(prev => prev.map(record => {
      if (record.tracking_code !== trackingCode) return record;
      
      const historyEntry: StatusHistoryEntry = {
        status: newStatus,
        timestamp: new Date(),
        note: note || `Durum güncellendi: ${newStatus}`
      };

      const currentHistory = record.statusHistory || [];
      
      return {
        ...record,
        status: newStatus,
        statusHistory: [...currentHistory, historyEntry],
        updated_at: new Date()
      };
    }));
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

  const assignTechnician = (trackingCode: string, technicianName: string) => {
    setRepairRecords(prev => prev.map(record => {
      if (record.tracking_code !== trackingCode) return record;

      const historyEntry: StatusHistoryEntry = {
        status: record.status === RepairStatus.RECEIVED ? RepairStatus.DIAGNOSING : record.status,
        timestamp: new Date(),
        note: `Teknisyen atandı: ${technicianName}`
      };

      const currentHistory = record.statusHistory || [];

      return {
        ...record,
        assigned_technician: technicianName,
        updated_at: new Date(),
        status: record.status === RepairStatus.RECEIVED ? RepairStatus.DIAGNOSING : record.status,
        statusHistory: [...currentHistory, historyEntry]
      };
    }));
  };

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
      createRepairRequest,
      createRepairFromAdmin,
      checkStatus,
      updateRepairStatus,
      getFilteredRepairs,
      assignTechnician,
      sendToPartner,
      sendToWarranty,
      concludeWarranty,
      generateServiceLabel
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
