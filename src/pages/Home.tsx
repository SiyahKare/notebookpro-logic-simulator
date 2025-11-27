
import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import AIPartFinder from '../components/AIPartFinder';
import ProductCard from '../components/ProductCard';
import RepairTracker from '../components/RepairTracker';
import SEO from '../components/SEO';

const Home: React.FC = () => {
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');

  // Sync local state if products change (e.g. Admin adds one)
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query);
    if (!query) {
      setFilteredProducts(products);
      return;
    }
    
    const lowerQ = query.toLowerCase();
    const results = products.filter(p => 
      p.name.toLowerCase().includes(lowerQ) ||
      p.compatible_models.some(m => m.toLowerCase().includes(lowerQ)) ||
      p.sku.toLowerCase().includes(lowerQ)
    );
    setFilteredProducts(results);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO title="Ana Sayfa" description="Türkiye'nin lider notebook yedek parça ve servis merkezi." />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Text Content */}
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Yeni Nesil Sistem
                 </div>
                 <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                    Teknolojiyi <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">Güvenle</span> Yönet.
                 </h1>
                 <p className="text-slate-500 text-lg max-w-lg">
                    Türkiye'nin en gelişmiş yedek parça ve servis altyapısı. Yapay zeka destekli stok sorgulama ile aradığınızı saniyeler içinde bulun.
                 </p>
                 
                 {/* AI Finder Module */}
                 <div className="pt-4">
                    <AIPartFinder products={products} onSearch={handleSearch} />
                 </div>
              </div>

              {/* Visual / Right Side */}
              <div className="relative hidden lg:block">
                 <div className="absolute -inset-4 bg-gradient-to-r from-red-100 to-slate-100 rounded-full blur-3xl opacity-50"></div>
                 {/* Abstract Tech Illustration Simulator */}
                 <div className="relative grid grid-cols-2 gap-4">
                    <RepairTracker /> {/* Embedding Tracker in Hero for functionality */}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
             {filteredProducts.length === products.length ? 'Haftanın Fırsatları' : 'Arama Sonuçları'}
          </h2>
          <span className="text-sm text-slate-500">{filteredProducts.length} ürün listelendi</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            // Logic to find the "Best Match" model string for Dynamic Titles
            let match: string | null = null;
            if (currentSearchQuery.length > 1) {
               match = product.compatible_models.find(m => 
                 m.toLowerCase().includes(currentSearchQuery.toLowerCase())
               ) || null;
            }

            return (
              <ProductCard 
                key={product.id} 
                product={product} 
                matchedModel={match} // Pass matched string to component
              />
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
             <p className="text-slate-400 text-lg">Aradığınız kriterlere uygun ürün bulunamadı.</p>
             <button onClick={() => handleSearch('')} className="mt-4 text-red-600 font-medium hover:underline">Tüm ürünleri göster</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
