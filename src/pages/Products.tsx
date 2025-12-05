import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ProductCategory, UserRole } from '../types';
import SEO from '../components/SEO';

const Products: React.FC = () => {
  const { category } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products } = useProducts();
  const { actualTheme } = useTheme();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { exchangeRate } = useCurrency();

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'name');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const isDealer = user?.role === UserRole.DEALER && user.is_approved;

  // Calculate prices
  const calculatePrice = (priceUsd: number, dealerDiscount?: number) => {
    let price = priceUsd * exchangeRate;
    if (isDealer && dealerDiscount) {
      price = price * (1 - dealerDiscount / 100);
    }
    price = price * 1.20; // KDV
    return Math.floor(price) + 0.90;
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (category && category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.compatible_models.some(m => m.toLowerCase().includes(term))
      );
    }

    // Price filter
    result = result.filter(p => {
      const price = calculatePrice(p.price_usd, p.dealer_discount_percent);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price_usd - b.price_usd);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price_usd - a.price_usd);
        break;
      case 'stock':
        result.sort((a, b) => b.stock - a.stock);
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, category, searchTerm, priceRange, sortBy, isDealer, exchangeRate]);

  const categories = Object.values(ProductCategory);

  return (
    <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <SEO title={category ? `${category.toUpperCase()} Ürünleri` : 'Tüm Ürünler'} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {category ? `${category.toUpperCase()} Ürünleri` : 'Tüm Ürünler'}
          </h1>
          <p className={`mt-2 ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {filteredProducts.length} ürün bulundu
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className={`p-6 rounded-2xl ${
              actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
            } shadow-sm`}>
              <h3 className={`font-bold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Filtreler
              </h3>

              {/* Search */}
              <div className="mb-6">
                <label className={`block text-xs font-bold mb-2 ${
                  actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Ara
                </label>
                <input
                  type="text"
                  placeholder="Ürün, SKU, model..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${
                    actualTheme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600 focus:border-red-500'
                      : 'bg-slate-50 border border-slate-200 focus:border-red-500'
                  }`}
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className={`block text-xs font-bold mb-2 ${
                  actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Kategori
                </label>
                <div className="space-y-2">
                  <Link
                    to="/products"
                    className={`block px-3 py-2 rounded-lg text-sm transition ${
                      !category
                        ? 'bg-red-600 text-white'
                        : actualTheme === 'dark'
                          ? 'text-slate-300 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tümü
                  </Link>
                  {categories.map(cat => (
                    <Link
                      key={cat}
                      to={`/products/${cat}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition ${
                        category === cat
                          ? 'bg-red-600 text-white'
                          : actualTheme === 'dark'
                            ? 'text-slate-300 hover:bg-slate-700'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className={`block text-xs font-bold mb-2 ${
                  actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Sırala
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${
                    actualTheme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <option value="name">İsme Göre</option>
                  <option value="price_asc">Fiyat (Düşük → Yüksek)</option>
                  <option value="price_desc">Fiyat (Yüksek → Düşük)</option>
                  <option value="stock">Stok Durumu</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${
                  actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Fiyat Aralığı
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className={`w-full px-2 py-1.5 rounded text-sm outline-none ${
                      actualTheme === 'dark'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  />
                  <span className={actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className={`w-full px-2 py-1.5 rounded text-sm outline-none ${
                      actualTheme === 'dark'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className={`text-center py-16 rounded-2xl ${
                actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className={`text-xl font-bold mb-2 ${
                  actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Ürün Bulunamadı
                </h3>
                <p className={actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                  Filtreleri değiştirmeyi deneyin
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                  const price = calculatePrice(product.price_usd, product.dealer_discount_percent);
                  const originalPrice = isDealer 
                    ? calculatePrice(product.price_usd, 0)
                    : null;

                  return (
                    <div
                      key={product.id}
                      className={`rounded-2xl overflow-hidden transition-all hover:shadow-xl ${
                        actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
                      } shadow-sm`}
                    >
                      <Link to={`/product/${product.id}`}>
                        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                Stok Tükendi
                              </span>
                            </div>
                          )}
                          {product.stock > 0 && product.stock <= product.critical_limit && (
                            <div className="absolute top-2 right-2">
                              <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                Son {product.stock} adet
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            actualTheme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {product.category.toUpperCase()}
                          </span>
                          <span className={`text-xs font-mono ${
                            actualTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {product.sku}
                          </span>
                        </div>
                        
                        <Link to={`/product/${product.id}`}>
                          <h3 className={`font-semibold mb-3 line-clamp-2 hover:text-red-600 transition ${
                            actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-end justify-between">
                          <div>
                            {isDealer && originalPrice && (
                              <div className="text-xs text-slate-400 line-through">
                                {originalPrice.toLocaleString('tr-TR')}₺
                              </div>
                            )}
                            <div className={`text-xl font-bold ${
                              actualTheme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}>
                              {price.toLocaleString('tr-TR')}₺
                            </div>
                            {isDealer && (
                              <div className="text-xs text-green-600 font-medium">
                                %{product.dealer_discount_percent} bayi indirimi
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className={`p-2 rounded-xl transition ${
                              product.stock === 0
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;

