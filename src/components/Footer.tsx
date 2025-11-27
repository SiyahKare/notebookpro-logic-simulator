
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Column 1: Brand & Contact */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">N</div>
                <span className="text-xl font-bold text-white tracking-tight">Notebook<span className="text-red-600">Pro</span></span>
             </div>
             <p className="text-sm leading-relaxed">
               Türkiye'nin en kapsamlı notebook yedek parça ve teknik servis merkezi. 
               10.000+ ürün stoğu ve profesyonel laboratuvar hizmetleri.
             </p>
             <div className="text-sm space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Perpa Ticaret Merkezi, B Blok Kat: 11 No: 1923, Şişli/İstanbul</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>0850 333 00 11</span>
                </div>
             </div>
          </div>

          {/* Column 2: Corporate */}
          <div>
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Kurumsal</h3>
            <ul className="space-y-3 text-sm">
               <li><a href="#" className="hover:text-red-500 transition">Hakkımızda</a></li>
               <li><a href="#" className="hover:text-red-500 transition">Banka Hesap Bilgileri</a></li>
               <li><a href="#" className="hover:text-red-500 transition">Teknik Servis Süreçleri</a></li>
               <li><a href="#" className="hover:text-red-500 transition">B2B Bayilik Başvurusu</a></li>
               <li><a href="#" className="hover:text-red-500 transition">İletişim & Ulaşım</a></li>
            </ul>
          </div>

          {/* Column 3: Contracts & Legal */}
          <div>
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Sözleşmeler</h3>
            <ul className="space-y-3 text-sm">
               <li><a href="#" className="hover:text-red-500 transition">Mesafeli Satış Sözleşmesi</a></li>
               <li><a href="#" className="hover:text-red-500 transition">İptal ve İade Koşulları</a></li>
               <li><a href="#" className="hover:text-red-500 transition">KVKK Aydınlatma Metni</a></li>
               <li><a href="#" className="hover:text-red-500 transition">Gizlilik Politikası</a></li>
               <li><a href="#" className="hover:text-red-500 transition">Çerez (Cookie) Politikası</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-xs text-slate-600 text-center md:text-left">
             © {new Date().getFullYear()} NotebookPro Teknoloji A.Ş. Tüm hakları saklıdır.
           </p>
           <div className="flex gap-4">
              {/* Payment Icons Simulation */}
              <div className="h-6 w-10 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">VISA</div>
              <div className="h-6 w-10 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">MASTER</div>
              <div className="h-6 w-10 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">TROY</div>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
