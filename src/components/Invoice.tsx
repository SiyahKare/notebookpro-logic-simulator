import React, { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/pricing';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceProps {
  invoiceNumber: string;
  date: Date;
  dueDate?: Date;
  customerName: string;
  customerAddress: string;
  customerTaxNumber?: string;
  customerTaxOffice?: string;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discount?: number;
  shippingCost?: number;
  total: number;
  isPaid?: boolean;
  paymentMethod?: string;
  notes?: string;
  onClose?: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({
  invoiceNumber,
  date,
  dueDate,
  customerName,
  customerAddress,
  customerTaxNumber,
  customerTaxOffice,
  items,
  subtotal,
  vatRate,
  vatAmount,
  discount = 0,
  shippingCost = 0,
  total,
  isPaid = true,
  paymentMethod,
  notes,
  onClose
}) => {
  const { actualTheme } = useTheme();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = invoiceRef.current?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fatura - ${invoiceNumber}</title>
            <style>
              body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
              th { background: #f8fafc; font-weight: 600; }
              .text-right { text-align: right; }
              .font-bold { font-weight: 700; }
              .text-red { color: #dc2626; }
              @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadPDF = () => {
    // In real app, would use jsPDF or similar
    alert('PDF indirme özelliği backend entegrasyonu ile aktif olacak.');
  };

  return (
    <div className={`rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-xl overflow-hidden`}>
      {/* Header Actions */}
      <div className={`flex justify-between items-center p-4 border-b ${actualTheme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
        <h2 className={`text-lg font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          📄 Fatura #{invoiceNumber}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              actualTheme === 'dark' 
                ? 'bg-slate-700 text-white hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            } transition`}
          >
            🖨️ Yazdır
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition"
          >
            📥 PDF İndir
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                actualTheme === 'dark' 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              } transition`}
            >
              ✕ Kapat
            </button>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="p-6">
        {/* Company Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                N
              </div>
              <div>
                <h1 className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  NotebookPro
                </h1>
                <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Notebook Yedek Parça
                </p>
              </div>
            </div>
            <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              <p>Perpa Ticaret Merkezi, A Blok Kat: 11</p>
              <p>Şişli, İstanbul 34384</p>
              <p>Tel: +90 212 123 45 67</p>
              <p>V.D: Şişli / 1234567890</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-3xl font-bold mb-2 ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
              {isPaid ? 'ÖDENDİ' : 'ÖDEME BEKLENİYOR'}
            </div>
            <div className={`${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              <p className="font-semibold">Fatura No: {invoiceNumber}</p>
              <p>Tarih: {date.toLocaleDateString('tr-TR')}</p>
              {dueDate && <p>Vade: {dueDate.toLocaleDateString('tr-TR')}</p>}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className={`text-sm font-semibold uppercase mb-2 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Fatura Adresi
          </h3>
          <div className={`p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <p className={`font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {customerName}
            </p>
            <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              {customerAddress}
            </p>
            {customerTaxNumber && (
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                V.D: {customerTaxOffice} / {customerTaxNumber}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${actualTheme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Ürün
                </th>
                <th className={`px-4 py-3 text-center text-sm font-semibold ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Adet
                </th>
                <th className={`px-4 py-3 text-right text-sm font-semibold ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Birim Fiyat
                </th>
                <th className={`px-4 py-3 text-right text-sm font-semibold ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={`border-b ${actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                  <td className={`px-4 py-3 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {item.name}
                  </td>
                  <td className={`px-4 py-3 text-center ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.quantity}
                  </td>
                  <td className={`px-4 py-3 text-right ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs">
            <div className={`flex justify-between py-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <span>Ara Toplam</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-2 text-green-600">
                <span>İndirim</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {shippingCost > 0 && (
              <div className={`flex justify-between py-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                <span>Kargo</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
            )}
            <div className={`flex justify-between py-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <span>KDV (%{vatRate})</span>
              <span>{formatCurrency(vatAmount)}</span>
            </div>
            <div className={`flex justify-between py-3 mt-2 border-t-2 ${actualTheme === 'dark' ? 'border-slate-600' : 'border-slate-200'}`}>
              <span className={`text-lg font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Genel Toplam
              </span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {paymentMethod && (
          <div className={`mt-6 p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="font-semibold">Ödeme Yöntemi:</span> {paymentMethod}
            </p>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className={`mt-4 p-4 rounded-xl border-l-4 border-yellow-500 ${actualTheme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
            <p className={`text-sm ${actualTheme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
              <span className="font-semibold">Not:</span> {notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-8 pt-6 border-t ${actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-200'} text-center`}>
          <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            NotebookPro'yu tercih ettiğiniz için teşekkür ederiz!
          </p>
          <p className={`text-xs mt-2 ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Bu fatura elektronik olarak oluşturulmuştur. İade ve değişim için 14 gün içinde bizimle iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;

