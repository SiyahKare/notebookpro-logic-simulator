import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/pricing';
import CreditCardVisual from '../components/CreditCardVisual';
import { formatCardNumber, formatExpiry, isValidLuhn } from '../utils/payment';
import SEO from '../components/SEO';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, calculateCartTotals, clearCart } = useCart();
  const { placeOrder } = useOrder();
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const baseTotals = calculateCartTotals();

  // Form State
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  
  // Payment State
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Transaction State
  const [installment, setInstallment] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculated Values
  const interestRate = installment === 1 ? 0 : (installment === 3 ? 0.05 : 0.10);
  const finalTotal = baseTotals.grandTotalTL * (1 + interestRate);
  const isLuhnValid = isValidLuhn(cardNumber);
  const showInstallments = cardNumber.replace(/\D/g, '').length >= 6;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) setExpiry(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) {
       setErrorMsg("Lütfen Satış Sözleşmesini onaylayınız.");
       return;
    }
    if (!isLuhnValid) {
      setErrorMsg("Geçersiz Kart Numarası! Lütfen kontrol ediniz.");
      return;
    }
    if (cvv.length < 3) {
      setErrorMsg("CVV kodu eksik.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    // SIMULATION: Fake Bank Transaction
    setTimeout(() => {
      // %90 Success Rate Simulation
      const isApproved = Math.random() > 0.10;

      if (isApproved && user) {
        placeOrder(cartItems, finalTotal, { userId: user.id, name: user.name });
        clearCart();
        setOrderSuccess(true);
      } else {
        setIsProcessing(false);
        setErrorMsg("İşlem Başarısız: Yetersiz Bakiye veya Banka Reddi (Simülasyon).");
      }
    }, 2500);
  };

  if (orderSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${
        actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        <SEO title="Sipariş Onaylandı" />
        <div className={`p-10 rounded-3xl shadow-2xl text-center max-w-md w-full animate-in zoom-in duration-300 ${
          actualTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'
        }`}>
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Siparişiniz Alındı!
          </h2>
          <p className={`mb-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
            Ödeme başarıyla tamamlandı.
          </p>
          <p className={`text-xs mb-8 font-mono ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Ref: {Math.random().toString(36).substring(7).toUpperCase()}
          </p>
          <Link 
            to="/"
            className="block w-full bg-slate-900 dark:bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-600 dark:hover:bg-red-700 transition shadow-lg"
          >
            Alışverişe Dön
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = `w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 ring-red-100 transition ${
    actualTheme === 'dark'
      ? 'bg-slate-700 border-slate-600 text-white focus:border-red-500'
      : 'bg-white border-slate-200 focus:border-red-500'
  }`;

  return (
    <div className={`min-h-screen py-12 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SEO title="Ödeme ve Onay" description="Güvenli ödeme sayfası." />
        <div className="mb-8">
          <Link to="/cart" className={`flex items-center gap-1 text-sm font-medium mb-4 transition ${
            actualTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Sepete Dön
          </Link>
          <h1 className={`text-3xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Güvenli Ödeme
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Forms */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Address Form */}
             <div className={`p-6 rounded-2xl shadow-sm ${
               actualTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'
             }`}>
                <h2 className={`text-lg font-bold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Teslimat Bilgileri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input 
                     placeholder="Şehir" 
                     value={city}
                     onChange={(e) => setCity(e.target.value)}
                     className={inputClass}
                   />
                   <input 
                     placeholder="Açık Adres" 
                     value={address}
                     onChange={(e) => setAddress(e.target.value)}
                     className={`${inputClass} md:col-span-2`}
                   />
                </div>
             </div>

             {/* Payment Form */}
             <div className={`p-6 rounded-2xl shadow-lg relative overflow-hidden ${
               actualTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'
             }`}>
                {/* Interactive Card Visual */}
                <CreditCardVisual 
                  cardNumber={cardNumber}
                  cardHolder={cardHolder}
                  expiry={expiry}
                  cvv={cvv}
                  isFlipped={isFlipped}
                />

                {/* Inputs */}
                <div className="space-y-4 relative z-10">
                  <div>
                     <label className={`block text-xs font-bold mb-1 ml-1 ${
                       actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                     }`}>KART SAHİBİ</label>
                     <div className="relative">
                        <span className={`absolute left-3 top-3 ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        <input 
                          type="text" 
                          className={`${inputClass} pl-10 uppercase`}
                          placeholder="AD SOYAD"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          onFocus={() => setIsFlipped(false)}
                        />
                     </div>
                  </div>

                  <div>
                     <label className={`block text-xs font-bold mb-1 ml-1 ${
                       actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                     }`}>KART NUMARASI</label>
                     <div className="relative">
                        <span className={`absolute left-3 top-3 ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </span>
                        <input 
                          type="text" 
                          className={`${inputClass} pl-10 font-mono ${cardNumber.length === 19 && !isLuhnValid ? 'border-red-500 text-red-600' : ''}`}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          onFocus={() => setIsFlipped(false)}
                        />
                        {cardNumber.length === 19 && isLuhnValid && (
                           <span className="absolute right-3 top-3 text-green-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                           </span>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className={`block text-xs font-bold mb-1 ml-1 ${
                          actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>SON KULLANMA</label>
                        <input 
                          type="text" 
                          className={`${inputClass} text-center font-mono`}
                          placeholder="MM/YY"
                          maxLength={5}
                          value={expiry}
                          onChange={handleExpiryChange}
                          onFocus={() => setIsFlipped(false)}
                        />
                     </div>
                     <div>
                        <label className={`block text-xs font-bold mb-1 ml-1 ${
                          actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>CVV</label>
                        <div className="relative">
                           <input 
                             type="password" 
                             className={`${inputClass} text-center font-mono tracking-widest`}
                             placeholder="***"
                             maxLength={3}
                             value={cvv}
                             onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                             onFocus={() => setIsFlipped(true)}
                           />
                           <span className={`absolute right-3 top-3 ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-300'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                           </span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Installment Table */}
                {showInstallments && (
                   <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
                      <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${
                        actualTheme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`}>
                         <span className="w-2 h-2 rounded-full bg-red-600"></span>
                         Taksit Seçenekleri
                      </h3>
                      <div className={`border rounded-xl overflow-hidden ${
                        actualTheme === 'dark' ? 'border-slate-600' : 'border-slate-200'
                      }`}>
                         <table className="w-full text-sm text-left">
                            <thead className={`text-xs ${
                              actualTheme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-50 text-slate-500'
                            }`}>
                               <tr>
                                  <th className="p-3">Taksit</th>
                                  <th className="p-3">Aylık Ödeme</th>
                                  <th className="p-3 text-right">Toplam</th>
                               </tr>
                            </thead>
                            <tbody>
                               {[
                                 { count: 1, rate: 0, label: 'Tek Çekim' },
                                 { count: 3, rate: 0.05, label: '3 Taksit' },
                                 { count: 6, rate: 0.10, label: '6 Taksit' }
                               ].map(opt => (
                                 <tr 
                                   key={opt.count}
                                   onClick={() => setInstallment(opt.count)}
                                   className={`cursor-pointer border-b transition ${
                                     actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-50'
                                   } ${installment === opt.count 
                                     ? actualTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-50' 
                                     : actualTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                                   }`}
                                 >
                                    <td className={`p-3 font-bold flex items-center gap-2 ${
                                      actualTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                                    }`}>
                                       <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                         installment === opt.count ? 'border-red-600' : actualTheme === 'dark' ? 'border-slate-500' : 'border-slate-300'
                                       }`}>
                                          {installment === opt.count && <div className="w-2 h-2 rounded-full bg-red-600"></div>}
                                       </div>
                                       {opt.label}
                                       {opt.rate > 0 && (
                                         <span className={`text-[10px] ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                           (+%{opt.rate * 100})
                                         </span>
                                       )}
                                    </td>
                                    <td className={`p-3 ${actualTheme === 'dark' ? 'text-slate-300' : ''}`}>
                                      {formatCurrency((baseTotals.grandTotalTL * (1 + opt.rate)) / opt.count)}
                                    </td>
                                    <td className={`p-3 text-right font-bold ${actualTheme === 'dark' ? 'text-white' : ''}`}>
                                      {formatCurrency(baseTotals.grandTotalTL * (1 + opt.rate))}
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:col-span-1">
             <div className={`p-6 rounded-2xl shadow-lg sticky top-24 ${
               actualTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'
             }`}>
                <h3 className={`font-bold text-lg mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Sipariş Özeti
                </h3>
                
                <div className="space-y-2 text-sm mb-6">
                   <div className={`flex justify-between ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                      <span>Ürün Toplamı</span>
                      <span>{formatCurrency(baseTotals.subtotalTL)}</span>
                   </div>
                   <div className={`flex justify-between ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                      <span>KDV</span>
                      <span>{formatCurrency(baseTotals.vatTotalTL)}</span>
                   </div>
                   {interestRate > 0 && (
                     <div className="flex justify-between text-red-600 font-medium bg-red-50 dark:bg-red-900/30 p-2 rounded">
                        <span>Vade Farkı</span>
                        <span>+{formatCurrency(baseTotals.grandTotalTL * interestRate)}</span>
                     </div>
                   )}
                   <div className={`flex justify-between font-bold text-xl pt-4 border-t mt-2 ${
                     actualTheme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-100 text-slate-900'
                   }`}>
                      <span>Ödenecek Tutar</span>
                      <span>{formatCurrency(finalTotal)}</span>
                   </div>
                </div>

                {/* Contract Checkbox */}
                <div className="mb-6">
                  <label className="flex items-start gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow transition-all checked:border-red-600 checked:bg-red-600 hover:shadow-md"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                      />
                      <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <span className={`text-xs leading-tight ${
                      actualTheme === 'dark' ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-700'
                    }`}>
                      <a href="#" className={`underline font-bold ${actualTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Mesafeli Satış Sözleşmesi</a>'ni ve <a href="#" className={`underline font-bold ${actualTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Ön Bilgilendirme Formu</a>'nu okudum, onaylıyorum.
                    </span>
                  </label>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-lg border border-red-200 dark:border-red-800 text-center font-bold animate-pulse">
                     {errorMsg}
                  </div>
                )}

                <button 
                  onClick={handleSubmit}
                  disabled={isProcessing || !isAgreed}
                  className="w-full bg-slate-900 dark:bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-300 dark:shadow-red-900 hover:bg-red-600 dark:hover:bg-red-700 hover:shadow-red-200 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isProcessing ? (
                     <>
                       <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       İşleniyor...
                     </>
                  ) : (
                     <>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       Ödemeyi Tamamla
                     </>
                  )}
                </button>

                <div className={`mt-4 text-center text-[10px] flex items-center justify-center gap-2 ${
                  actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                   </svg>
                   Tüm işlemler 256-bit SSL ile şifrelenmektedir.
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
