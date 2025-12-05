import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { FadeIn } from '../components/AnimatedComponents';
import { formatCurrency, calculateProductPrice } from '../utils/pricing';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const Favorites: React.FC = () => {
  const { favorites, removeFromFavorites, clearFavorites } = useFavorites();
  const { actualTheme } = useTheme();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { exchangeRate } = useCurrency();

  return (
    <>
      <SEO title="Favorilerim" description="Favori ürünlerinizi görüntüleyin" />
      
      <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  ❤️ Favorilerim
                </h1>
                <p className={`${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {favorites.length} ürün kaydedildi
                </p>
              </div>
              
              {favorites.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => favorites.forEach(p => addToCart(p))}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                  >
                    🛒 Tümünü Sepete Ekle
                  </button>
                  <button
                    onClick={clearFavorites}
                    className={`px-4 py-2 rounded-xl font-medium ${
                      actualTheme === 'dark' 
                        ? 'bg-slate-700 text-white hover:bg-slate-600' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } transition`}
                  >
                    🗑️ Temizle
                  </button>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Favorites Grid */}
          {favorites.length === 0 ? (
            <FadeIn delay={100}>
              <div className={`text-center py-16 rounded-2xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-6xl mb-4">💔</div>
                <h3 className={`text-xl font-bold mb-2 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Favori ürününüz yok
                </h3>
                <p className={`mb-6 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Beğendiğiniz ürünleri kalp ikonuna tıklayarak favorilere ekleyin.
                </p>
                <Link to="/products" className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
                  Ürünlere Göz At
                </Link>
              </div>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((product, index) => {
                const pricing = calculateProductPrice(product, user, exchangeRate);
                
                return (
                  <FadeIn key={product.id} delay={index * 50}>
                    <div className={`rounded-2xl overflow-hidden ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm hover:shadow-lg transition group`}>
                      {/* Image */}
                      <div className="relative h-48 bg-slate-50 dark:bg-slate-700 overflow-hidden">
                        <Link to={`/product/${product.id}`}>
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        </Link>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromFavorites(product.id)}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-slate-800/90 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition"
                        >
                          ❤️
                        </button>
                        
                        {/* Stock Badge */}
                        {product.stock <= product.critical_limit && product.stock > 0 && (
                          <div className="absolute bottom-3 left-3 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg dark:bg-orange-900/30 dark:text-orange-400">
                            Son {product.stock} adet
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-lg">
                              Tükendi
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold uppercase ${actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                            {product.category}
                          </span>
                          <span className={`text-xs font-mono ${actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {product.sku}
                          </span>
                        </div>
                        
                        <Link to={`/product/${product.id}`}>
                          <h3 className={`font-semibold mb-2 line-clamp-2 hover:text-red-600 transition ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {product.name}
                          </h3>
                        </Link>
                        
                        <div className={`text-xs mb-3 line-clamp-1 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {product.compatible_models.slice(0, 3).join(', ')}
                        </div>
                        
                        <div className="flex items-end justify-between">
                          <div>
                            <div className={`text-xs ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              Fiyat
                            </div>
                            <div className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {formatCurrency(pricing.finalPriceTL)}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className={`p-3 rounded-xl transition ${
                              product.stock === 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700'
                                : 'bg-slate-900 text-white hover:bg-red-600 dark:bg-slate-700 dark:hover:bg-red-600'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Favorites;

