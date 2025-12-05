import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ShippingStep {
  status: string;
  location: string;
  timestamp: Date;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface ShippingTrackerProps {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: Date;
  steps?: ShippingStep[];
}

const ShippingTracker: React.FC<ShippingTrackerProps> = ({
  trackingNumber,
  carrier,
  estimatedDelivery,
  steps = []
}) => {
  const { actualTheme } = useTheme();

  // Default steps if not provided
  const defaultSteps: ShippingStep[] = [
    { status: 'Sipariş Alındı', location: 'NotebookPro Merkez', timestamp: new Date(), isCompleted: true, isCurrent: false },
    { status: 'Hazırlanıyor', location: 'NotebookPro Depo', timestamp: new Date(), isCompleted: true, isCurrent: false },
    { status: 'Kargoya Verildi', location: 'İstanbul', timestamp: new Date(), isCompleted: true, isCurrent: false },
    { status: 'Transfer Merkezinde', location: 'Ankara', timestamp: new Date(), isCompleted: false, isCurrent: true },
    { status: 'Dağıtıma Çıktı', location: '', timestamp: new Date(), isCompleted: false, isCurrent: false },
    { status: 'Teslim Edildi', location: '', timestamp: new Date(), isCompleted: false, isCurrent: false }
  ];

  const trackingSteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className={`rounded-2xl p-6 ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className={`text-lg font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            🚚 Kargo Takibi
          </h3>
          <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {carrier} • {trackingNumber}
          </p>
        </div>
        {estimatedDelivery && (
          <div className={`px-4 py-2 rounded-xl ${actualTheme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
            <span className="text-sm font-medium">
              Tahmini Teslimat: {estimatedDelivery.toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {trackingSteps.map((step, index) => (
          <div key={index} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline Line & Dot */}
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center z-10 ${
                step.isCompleted 
                  ? 'bg-green-500' 
                  : step.isCurrent 
                    ? 'bg-blue-500 animate-pulse' 
                    : actualTheme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
              }`}>
                {step.isCompleted && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {index < trackingSteps.length - 1 && (
                <div className={`w-0.5 flex-1 mt-1 ${
                  step.isCompleted 
                    ? 'bg-green-500' 
                    : actualTheme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
                }`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className={`font-medium ${
                step.isCurrent 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : step.isCompleted 
                    ? actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
                    : actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {step.status}
                {step.isCurrent && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                    Şu an burada
                  </span>
                )}
              </div>
              {step.location && (
                <div className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  📍 {step.location}
                </div>
              )}
              {step.isCompleted && (
                <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {step.timestamp.toLocaleString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={`mt-6 pt-4 border-t ${actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-100'} flex flex-wrap gap-2`}>
        <a 
          href={`https://www.${carrier.toLowerCase()}.com.tr/takip/${trackingNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
        >
          🔗 Kargo Sitesinde Takip Et
        </a>
        <button className={`px-4 py-2 rounded-xl text-sm font-medium ${
          actualTheme === 'dark' 
            ? 'bg-slate-700 text-white hover:bg-slate-600' 
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        } transition`}>
          📞 Kargo ile İletişime Geç
        </button>
      </div>
    </div>
  );
};

export default ShippingTracker;

