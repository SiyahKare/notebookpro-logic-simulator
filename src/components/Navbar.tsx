
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const { cartItems } = useCart();
  const { exchangeRate } = useCurrency();
  const { user, login } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-red-200 shadow-lg">
              N
            </div>
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Notebook<span className="text-red-600">Pro</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Advanced Tech Solutions</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => setView('home')}
              className={`${currentView === 'home' ? 'text-red-600 font-semibold' : 'text-slate-500 hover:text-slate-800'} transition`}
            >
              Mağaza
            </button>
            <button 
              onClick={() => setView('service')}
              className={`${currentView === 'service' ? 'text-red-600 font-semibold' : 'text-slate-500 hover:text-slate-800'} transition`}
            >
              Teknik Servis
            </button>

            {/* ADMIN LINK */}
            {user?.role === 'admin' && (
               <button 
               onClick={() => setView('admin')}
               className={`${currentView === 'admin' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-red-600'} px-3 py-1 rounded-lg font-semibold transition border border-transparent hover:border-red-100`}
             >
               Yönetim Paneli
             </button>
            )}
            
            {/* Currency Badge */}
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              USD: <span className="font-bold text-slate-900">{exchangeRate.toFixed(2)}₺</span>
            </div>

            {/* Cart Icon */}
            <button 
              onClick={() => setView('cart')}
              className="relative p-2 text-slate-500 hover:text-red-600 transition group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile (Simulation Switcher) */}
            <div className="relative group">
               <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-red-600 transition">
                  <span>{user ? user.name.split(' ')[0] : 'Giriş Yap'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
               </button>
               {/* Dropdown for Sim */}
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block p-2">
                  <div className="text-[10px] text-slate-400 px-2 pb-1">SİMÜLASYON MODU</div>
                  <button onClick={() => login('u_admin')} className="block w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-slate-700 rounded-lg">Admin</button>
                  <button onClick={() => login('u_dealer_approved')} className="block w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-slate-700 rounded-lg">Bayi (Onaylı)</button>
                  <button onClick={() => login('u_dealer_pending')} className="block w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-slate-700 rounded-lg">Bayi (Bekleyen)</button>
                  <button onClick={() => login('u_customer')} className="block w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-slate-700 rounded-lg">Son Kullanıcı</button>
               </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4">
          <button onClick={() => setView('home')} className="block w-full text-left font-medium text-slate-700">Mağaza</button>
          <button onClick={() => setView('service')} className="block w-full text-left font-medium text-slate-700">Teknik Servis</button>
          {user?.role === 'admin' && (
             <button onClick={() => setView('admin')} className="block w-full text-left font-medium text-red-600">Yönetim Paneli</button>
          )}
          <button onClick={() => setView('cart')} className="block w-full text-left font-medium text-slate-700">Sepetim ({cartCount})</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
