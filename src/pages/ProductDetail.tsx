import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import SEO from '../components/SEO';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { exchangeRate } = useCurrency();
  const { actualTheme } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');

  const product = products.find(p => p.id === id);
  const isDealer = user?.role === UserRole.DEALER && user.is_approved;

  if (!product) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${
        actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className={`text-2xl font-bold mb-2 ${
            actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Ürün Bulunamadı
          </h2>
          <p className={`mb-4 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Aradığınız ürün mevcut değil.
          </p>
          <Link
            to="/products"
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
          >
            Ürünlere Dön
          </Link>
        </div>
      </div>
    );
  }

  // Calculate prices
  const basePrice = product.price_usd * exchangeRate * 1.20;
  const dealerPrice = isDealer
    ? basePrice * (1 - (product.dealer_discount_percent || 0) / 100)
    : basePrice;
  const finalPrice = Math.floor(dealerPrice) + 0.90;
  const originalPrice = isDealer ? Math.floor(basePrice) + 0.90 : null;

  // Related products
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    navigate('/cart');
  };

  return (
    <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <SEO title={product.name} description={product.description} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link to="/" className={`hover:text-red-600 ${
                actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Ana Sayfa
              </Link>
            </li>
            <li className={actualTheme === 'dark' ? 'text-slate-600' : 'text-slate-300'}>/</li>
            <li>
              <Link to="/products" className={`hover:text-red-600 ${
                actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Ürünler
              </Link>
            </li>
            <li className={actualTheme === 'dark' ? 'text-slate-600' : 'text-slate-300'}>/</li>
            <li>
              <Link to={`/products/${product.category}`} className={`hover:text-red-600 ${
                actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {product.category.toUpperCase()}
              </Link>
            </li>
            <li className={actualTheme === 'dark' ? 'text-slate-600' : 'text-slate-300'}>/</li>
            <li className={actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}>
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Image */}
          <div className={`rounded-3xl overflow-hidden ${
            actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
          } shadow-lg`}>
            <div className="aspect-square relative">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-6 py-2 rounded-full text-lg font-bold">
                    Stok Tükendi
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-sm px-3 py-1 rounded-full ${
                actualTheme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {product.category.toUpperCase()}
              </span>
              <span className={`text-sm font-mono ${
                actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                SKU: {product.sku}
              </span>
            </div>

            <h1 className={`text-3xl font-bold mb-4 ${
              actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {product.name}
            </h1>

            <p className={`text-lg mb-6 ${
              actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {product.description}
            </p>

            {/* Stock Status */}
            <div className={`flex items-center gap-2 mb-6 text-sm ${
              product.stock === 0
                ? 'text-red-600'
                : product.stock <= product.critical_limit
                  ? 'text-amber-600'
                  : 'text-green-600'
            }`}>
              <span className={`w-3 h-3 rounded-full ${
                product.stock === 0 ? 'bg-red-600' :
                product.stock <= product.critical_limit ? 'bg-amber-500' :
                'bg-green-500'
              }`}></span>
              {product.stock === 0 
                ? 'Stok Tükendi'
                : product.stock <= product.critical_limit
                  ? `Son ${product.stock} adet!`
                  : `${product.stock} adet stokta`
              }
            </div>

            {/* Price */}
            <div className={`p-6 rounded-2xl mb-6 ${
              actualTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              {isDealer && originalPrice && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-slate-400 line-through">
                    {originalPrice.toLocaleString('tr-TR')}₺
                  </span>
                  <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">
                    %{product.dealer_discount_percent} bayi indirimi
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${
                  actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {finalPrice.toLocaleString('tr-TR')}₺
                </span>
                <span className={`text-sm ${
                  actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  KDV Dahil
                </span>
              </div>
              <div className={`text-sm mt-2 ${
                actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                ${product.price_usd} × {exchangeRate.toFixed(2)}₺ + %20 KDV
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex items-center rounded-xl overflow-hidden ${
                  actualTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className={`px-4 py-3 font-bold transition ${
                      actualTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                    }`}
                  >
                    -
                  </button>
                  <span className={`px-6 py-3 font-bold ${
                    actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className={`px-4 py-3 font-bold transition ${
                      actualTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                    }`}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Sepete Ekle ({(finalPrice * quantity).toLocaleString('tr-TR')}₺)
                </button>
              </div>
            )}

            {/* Shelf Location */}
            {product.shelf_location && (
              <div className={`flex items-center gap-2 text-sm ${
                actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Raf Konumu: <strong>{product.shelf_location}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={`rounded-2xl overflow-hidden ${
          actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
        } shadow-sm mb-12`}>
          <div className={`flex border-b ${
            actualTheme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}>
            {[
              { id: 'description', label: 'Açıklama' },
              { id: 'specs', label: 'Uyumlu Modeller' },
              { id: 'reviews', label: `Yorumlar (${product.reviews?.length || 0})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === tab.id
                    ? 'text-red-600 border-b-2 border-red-600'
                    : actualTheme === 'dark'
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div className={actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                <p>{product.description || 'Bu ürün için detaylı açıklama henüz eklenmemiştir.'}</p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                <h4 className={`font-bold mb-4 ${
                  actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Bu ürün aşağıdaki modellerle uyumludur:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.compatible_models.map((model, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-sm ${
                        actualTheme === 'dark'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {(!product.reviews || product.reviews.length === 0) ? (
                  <p className={actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                    Henüz yorum yapılmamış.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {product.reviews.map(review => (
                      <div
                        key={review.id}
                        className={`p-4 rounded-xl ${
                          actualTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.user}</span>
                          <span className="text-amber-500">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </span>
                        </div>
                        <p className={actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                          {review.comment}
                        </p>
                        <p className={`text-xs mt-2 ${
                          actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {review.date}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${
              actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Benzer Ürünler
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className={`rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                    actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
                  }`}
                >
                  <div className="aspect-square">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <h4 className={`font-medium text-sm line-clamp-2 ${
                      actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {p.name}
                    </h4>
                    <p className="text-red-600 font-bold mt-1">
                      {(Math.floor(p.price_usd * exchangeRate * 1.20) + 0.90).toLocaleString('tr-TR')}₺
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

