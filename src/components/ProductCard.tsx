
import React from 'react';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { calculateProductPrice, formatCurrency } from '../utils/pricing';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  matchedModel?: string | null; // Prop for Dynamic Title Logic
}

const ProductCard: React.FC<ProductCardProps> = ({ product, matchedModel }) => {
  const { user, checkDealerAccess } = useAuth();
  const { exchangeRate } = useCurrency();
  const { addToCart } = useCart();
  
  const pricing = calculateProductPrice(product, user, exchangeRate);
  const isDealer = checkDealerAccess();
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      alert("Talebiniz alındı! Ürün stoğa girince size SMS ile bilgi vereceğiz.");
    } else {
      addToCart(product);
    }
  };

  // Calculate Rating
  const rating = product.reviews && product.reviews.length > 0 
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length 
    : 0;
    
  const latestReview = product.reviews && product.reviews.length > 0 ? product.reviews[0] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition duration-300 flex flex-col h-full group">
      {/* Image Area */}
      <div className="relative h-48 bg-slate-50 overflow-hidden p-4 flex items-center justify-center">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className={`object-contain max-h-full transition duration-500 ${isOutOfStock ? 'grayscale opacity-60' : 'group-hover:scale-105'}`}
        />
        {/* Dealer Tag */}
        {isDealer && (
          <div className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
            B2B %{product.dealer_discount_percent}
          </div>
        )}
        
        {isOutOfStock ? (
          <div className="absolute bottom-3 right-3 bg-red-100 px-2 py-1 rounded-lg text-[10px] font-bold text-red-600 border border-red-200">
             Tükendi
          </div>
        ) : (
          <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-medium text-slate-500 border border-slate-100">
            Stok: {product.stock}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-1">
           <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">{product.category}</span>
           {/* Star Rating */}
           {rating > 0 && (
             <div className="flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
               </svg>
               <span className="text-[10px] font-bold text-slate-700">{rating.toFixed(1)}</span>
               <span className="text-[10px] text-slate-400">({product.reviews?.length})</span>
             </div>
           )}
        </div>
        
        {/* Dynamic Title Logic */}
        <h3 className="text-slate-800 font-bold text-sm leading-tight mb-1 line-clamp-2 h-10" title={product.name}>
          {matchedModel ? (
             <span>
               <span className="text-green-600">{matchedModel} Uyumlu</span> {product.name}
             </span>
          ) : (
            product.name
          )}
        </h3>
        
        {/* SKU Display for Warehouse/B2B */}
        <div className="mb-2">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 py-0.5 rounded">
                SKU: {product.sku}
            </span>
        </div>
        
        {/* Compatibility Preview */}
        <div className="text-xs text-slate-400 mb-3 line-clamp-1">
          {product.compatible_models.join(', ')}
        </div>

        {/* Latest Review Snippet (Social Proof) */}
        {latestReview && (
          <div className="mb-4 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
             <p className="text-[10px] text-slate-600 italic line-clamp-1">"{latestReview.comment}"</p>
             <p className="text-[9px] text-slate-400 text-right mt-1">- {latestReview.user}</p>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-50">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              
              {/* Dealer Pricing Logic Viz */}
              {isDealer ? (
                <>
                   <span className="text-xs text-slate-400 line-through decoration-red-300">
                    {formatCurrency(pricing.rawTotalTL / (1 - (product.dealer_discount_percent ? product.dealer_discount_percent/100 : 0)) )}
                   </span>
                   <div className="flex items-center gap-2">
                     <span className="text-xl font-extrabold text-red-600">
                       {formatCurrency(pricing.finalPriceTL)}
                     </span>
                     <span className="text-[10px] text-slate-400 font-mono">+KDV</span>
                   </div>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-400">Satış Fiyatı</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatCurrency(pricing.finalPriceTL)}
                  </span>
                </>
              )}
            </div>
            
            <button 
              onClick={handleAddToCart}
              className={`rounded-xl p-3 shadow-lg transition-all active:scale-95 flex items-center gap-2
                 ${isOutOfStock 
                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-default shadow-none' 
                    : 'bg-slate-900 hover:bg-red-600 text-white shadow-slate-200 hover:shadow-red-200'}`}
            >
              {isOutOfStock ? (
                <span className="text-[10px] font-bold whitespace-nowrap">Haber Ver</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
