import React, { useState } from 'react';
import { useProducts } from '../../context/ProductContext';
import { categoriesAPI } from '../../services/api';
import { Category, SubCategory } from '../../types';

interface CategoriesTabProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ showToast }) => {
  const { categories, refreshCategories } = useProducts();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Forms
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [subCatForm, setSubCatForm] = useState({ name: '' });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;
    setLoading(true);
    try {
      await categoriesAPI.create({ name: catForm.name, description: catForm.description });
      setCatForm({ name: '', description: '' });
      showToast('Kategori başarıyla oluşturuldu!', 'success');
      refreshCategories();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Kategori oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !subCatForm.name) return;
    setLoading(true);
    try {
      await categoriesAPI.createSubCategory(selectedCategory.id, { name: subCatForm.name });
      setSubCatForm({ name: '' });
      showToast('Alt kategori oluşturuldu!', 'success');
      refreshCategories();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Alt kategori oluşturulamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    setLoading(true);
    try {
      await categoriesAPI.delete(id);
      showToast('Kategori silindi!', 'success');
      refreshCategories();
      if (selectedCategory?.id === id) setSelectedCategory(null);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Kategori silinemedi. (İçinde ürün olabilir)', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubCategory = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" alt kategorisini silmek istediğinize emin misiniz?`)) return;
    setLoading(true);
    try {
      await categoriesAPI.deleteSubCategory(id);
      showToast('Alt kategori silindi!', 'success');
      refreshCategories();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Alt kategori silinemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Categories Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-3">Ana Kategoriler</h3>
          
          <form onSubmit={handleCreateCategory} className="flex gap-2 mb-6">
            <input 
              required
              type="text" 
              placeholder="Yeni Kategori Adı..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
              value={catForm.name}
              onChange={e => setCatForm({...catForm, name: e.target.value})}
            />
            <button disabled={loading} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              Ekle
            </button>
          </form>

          {categories.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-sm">Henüz kategori bulunmuyor.</div>
          )}

          <div className="space-y-2">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  selectedCategory?.id === cat.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm">{cat.name}</div>
                  <div className="text-xs text-slate-500">{cat.subCategories?.length || 0} Alt Kategori • {cat._count?.products || 0} Ürün</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SubCategories Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-3">
            {selectedCategory ? `${selectedCategory.name} - Alt Kategorileri` : 'Alt Kategoriler'}
          </h3>
          
          {!selectedCategory ? (
            <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Sol taraftan bir ana kategori seçin
            </div>
          ) : (
            <>
              <form onSubmit={handleCreateSubCategory} className="flex gap-2 mb-6">
                <input 
                  required
                  type="text" 
                  placeholder="Yeni Alt Kategori Adı..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-500"
                  value={subCatForm.name}
                  onChange={e => setSubCatForm({ name: e.target.value })}
                />
                <button disabled={loading} type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                  Ekle
                </button>
              </form>

              {(!selectedCategory.subCategories || selectedCategory.subCategories.length === 0) && (
                <div className="text-center py-6 text-slate-500 text-sm">Bu kategoriye ait alt kategori bulunmuyor.</div>
              )}

              <div className="space-y-2">
                {selectedCategory.subCategories?.map(sub => (
                  <div key={sub.id} className="p-3 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                    <div className="font-medium text-slate-800 text-sm">{sub.name}</div>
                    <button 
                      onClick={() => handleDeleteSubCategory(sub.id, sub.name)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default CategoriesTab;
