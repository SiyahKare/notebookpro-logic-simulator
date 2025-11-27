
import React, { useState } from 'react';
import { useRepair } from '../context/RepairContext';
import { RepairRecord, RepairStatus } from '../types';
import { generateWhatsAppLink } from '../utils/whatsapp';

const RepairTracker: React.FC = () => {
  const { checkStatus } = useRepair();
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [record, setRecord] = useState<RepairRecord | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheck = () => {
    setLoading(true);
    setError('');
    setRecord(null);

    setTimeout(() => { // Fake network delay for UX
        const result = checkStatus(code, phone);
        if (result) {
        setRecord(result);
        } else {
        setError('Kayıt bulunamadı. Bilgileri kontrol ediniz.');
        }
        setLoading(false);
    }, 800);
  };

  // Progress Logic
  const getProgress = (status: RepairStatus) => {
    switch (status) {
      case RepairStatus.RECEIVED: return 10;
      case RepairStatus.DIAGNOSING: return 30;
      case RepairStatus.WAITING_PARTS: return 40;
      case RepairStatus.AT_PARTNER: return 45;
      case RepairStatus.IN_WARRANTY: return 50; // Warranty process usually implies it's out of hands but in progress
      case RepairStatus.WAITING_APPROVAL: return 50;
      case RepairStatus.IN_PROGRESS: return 75;
      case RepairStatus.COMPLETED: return 100;
      case RepairStatus.DELIVERED: return 100;
      default: return 0;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Canlı Servis Takibi</h3>
          <p className="text-xs text-slate-400">Cihazınızın son durumunu sorgulayın.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">TAKİP KODU</label>
          <input 
            type="text" 
            placeholder="NB-202X-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-red-500 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">TELEFON NO</label>
          <input 
            type="text" 
            placeholder="5XX XXX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-red-500 transition"
          />
        </div>
        <button 
          onClick={handleCheck}
          disabled={loading}
          className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition shadow-lg shadow-slate-200 disabled:opacity-50"
        >
          {loading ? 'Sorgulanıyor...' : 'Durumu Göster'}
        </button>
      </div>

      {/* Result Area */}
      {error && (
        <div className="mt-4 bg-red-100 text-red-700 text-xs p-3 rounded-lg border border-red-200 text-center">
          {error}
        </div>
      )}

      {record && (
        <div className="mt-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                 <h4 className="font-bold text-slate-800">{record.device_brand} {record.device_model}</h4>
                 <p className="text-xs text-slate-500">{record.issue_description}</p>
              </div>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">
                {record.status.replace('_', ' ')}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
                style={{ width: `${getProgress(record.status)}%` }}
              ></div>
            </div>

            {/* SPECIAL DISPLAY FOR WARRANTY/RMA */}
            {record.status === RepairStatus.IN_WARRANTY && (
                <div className="mb-4 bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <h5 className="text-xs font-bold text-orange-800 uppercase">Yetkili Servis Süreci</h5>
                    </div>
                    <p className="text-xs text-orange-700 leading-relaxed">
                        Cihazınız garantili işlem kapsamında <strong>{record.supplier_name || 'Yetkili Servis'}</strong> firmasına yönlendirilmiştir.
                    </p>
                    {record.external_rma_code && (
                        <div className="mt-2 bg-white p-2 rounded border border-orange-200 inline-block">
                            <span className="text-[10px] text-slate-400 block">Dış Servis Takip No</span>
                            <span className="text-sm font-mono font-bold text-slate-700">{record.external_rma_code}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Proof Photos */}
            {record.device_photos && record.device_photos.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Teslim Anındaki Durum (Kanıt)</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {record.device_photos.map((photo, i) => (
                    <div key={i} className="w-20 h-20 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition">
                      <img src={photo} alt="Device Proof" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <a 
               href={generateWhatsAppLink('905551234567', `Merhaba, ${record.tracking_code} kodlu cihazım hakkında bilgi almak istiyorum.`)}
               target="_blank"
               rel="noreferrer"
               className="block text-center border-2 border-red-600 text-red-600 font-bold py-2 rounded-lg text-xs hover:bg-red-600 hover:text-white transition"
            >
               WhatsApp ile Destek Al
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairTracker;
