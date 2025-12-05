import React from 'react';
import { useTheme } from '../context/ThemeContext';

const LoadingSpinner: React.FC = () => {
  const { actualTheme } = useTheme();
  
  return (
    <div className={`min-h-[60vh] flex items-center justify-center ${
      actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              N
            </div>
          </div>
        </div>
        <p className={`text-sm font-medium animate-pulse ${
          actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Yükleniyor...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

