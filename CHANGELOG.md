# 📋 Changelog

Bu dosya, NotebookPro projesindeki tüm önemli değişiklikleri içermektedir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına,
versiyonlama [Semantic Versioning](https://semver.org/spec/v2.0.0.html) standardına uygundur.

---

## [Unreleased]

### 🚀 Planlanıyor
- React Router v6 entegrasyonu
- Backend API bağlantısı
- Gerçek ödeme gateway entegrasyonu

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

