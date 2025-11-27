
import React from 'react';
import { getCardType } from '../utils/payment';

interface CreditCardVisualProps {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  isFlipped: boolean;
}

const CreditCardVisual: React.FC<CreditCardVisualProps> = ({ cardNumber, cardHolder, expiry, cvv, isFlipped }) => {
  const cardType = getCardType(cardNumber);

  const getLogo = () => {
    switch (cardType) {
      case 'visa': return <span className="font-bold italic text-2xl text-white">VISA</span>;
      case 'mastercard': return (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-red-500 opacity-80"></div>
          <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-80 -ml-4"></div>
        </div>
      );
      case 'troy': return <span className="font-bold text-blue-200 text-xl">TROY</span>;
      default: return <span className="text-xs text-slate-200">BANK CARD</span>;
    }
  };

  return (
    <div className="perspective-1000 w-full h-56 mx-auto mb-8 relative">
      <div 
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        
        {/* FRONT */}
        <div className="absolute w-full h-full backface-hidden rounded-2xl p-6 shadow-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white border border-slate-700 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-red-600 opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-blue-600 opacity-20 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full">
               <div className="flex justify-between items-start">
                  <div className="w-12 h-8 bg-yellow-200 rounded-md bg-opacity-20 border border-yellow-100 border-opacity-30 flex items-center justify-center">
                     <div className="w-8 h-5 border border-yellow-600 rounded-sm opacity-50"></div>
                  </div>
                  {getLogo()}
               </div>

               <div className="mt-4">
                  <div className="text-2xl font-mono tracking-widest shadow-black drop-shadow-md">
                     {cardNumber || '#### #### #### ####'}
                  </div>
               </div>

               <div className="flex justify-between items-end mt-4">
                  <div>
                     <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1">Kart Sahibi</div>
                     <div className="font-medium tracking-wide uppercase truncate max-w-[200px]">
                        {cardHolder || 'AD SOYAD'}
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-1">SKT</div>
                     <div className="font-mono font-bold">
                        {expiry || 'MM/YY'}
                     </div>
                  </div>
               </div>
            </div>
        </div>

        {/* BACK */}
        <div 
          className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl shadow-2xl bg-gradient-to-bl from-slate-800 via-slate-900 to-black text-white border border-slate-700 overflow-hidden"
        >
           <div className="w-full h-10 bg-black mt-6 relative">
             <div className="absolute inset-0 bg-stripes opacity-20"></div>
           </div>
           
           <div className="px-6 mt-6">
              <div className="text-[10px] uppercase text-right text-slate-400 mr-2 mb-1">CVV</div>
              <div className="w-full bg-white text-slate-900 h-10 rounded flex items-center justify-end px-4 font-mono font-bold italic tracking-widest">
                 {cvv || '***'}
              </div>
              <div className="mt-4 text-[10px] text-slate-500 text-center">
                 Bu kart NotebookPro güvencesi altındadır. Sorunlarınız için 0850 000 00 00.
              </div>
           </div>

           <div className="absolute bottom-6 right-6 opacity-50 grayscale">
               {getLogo()}
           </div>
        </div>

      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
};

export default CreditCardVisual;
