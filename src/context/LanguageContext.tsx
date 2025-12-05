import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Type definitions
export type Language = 'tr' | 'en';

interface Translations {
  [key: string]: {
    tr: string;
    en: string;
  };
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// Translation dictionary
const translations: Translations = {
  // Navigation
  'nav.home': { tr: 'Ana Sayfa', en: 'Home' },
  'nav.store': { tr: 'Mağaza', en: 'Store' },
  'nav.products': { tr: 'Ürünler', en: 'Products' },
  'nav.service': { tr: 'Teknik Servis', en: 'Technical Service' },
  'nav.admin': { tr: 'Yönetim Paneli', en: 'Admin Panel' },
  'nav.cart': { tr: 'Sepet', en: 'Cart' },
  'nav.profile': { tr: 'Profilim', en: 'My Profile' },
  'nav.orders': { tr: 'Siparişlerim', en: 'My Orders' },
  'nav.favorites': { tr: 'Favorilerim', en: 'My Favorites' },
  'nav.contact': { tr: 'İletişim', en: 'Contact' },
  'nav.logout': { tr: 'Çıkış Yap', en: 'Logout' },
  
  // Common
  'common.loading': { tr: 'Yükleniyor...', en: 'Loading...' },
  'common.search': { tr: 'Ara', en: 'Search' },
  'common.filter': { tr: 'Filtrele', en: 'Filter' },
  'common.sort': { tr: 'Sırala', en: 'Sort' },
  'common.all': { tr: 'Tümü', en: 'All' },
  'common.save': { tr: 'Kaydet', en: 'Save' },
  'common.cancel': { tr: 'İptal', en: 'Cancel' },
  'common.delete': { tr: 'Sil', en: 'Delete' },
  'common.edit': { tr: 'Düzenle', en: 'Edit' },
  'common.close': { tr: 'Kapat', en: 'Close' },
  'common.confirm': { tr: 'Onayla', en: 'Confirm' },
  'common.back': { tr: 'Geri', en: 'Back' },
  'common.next': { tr: 'İleri', en: 'Next' },
  'common.yes': { tr: 'Evet', en: 'Yes' },
  'common.no': { tr: 'Hayır', en: 'No' },
  'common.price': { tr: 'Fiyat', en: 'Price' },
  'common.stock': { tr: 'Stok', en: 'Stock' },
  'common.category': { tr: 'Kategori', en: 'Category' },
  'common.details': { tr: 'Detaylar', en: 'Details' },
  'common.status': { tr: 'Durum', en: 'Status' },
  'common.date': { tr: 'Tarih', en: 'Date' },
  
  // Products
  'product.add_to_cart': { tr: 'Sepete Ekle', en: 'Add to Cart' },
  'product.out_of_stock': { tr: 'Tükendi', en: 'Out of Stock' },
  'product.notify_me': { tr: 'Haber Ver', en: 'Notify Me' },
  'product.compatible_models': { tr: 'Uyumlu Modeller', en: 'Compatible Models' },
  'product.reviews': { tr: 'Yorumlar', en: 'Reviews' },
  'product.description': { tr: 'Açıklama', en: 'Description' },
  'product.specifications': { tr: 'Özellikler', en: 'Specifications' },
  'product.related': { tr: 'İlgili Ürünler', en: 'Related Products' },
  'product.all_products': { tr: 'Tüm Ürünler', en: 'All Products' },
  'product.found': { tr: '{count} ürün bulundu', en: '{count} products found' },
  'product.no_results': { tr: 'Ürün bulunamadı', en: 'No products found' },
  'product.last_items': { tr: 'Son {count} adet', en: 'Last {count} items' },
  
  // Categories
  'category.screen': { tr: 'Ekran', en: 'Screen' },
  'category.battery': { tr: 'Batarya', en: 'Battery' },
  'category.keyboard': { tr: 'Klavye', en: 'Keyboard' },
  'category.chipset': { tr: 'Chipset', en: 'Chipset' },
  'category.ram': { tr: 'RAM', en: 'RAM' },
  'category.storage': { tr: 'Depolama', en: 'Storage' },
  'category.motherboard': { tr: 'Anakart', en: 'Motherboard' },
  
  // Cart
  'cart.title': { tr: 'Sepetim', en: 'My Cart' },
  'cart.empty': { tr: 'Sepetiniz boş', en: 'Your cart is empty' },
  'cart.subtotal': { tr: 'Ara Toplam', en: 'Subtotal' },
  'cart.shipping': { tr: 'Kargo', en: 'Shipping' },
  'cart.total': { tr: 'Toplam', en: 'Total' },
  'cart.checkout': { tr: 'Ödemeye Geç', en: 'Checkout' },
  'cart.continue_shopping': { tr: 'Alışverişe Devam Et', en: 'Continue Shopping' },
  'cart.remove': { tr: 'Kaldır', en: 'Remove' },
  'cart.quantity': { tr: 'Adet', en: 'Quantity' },
  'cart.items': { tr: '{count} ürün', en: '{count} items' },
  
  // Checkout
  'checkout.title': { tr: 'Ödeme', en: 'Checkout' },
  'checkout.shipping_info': { tr: 'Teslimat Bilgileri', en: 'Shipping Information' },
  'checkout.payment': { tr: 'Ödeme Bilgileri', en: 'Payment Information' },
  'checkout.summary': { tr: 'Sipariş Özeti', en: 'Order Summary' },
  'checkout.place_order': { tr: 'Siparişi Tamamla', en: 'Place Order' },
  'checkout.card_number': { tr: 'Kart Numarası', en: 'Card Number' },
  'checkout.expiry': { tr: 'Son Kullanma', en: 'Expiry Date' },
  'checkout.cvv': { tr: 'CVV', en: 'CVV' },
  'checkout.name_on_card': { tr: 'Kart Üzerindeki İsim', en: 'Name on Card' },
  
  // Service
  'service.title': { tr: 'Teknik Servis', en: 'Technical Service' },
  'service.track': { tr: 'Servis Takibi', en: 'Track Service' },
  'service.new_request': { tr: 'Yeni Servis Talebi', en: 'New Service Request' },
  'service.tracking_code': { tr: 'Takip Kodu', en: 'Tracking Code' },
  'service.device': { tr: 'Cihaz', en: 'Device' },
  'service.issue': { tr: 'Arıza', en: 'Issue' },
  'service.status.pending': { tr: 'Beklemede', en: 'Pending' },
  'service.status.in_progress': { tr: 'İşlemde', en: 'In Progress' },
  'service.status.completed': { tr: 'Tamamlandı', en: 'Completed' },
  'service.status.delivered': { tr: 'Teslim Edildi', en: 'Delivered' },
  
  // Profile
  'profile.title': { tr: 'Profilim', en: 'My Profile' },
  'profile.personal_info': { tr: 'Kişisel Bilgiler', en: 'Personal Information' },
  'profile.settings': { tr: 'Ayarlar', en: 'Settings' },
  'profile.security': { tr: 'Güvenlik', en: 'Security' },
  'profile.name': { tr: 'Ad Soyad', en: 'Full Name' },
  'profile.email': { tr: 'E-posta', en: 'Email' },
  'profile.phone': { tr: 'Telefon', en: 'Phone' },
  'profile.change_password': { tr: 'Şifre Değiştir', en: 'Change Password' },
  
  // Orders
  'orders.title': { tr: 'Siparişlerim', en: 'My Orders' },
  'orders.empty': { tr: 'Henüz siparişiniz yok', en: 'No orders yet' },
  'orders.view_details': { tr: 'Detayları Gör', en: 'View Details' },
  'orders.status.pending': { tr: 'Beklemede', en: 'Pending' },
  'orders.status.confirmed': { tr: 'Onaylandı', en: 'Confirmed' },
  'orders.status.preparing': { tr: 'Hazırlanıyor', en: 'Preparing' },
  'orders.status.shipped': { tr: 'Kargoya Verildi', en: 'Shipped' },
  'orders.status.delivered': { tr: 'Teslim Edildi', en: 'Delivered' },
  'orders.status.cancelled': { tr: 'İptal Edildi', en: 'Cancelled' },
  
  // Favorites
  'favorites.title': { tr: 'Favorilerim', en: 'My Favorites' },
  'favorites.empty': { tr: 'Favori ürününüz yok', en: 'No favorite products' },
  'favorites.add_all_to_cart': { tr: 'Tümünü Sepete Ekle', en: 'Add All to Cart' },
  'favorites.clear': { tr: 'Temizle', en: 'Clear All' },
  
  // Contact
  'contact.title': { tr: 'İletişim', en: 'Contact Us' },
  'contact.send_message': { tr: 'Mesaj Gönder', en: 'Send Message' },
  'contact.name': { tr: 'Ad Soyad', en: 'Full Name' },
  'contact.subject': { tr: 'Konu', en: 'Subject' },
  'contact.message': { tr: 'Mesajınız', en: 'Your Message' },
  'contact.address': { tr: 'Adres', en: 'Address' },
  
  // Theme
  'theme.light': { tr: 'Açık', en: 'Light' },
  'theme.dark': { tr: 'Koyu', en: 'Dark' },
  'theme.system': { tr: 'Sistem', en: 'System' },
  
  // Footer
  'footer.about': { tr: 'Hakkımızda', en: 'About Us' },
  'footer.terms': { tr: 'Sözleşmeler', en: 'Terms' },
  'footer.privacy': { tr: 'Gizlilik', en: 'Privacy' },
  'footer.support': { tr: 'Destek', en: 'Support' },
  'footer.copyright': { tr: 'Tüm hakları saklıdır.', en: 'All rights reserved.' },
  
  // AI Assistant
  'ai.welcome': { tr: 'Merhaba! Size nasıl yardımcı olabilirim?', en: 'Hello! How can I help you?' },
  'ai.ask_order': { tr: 'Sipariş Sorgula', en: 'Track Order' },
  'ai.ask_service': { tr: 'Servis Takibi', en: 'Track Service' },
  'ai.find_part': { tr: 'Parça Bul', en: 'Find Part' },
  'ai.faq': { tr: 'SSS', en: 'FAQ' },
  
  // Errors
  'error.not_found': { tr: 'Sayfa bulunamadı', en: 'Page not found' },
  'error.generic': { tr: 'Bir hata oluştu', en: 'An error occurred' },
  'error.network': { tr: 'Bağlantı hatası', en: 'Connection error' },
  
  // Success messages
  'success.added_to_cart': { tr: 'Sepete eklendi', en: 'Added to cart' },
  'success.order_placed': { tr: 'Siparişiniz alındı', en: 'Order placed' },
  'success.saved': { tr: 'Kaydedildi', en: 'Saved' },
  'success.message_sent': { tr: 'Mesajınız gönderildi', en: 'Message sent' }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notebookpro_language');
      if (saved === 'en' || saved === 'tr') return saved;
      // Auto-detect browser language
      const browserLang = navigator.language.split('-')[0];
      return browserLang === 'en' ? 'en' : 'tr';
    }
    return 'tr';
  });

  useEffect(() => {
    localStorage.setItem('notebookpro_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function with parameter support
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    let text = translation[language];
    
    // Replace parameters like {count}, {name}, etc.
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Language selector component
export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div className={`flex gap-1 ${className}`}>
      <button
        onClick={() => setLanguage('tr')}
        className={`px-2 py-1 text-xs font-medium rounded transition ${
          language === 'tr' 
            ? 'bg-red-600 text-white' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
        }`}
      >
        🇹🇷 TR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-medium rounded transition ${
          language === 'en' 
            ? 'bg-red-600 text-white' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
        }`}
      >
        🇬🇧 EN
      </button>
    </div>
  );
};

export default LanguageContext;

