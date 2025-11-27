
import React, { useState } from 'react';
import { useRepair } from '../context/RepairContext';
import RepairTracker from '../components/RepairTracker';
import SEO from '../components/SEO';

const Service: React.FC = () => {
  const { createRepairRequest } = useRepair();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    device_brand: '',
    device_model: '',
    issue_description: ''
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: string[] = [];
      Array.from(e.target.files).forEach(file => {
        newPhotos.push(URL.createObjectURL(file as File));
      });
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record = createRepairRequest({
      ...formData,
      device_photos: photos
    });
    setSuccessMsg(`Talebiniz Alındı! Takip Kodunuz: ${record.tracking_code}`);
    setFormData({
      customer_name: '',
      customer_phone: '',
      device_brand: '',
      device_model: '',
      issue_description: ''
    });
    setPhotos([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <SEO title="Teknik Servis & Takip" description="NotebookPro teknik servis durumu sorgulama ve yeni kayıt oluşturma." />
       
       <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900">NotebookPro <span className="text-red-600">Servis Noktası</span></h1>
          <p className="text-slate-500 mt-2">Profesyonel onarım hizmeti için talep oluşturun veya mevcut cihazınızı sorgulayın.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left: New Request Form */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 p-8 border border-slate-100">
             <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Yeni Servis Talebi
             </h2>

             {successMsg ? (
               <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                 <div className="text-green-600 font-bold text-lg mb-2">Başarılı!</div>
                 <p className="text-slate-600">{successMsg}</p>
                 <button onClick={() => setSuccessMsg(null)} className="mt-4 text-sm underline text-green-700">Yeni Talep</button>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">AD SOYAD</label>
                       <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-red-500" 
                          value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">TELEFON</label>
                       <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-red-500" 
                          value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">MARKA</label>
                       <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-red-500"
                          value={formData.device_brand} onChange={e => setFormData({...formData, device_brand: e.target.value})} >
                            <option value="">Seçiniz</option>
                            <option value="Apple">Apple</option>
                            <option value="Lenovo">Lenovo</option>
                            <option value="Dell">Dell</option>
                            <option value="HP">HP</option>
                            <option value="Asus">Asus</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">MODEL</label>
                       <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-red-500" 
                          value={formData.device_model} onChange={e => setFormData({...formData, device_model: e.target.value})} />
                    </div>
                  </div>
                  <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">ARIZA DETAYI</label>
                       <textarea required rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-red-500" 
                          value={formData.issue_description} onChange={e => setFormData({...formData, issue_description: e.target.value})} />
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">CİHAZ FOTOĞRAFLARI (Güvenlik İçin)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition relative">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-slate-400 text-sm">
                        <span className="text-red-600 font-bold">Tıklayın</span> veya fotoğrafları buraya sürükleyin
                      </div>
                    </div>
                    {/* Previews */}
                    {photos.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto py-2">
                        {photos.map((src, idx) => (
                          <div key={idx} className="w-16 h-16 flex-shrink-0 rounded-lg border border-slate-200 overflow-hidden">
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-red-600 transition duration-300 shadow-lg">
                    Servis Kaydı Oluştur
                  </button>
               </form>
             )}
          </div>

          {/* Right: Tracker */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 pl-2">
                <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Cihaz Durumu Sorgula
             </h2>
             <RepairTracker />
             
             {/* Info Box */}
             <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">Bilgilendirme</h3>
                <p className="text-sm text-blue-700/80 leading-relaxed">
                  Servise bıraktığınız cihazlarınız, 24 saat güvenlik kamerası ile izlenen laboratuvarımızda işlem görmektedir. 
                  Onayınız olmadan hiçbir parça değişimi yapılmaz.
                </p>
             </div>
          </div>

       </div>
    </div>
  );
};

export default Service;
