# 📋 Changelog

Bu dosya, NotebookPro projesindeki tüm önemli değişiklikleri içermektedir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına,
versiyonlama [Semantic Versioning](https://semver.org/spec/v2.0.0.html) standardına uygundur.

---

## [Unreleased]

### 🚀 Planlanıyor
- Backend API bağlantısı
- Gerçek ödeme gateway entegrasyonu

---

## [2.0.0] - 2024-12-05

### 🚀 Büyük Güncelleme - React Router & Dark Mode

#### 🛣️ React Router v6 Entegrasyonu
- **BrowserRouter**: URL tabanlı navigasyon sistemi
- **Lazy Loading**: Performans için code splitting
- **Protected Routes**: Rol bazlı sayfa koruması
- **Yeni Sayfalar**:
  - `/products` - Ürün listesi sayfası (filtreleme, arama, sıralama)
  - `/product/:id` - Ürün detay sayfası (breadcrumb, tab'lar, yorumlar)
  - `/dealer` - Bayi Dashboard (özel B2B panel)
  - `/technician` - Teknisyen Dashboard (servis iş takibi)
  - `/404` - Not Found sayfası

#### 🌙 Dark Mode
- **ThemeContext**: Tema yönetim sistemi
- **3 Mod**: Light, Dark, System (otomatik)
- **LocalStorage**: Tema tercihi kalıcılığı
- **Toggle Button**: Navbar'da tema değiştirme butonu
- **Tam Uyumluluk**: Tüm sayfalar ve bileşenler dark mode destekli

#### 📱 PWA Desteği
- **manifest.json**: Progressive Web App manifest
- **Service Worker**: Offline cache ve background sync
- **Install Prompt**: "Ana ekrana ekle" banner'ı
- **Meta Tags**: iOS ve Android uyumlu meta etiketler

#### 🎨 Yeni Bileşenler
- `LoadingSpinner` - Sayfa yüklenme animasyonu
- `Skeleton` - Placeholder bileşenleri
- `ProductCardSkeleton` - Ürün kart placeholder
- `StatCardSkeleton` - İstatistik kart placeholder

#### 🏢 Bayi Dashboard
- Genel bakış istatistikleri
- Sipariş geçmişi
- Ürün kataloğu (bayi fiyatlarıyla)
- Fiyat listesi (Excel export)
- Firma bilgileri

#### 🔧 Teknisyen Dashboard
- Atanan işler listesi
- Servis durumu güncelleme
- Performans metrikleri
- Durum geçmişi görüntüleme

#### ✨ Diğer İyileştirmeler
- Navbar tamamen yenilendi (Link/useNavigate)
- Cart sayfası dark mode desteği eklendi
- Checkout sayfası dark mode desteği eklendi
- Sepet miktar güncelleme fonksiyonu (`updateQuantity`)

### 📝 Dosya Değişiklikleri
- `src/App.tsx` - React Router entegrasyonu
- `src/index.tsx` - BrowserRouter, ThemeProvider eklendi
- `src/context/ThemeContext.tsx` - YENİ
- `src/components/LoadingSpinner.tsx` - YENİ
- `src/components/Skeleton.tsx` - YENİ
- `src/components/Navbar.tsx` - React Router uyumlu
- `src/pages/Products.tsx` - YENİ
- `src/pages/ProductDetail.tsx` - YENİ
- `src/pages/DealerDashboard.tsx` - YENİ
- `src/pages/TechnicianDashboard.tsx` - YENİ
- `src/pages/NotFound.tsx` - YENİ
- `src/pages/Cart.tsx` - Güncellendi
- `src/pages/Checkout.tsx` - Güncellendi
- `src/context/CartContext.tsx` - updateQuantity eklendi
- `public/manifest.json` - YENİ
- `public/sw.js` - YENİ
- `index.html` - PWA meta tags

---

## [1.1.0] - 2024-12-05

### ✨ Admin Panel Geliştirmeleri - Faz 1

#### Dashboard Yenilikleri
- **Bugünün Özeti Kartı**: Günlük sipariş, servis, bekleyen ve kritik stok sayıları gradient tasarımlı hero kartta
- **Hızlı İşlemler**: 4 adet hızlı erişim butonu (Yeni Ürün, Yeni Servis, Siparişler, Bayi Onay)
- **Son Siparişler Widget'ı**: Son 5 siparişi gösteren kompakt liste
- **Son Servis Kayıtları Widget'ı**: Son 5 servis kaydını gösteren kompakt liste
- **Mini Satış Grafiği**: Son 7 günün satış performansını gösteren interaktif bar chart
- **Bekleyen Bayiler Uyarısı**: Onay bekleyen bayileri gösteren alert kartı
- **Geliştirilmiş Kritik Stok Uyarıları**: "Tümünü gör" linki ile filtreye yönlendirme

#### Teknik İyileştirmeler
- `MiniSalesChart` komponenti eklendi
- Dashboard'da gerçek zamanlı tarih gösterimi
- Hover efektleri ve tooltip'ler ile UX iyileştirmesi
- Responsive grid layout optimizasyonu

### 🔔 Bildirim Merkezi (Faz 2)

#### Yeni Özellikler
- **NotificationContext**: Merkezi bildirim yönetimi sistemi
- **Bildirim Tipleri**: Sipariş, Servis, Stok, Bayi, Sistem kategorileri
- **Öncelik Seviyeleri**: Düşük, Orta, Yüksek, Acil öncelik sistemi
- **Navbar Bildirim İkonu**: Okunmamış bildirimleri gösteren animasyonlu zil ikonu
- **Dropdown Bildirim Paneli**: Son 10 bildirimi gösteren kapsamlı dropdown
- **Okundu İşaretleme**: Tek tek veya toplu okundu işaretleme
- **Zaman Gösterimi**: "5 dk önce", "2 saat önce" formatında relative time
- **Demo Bildirimleri**: Otomatik örnek bildirimler (her 30 saniyede %10 olasılık)
- **Mobil Uyumluluk**: Mobil menüde bildirim sayacı

#### Teknik
- `NotificationContext.tsx` oluşturuldu
- `NotificationProvider` App wrapper'a eklendi
- Navbar'a bildirim dropdown'u entegre edildi
- Öncelik bazlı renk kodlaması sistemi

### 📈 Raporlama & Analytics (Faz 3)

#### Yeni Özellikler
- **Reports Tab**: Kapsamlı raporlama sekmesi
- **Dönem Seçici**: Son 7 gün, 30 gün, 90 gün ve tüm zamanlar filtreleme
- **Satış Grafiği**: Günlük satış performansını gösteren interaktif bar chart
- **Özet Kartları**: Toplam ciro, ortalama sepet, servis sayısı, stok değeri
- **En Çok Satan Ürünler**: Top 10 ürün listesi (adet ve ciro bazlı)
- **Kategori Dağılımı**: Kategori bazlı satış dağılımı progress bar'ları
- **Servis Durumu Dağılımı**: RepairStatus bazlı istatistikler
- **En Çok Servis Edilen Markalar**: Marka bazlı servis sayıları
- **Stok Sağlığı**: Toplam ürün, stok, kritik seviye ve tükenen ürünler
- **Sipariş Durumu Özeti**: OrderStatus bazlı sipariş ve ciro dağılımı

#### Teknik
- `ReportsTab` komponenti eklendi
- `useMemo` ile performans optimizasyonları
- Responsive grid layout'lar
- Gradient kartlar ile görsel zenginlik

### 👥 Müşteri Yönetimi (Faz 4)

#### Yeni Özellikler
- **Customers Tab**: Tüm müşterilerin merkezi yönetimi
- **Otomatik Müşteri Birleştirme**: Sipariş ve servislerden müşteri listesi oluşturma
- **Müşteri Arama**: İsim, telefon, e-posta ile filtreleme
- **Müşteri Segmentasyonu**: VIP, Düzenli, Yeni müşteri etiketleri
- **Müşteri Detay Modalı**: Tüm sipariş ve servis geçmişi görüntüleme
- **İstatistik Kartları**: Toplam müşteri, ciro, ortalama harcama, tekrar eden müşteriler
- **Hızlı Eylemler**: WhatsApp ile iletişim, bilgileri kopyalama

#### Teknik
- `CustomersTab` komponenti eklendi
- Sipariş ve servis verilerinden müşteri profili çıkarımı
- Müşteri bazlı toplam harcama hesaplama
- Son aktivite tarihine göre sıralama

### ⚙️ Ayarlar Sekmesi (Faz 5)

#### Yeni Özellikler
- **Settings Tab**: Kapsamlı sistem ayarları sayfası
- **Döviz Ayarları**: Manuel kur girişi, otomatik güncelleme toggle
- **Bildirim Ayarları**: Sipariş, stok, servis, bayi bildirimleri için toggle'lar
- **Firma Bilgileri**: Şirket adı, adres, telefon, vergi bilgileri
- **Sistem Ayarları**: Bakım modu, debug modu, varsayılan kritik stok limiti
- **Tehlikeli Bölge**: Önbellek temizleme, veri sıfırlama, export butonları
- **Sistem Bilgileri**: Versiyon, ortam, güncelleme tarihi gösterimi

#### Teknik
- `SettingsTab` komponenti eklendi
- `useCurrency` hook entegrasyonu ile dinamik kur değişikliği
- Toggle switch'ler için özel Tailwind styling
- Responsive 2-kolon grid layout

### 📥 Excel Import/Export (Faz 6)

#### Yeni Özellikler
- **ImportExportBar**: Ürünler sekmesine eklenen import/export araç çubuğu
- **CSV Export**: Ürünler, siparişler ve servis kayıtlarını CSV olarak dışa aktarma
- **CSV Import**: Ürün verilerini CSV'den toplu içe aktarma
- **Şablon İndirme**: Doğru formatla doldurulacak örnek şablon
- **Dropdown Export Seçici**: Tek tıkla farklı veri tiplerini export etme

#### Teknik
- `ImportExportBar` komponenti eklendi
- FileReader API ile CSV parsing
- BOM karakteri ile UTF-8 encoding desteği
- Noktalı virgül (;) ayraçlı Türkçe uyumlu format

### 📊 Gelişmiş Stok Yönetimi (Faz 7)

#### Yeni Özellikler
- **Stok Hareket Takibi**: Giriş, çıkış, satış, iade, düzeltme hareketleri
- **Stok Geçmişi Modalı**: Her ürün için tüm stok hareketlerini görüntüleme
- **Tıklanabilir Stok Gösterimi**: Ürün tablosunda stok sayısına tıklayarak modal açma
- **Hareket Ekleme Formu**: Modal içinden yeni stok hareketi oluşturma
- **Hareket Referansları**: Sipariş/servis numarası ile hareket ilişkilendirme
- **Otomatik Hareket Kaydı**: Stok güncellemelerinde otomatik hareket oluşturma
- **Demo Veri**: Mock stok hareketleri ile örnek veri

#### Teknik
- `StockMovement` ve `StockMovementType` type'ları eklendi
- ProductContext'e `addStockMovement`, `getProductStockHistory`, `bulkUpdateStock` fonksiyonları eklendi
- `stockMovements` state'i ve demo data generator
- Modal içi real-time stok güncelleme

### 🏷️ Promosyon/Kampanya Yönetimi (Faz 8)

#### Yeni Özellikler
- **Promotions Tab**: Kampanya ve indirim kodu yönetim sekmesi
- **Kampanya Tipleri**: Yüzdelik indirim, sabit indirim, ücretsiz kargo
- **Kampanya Oluşturma Formu**: Kod, ad, tip, değer, limitler, tarihler
- **Kullanım Takibi**: Her kampanyanın kullanım sayısı ve limiti
- **Geçerlilik Kontrolü**: Tarih ve kullanım limiti kontrolü
- **Durum Yönetimi**: Aktif/Pasif toggle, silme işlemleri
- **Kod Kopyalama**: Tek tıkla kampanya kodunu kopyalama
- **İstatistik Kartları**: Toplam, aktif, kullanım, süresi dolan kampanyalar

#### Teknik
- `PromotionsTab` komponenti eklendi
- `Promotion` interface tanımı
- Demo kampanya verileri
- Responsive tablo ve modal tasarım

---

## [1.0.0] - 2024-11-27

### 🎉 İlk Sürüm

Bu sürüm, NotebookPro'nun tam işlevsel MVP (Minimum Viable Product) sürümünü içermektedir.

### ✨ Eklenenler

#### Kullanıcı Yönetimi
- `AuthContext` ile merkezi kimlik doğrulama
- 4 farklı kullanıcı rolü: Admin, Dealer, Technician, Customer
- Bayi onay sistemi (is_approved flag)
- B2B şirket bilgileri desteği (vergi no, ticaret unvanı)
- Demo rol değiştirme özelliği

#### Ürün Yönetimi
- `ProductContext` ile ürün state yönetimi
- SKU ve raf lokasyonu takibi
- Kritik stok uyarı sistemi (critical_limit)
- Çoklu uyumlu model tanımlama
- Bayi indirimi (dealer_discount_percent)
- Ürün yorum ve puanlama sistemi

#### Fiyatlandırma
- Dinamik döviz kuru desteği (USD → TRY)
- Psikolojik fiyatlandırma (.90 formatı)
- KDV hesaplaması (%20)
- B2B özel fiyatlandırma

#### Sepet & Sipariş
- `CartContext` ile sepet yönetimi
- `OrderContext` ile sipariş takibi
- Taksit hesaplama (3/6 ay + vade farkı)
- B2B PDF teklif oluşturma
- Sipariş durumu takibi (Processing → Shipped → Delivered)

#### Servis/Tamir Modülü
- `RepairContext` ile servis yönetimi
- 10 aşamalı iş akışı durumu
- RMA/Garanti sistemi
- Teknisyen atama
- Harici servis partneri yönlendirme
- QR kodlu servis etiketi oluşturma
- Cihaz fotoğrafı yükleme desteği

#### Ödeme Sistemi
- Luhn algoritması ile kart doğrulama
- Kart tipi algılama (Visa, Mastercard, Troy, Amex)
- 3D görsel kredi kartı komponenti
- Taksit tablosu
- %90 başarı oranı simülasyonu

#### UI Bileşenleri
- `Navbar` - Responsive navigasyon
- `ProductCard` - Ürün kartı komponenti
- `AIAssistant` - Chatbot bileşeni
- `AIPartFinder` - AI parça arama
- `RepairTracker` - Servis takip
- `CreditCardVisual` - 3D kart görünümü
- `CookieBanner` - KVKK uyumlu çerez bildirimi
- `SEO` - Meta tag yönetimi
- `Footer` - Site alt bilgi

#### Sayfalar
- `Home` - Ana sayfa (hero, ürün grid, arama)
- `Service` - Servis talebi ve takip
- `Cart` - Sepet yönetimi
- `Checkout` - Ödeme sayfası
- `AdminDashboard` - Yönetim paneli

#### Admin Panel
- Ürün CRUD işlemleri
- Bayi onay yönetimi
- Servis takip merkezi
- Sipariş yönetimi
- Stok uyarıları

#### Teknik
- React 18 + TypeScript kurulumu
- Tailwind CSS entegrasyonu
- Vite build sistemi
- Context API state management
- Tip güvenli kod yapısı

### 🇹🇷 Türkiye Lokalizasyonu
- KDV hesaplaması (%20)
- Troy kart desteği
- WhatsApp entegrasyonu
- KVKK uyumlu çerez politikası
- Türkçe arayüz

---

## [0.1.0] - 2024-11-20

### 🌱 Prototip Sürümü

#### ✨ Eklenenler
- Proje iskelet yapısı
- Temel React komponentleri
- Mock veri yapısı
- Tailwind CSS konfigürasyonu

---

## Versiyon Geçmişi

| Versiyon | Tarih | Açıklama |
|----------|-------|----------|
| 1.0.0 | 2024-11-27 | İlk stabil sürüm |
| 0.1.0 | 2024-11-20 | Prototip |

---

## Katkıda Bulunma

Değişiklik yaparken lütfen aşağıdaki commit mesajı formatını kullanın:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Tipleri

| Tip | Açıklama |
|-----|----------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltme |
| `docs` | Dokümantasyon |
| `style` | Kod formatı (fonksiyonellik değişmez) |
| `refactor` | Kod refaktörü |
| `perf` | Performans iyileştirmesi |
| `test` | Test ekleme/düzeltme |
| `chore` | Build, CI/CD değişiklikleri |

### Örnekler

```bash
feat(cart): add quantity update feature
fix(checkout): resolve payment validation bug
docs(readme): update installation instructions
style(navbar): fix indentation issues
refactor(auth): simplify login logic
perf(products): optimize image loading
test(cart): add unit tests for add to cart
chore(deps): update React to v18.2
```

---

<div align="center">

[← Roadmap](ROADMAP.md) • [Ana Sayfa](README.md)

</div>

