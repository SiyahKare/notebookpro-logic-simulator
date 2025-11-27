
import React, { useState, useEffect } from 'react';

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Add a small delay for better UX (slide-in effect)
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Even if rejected, we save the choice so we don't ask again (GDPR compliance often requires granular control, but this is a simple logic)
    localStorage.setItem('cookieConsent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-slate-900/95 backdrop-blur border-t border-slate-800 shadow-2xl p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Text Content */}
        <div className="flex items-start gap-4">
           <div className="hidden md:flex flex-shrink-0 w-10 h-10 bg-slate-800 rounded-full items-center justify-center text-2xl">
             🍪
           </div>
           <p className="text-sm text-slate-300 leading-relaxed text-center md:text-left">
             Sizlere daha iyi hizmet sunabilmek adına sitemizde çerezler (cookies) kullanılmaktadır. 
             Kişisel verilerinizin işlenmesiyle ilgili detaylı bilgi için <a href="#" className="text-red-500 font-bold hover:text-red-400 hover:underline transition">Çerez Politikamızı</a> ve <a href="#" className="text-red-500 font-bold hover:text-red-400 hover:underline transition">Aydınlatma Metnini</a> inceleyebilirsiniz.
           </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-center">
          <button
            onClick={handleDecline}
            className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-400 text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-500 transition active:scale-95"
          >
            Reddet / Zorunlu
          </button>
          <button
            onClick={handleAccept}
            className="px-8 py-2.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-900/30 hover:bg-red-700 transition transform hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
          >
            Kabul Et
          </button>
        </div>

      </div>
    </div>
  );
};

export default CookieBanner;
