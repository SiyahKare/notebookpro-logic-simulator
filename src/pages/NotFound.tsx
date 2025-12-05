import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';

const NotFound: React.FC = () => {
  const { actualTheme } = useTheme();

  return (
    <div className={`min-h-[70vh] flex items-center justify-center px-4 ${
      actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      <SEO title="Sayfa Bulunamadı" />
      <div className="text-center">
        <div className="text-9xl font-black text-red-600 mb-4">404</div>
        <h1 className={`text-3xl font-bold mb-4 ${
          actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Sayfa Bulunamadı
        </h1>
        <p className={`text-lg mb-8 max-w-md mx-auto ${
          actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            to="/products"
            className={`px-6 py-3 font-semibold rounded-xl transition ${
              actualTheme === 'dark'
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Ürünleri İncele
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

