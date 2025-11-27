
import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/pricing';
import { useCurrency } from '../context/CurrencyContext';
import { calculateProductPrice } from '../utils/pricing';
import SEO from '../components/SEO';

interface CartProps {
  setView?: (view: string) => void;
}

const Cart: React.FC<CartProps> = ({ setView }) => {
  const { cartItems, removeFromCart, calculateCartTotals, clearCart } = useCart();
  const { user, checkDealerAccess } = useAuth();
  const { exchangeRate } = useCurrency();
  const totals = calculateCartTotals();

  // Quote Generation Logic
  const handleGenerateQuote = () => {
    const printWindow = window.open('', '', 'width=800,height=1000');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('tr-TR');
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR');

    const itemsHtml = cartItems.map(item => {
        const pricing = calculateProductPrice(item.product, user, exchangeRate);
        // For B2B Quote, we show Unit Price without Tax usually, or just clear breakdown
        const unitPrice = pricing.subtotalTL; 
        const lineTotal = unitPrice * item.quantity;
        
        return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.sku}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(unitPrice)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(lineTotal)}</td>
            </tr>
        `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Teklif Formu - NotebookPro</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #dc2626; pb-20px; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #dc2626; }
            .meta { text-align: right; font-size: 12px; color: #666; }
            .client-info { margin-bottom: 40px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; }
            th { text-align: left; border-bottom: 2px solid #000; padding: 8px; font-weight: bold; }
            .totals { text-align: right; margin-top: 20px; }
            .totals-row { display: flex; justify-content: flex-end; margin-bottom: 5px; font-size: 14px; }
            .totals-row.final { font-size: 18px; font-weight: bold; color: #dc2626; margin-top: 10px; }
            .totals-label { width: 150px; color: #666; }
            .footer { margin-top: 60px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">NotebookPro</div>
            <div class="meta">
                <div>Tarih: ${today}</div>
                <div>Geçerlilik: ${validUntil}</div>
            </div>
          </div>
          
          <div class="client-info">
            <strong>Sayın Yetkili,</strong><br>
            ${user?.company_details?.taxTitle || user?.name}<br>
            ${user?.company_details?.taxNumber ? `VKN: ${user.company_details.taxNumber}` : ''}<br>
            ${user?.company_details?.address || ''}
          </div>

          <table>
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Ürün</th>
                    <th style="text-align: center;">Adet</th>
                    <th style="text-align: right;">Birim Fiyat (KDV Hariç)</th>
                    <th style="text-align: right;">Toplam</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
                <div class="totals-label">Ara Toplam:</div>
                <div>${formatCurrency(totals.subtotalTL)}</div>
            </div>
            <div class="totals-row">
                <div class="totals-label">KDV (%20):</div>
                <div>${formatCurrency(totals.vatTotalTL)}</div>
            </div>
            <div class="totals-row final">
                <div class="totals-label">Genel Toplam:</div>
                <div>${formatCurrency(totals.grandTotalTL)}</div>
            </div>
          </div>

          <div class="footer">
            Bu belge elektronik olarak oluşturulmuştur. NotebookPro Teknoloji A.Ş. | www.notebookpro.com
          </div>
          <script>
             window.print();
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <SEO title="Sepetim" />
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Sepetiniz Boş</h2>
        <p className="text-slate-500 mt-2">Henüz ürün eklemediniz.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO title="Sepetim" description="Alışveriş sepetinizdeki ürünleri inceleyin." />
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Alışveriş Sepeti</h1>
      
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Items */}
        <div className="p-6 space-y-6">
          {cartItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 border-b border-slate-50 pb-6 last:pb-0 last:border-0">
              <div className="w-20 h-20 bg-slate-50 rounded-lg p-2 flex-shrink-0">
                 <img src={item.product.image_url} className="w-full h-full object-contain" alt="" />
              </div>
              <div className="flex-grow">
                 <h3 className="font-bold text-slate-800">{item.product.name}</h3>
                 <p className="text-xs text-slate-500 mt-1">Stok Kodu: {item.product.sku}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">x {item.quantity}</div>
                <button onClick={() => removeFromCart(item.product.id)} className="text-xs text-red-500 hover:underline mt-2">Kaldır</button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-slate-50 p-8 border-t border-slate-100">
           <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between text-slate-500">
                 <span>Ara Toplam</span>
                 <span>{formatCurrency(totals.subtotalTL)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                 <span>KDV (%20)</span>
                 <span>{formatCurrency(totals.vatTotalTL)}</span>
              </div>
              {user?.role === 'dealer' && user.is_approved && (
                 <div className="text-green-600 text-xs text-right font-medium py-1">
                    Bayi İskontosu Uygulanmıştır
                 </div>
              )}
           </div>
           
           {/* B2B Quote Button */}
           {checkDealerAccess() && (
              <div className="mb-4 flex justify-end">
                 <button 
                    onClick={handleGenerateQuote}
                    className="flex items-center gap-2 text-slate-600 bg-white border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 hover:text-slate-900 transition"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Resmi Teklif Al (PDF)
                 </button>
              </div>
           )}

           <div className="flex justify-between items-center border-t border-slate-200 pt-6">
              <div>
                 <span className="block text-xs text-slate-500">Toplam Tutar</span>
                 <span className="text-3xl font-bold text-slate-900">{formatCurrency(totals.grandTotalTL)}</span>
              </div>
              <button 
                onClick={() => setView && setView('checkout')}
                className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition active:scale-95"
              >
                 Ödemeyi Tamamla
              </button>
           </div>
           <button onClick={clearCart} className="w-full text-center text-xs text-slate-400 mt-4 hover:text-slate-600">Sepeti Temizle</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
