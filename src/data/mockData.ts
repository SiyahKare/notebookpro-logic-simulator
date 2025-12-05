
import { Product, User, ServicePartner, RepairRecord, UserRole, ProductCategory, RepairStatus } from '../types/index';

// 1. Cross-Compatible Products
export const mockProducts: Product[] = [
  {
    id: 'p_001',
    sku: 'SCR-156-SLIM-30',
    shelf_location: 'A-12-04',
    name: '15.6" Slim 30-Pin LED Screen (IPS)',
    category: ProductCategory.SCREEN,
    price_usd: 68.00,
    vat_rate: 0.20,
    stock: 45,
    critical_limit: 5,
    compatible_models: ['Asus X550', 'Lenovo Ideapad 320', 'Dell Inspiron 3542', 'HP 15-bs'],
    dealer_discount_percent: 10,
    image_url: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Yüksek kaliteli IPS panel teknolojisi ile mükemmel renk doğruluğu ve geniş görüş açısı sunar. Full HD 1920x1080 çözünürlük, 30 pin EDP bağlantı. LED aydınlatma sistemi ile düşük güç tüketimi.',
    reviews: [
      { id: 'r1', user: 'Mustafa K.', rating: 5, comment: 'Tam uyum sağladı, ölü piksel yok.', date: '2023-10-01' },
      { id: 'r2', user: 'Teknik Bilişim', rating: 4, comment: 'Kargo hızlıydı ama kutu biraz ezikti.', date: '2023-10-05' }
    ]
  },
  {
    id: 'p_002',
    sku: 'BAT-DELL-60W',
    shelf_location: 'B-05-01',
    name: 'Dell 60Wh 4-Cell Battery (Type F3YGT)',
    category: ProductCategory.BATTERY,
    price_usd: 35.50,
    vat_rate: 0.20,
    stock: 3, 
    critical_limit: 5,
    compatible_models: ['Dell Latitude 7480', 'Dell Latitude 7490', 'Dell Latitude 7280'],
    dealer_discount_percent: 15,
    image_url: 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Orijinal Dell batarya özellikleri ile tam uyumluluk. 60Wh kapasite, 4 hücreli Li-Ion teknolojisi. Akıllı şarj devreleri ile uzun ömür ve güvenli kullanım. 500+ şarj döngüsü garantisi.',
    reviews: [
      { id: 'r3', user: 'Caner E.', rating: 5, comment: 'Orijinal kalitesinde, pil ömrü harika.', date: '2023-09-20' }
    ]
  },
  {
    id: 'p_003',
    sku: 'KB-HP-15-TR',
    shelf_location: 'C-22-10',
    name: 'HP Pavilion 15-cb TR Keyboard Backlit',
    category: ProductCategory.KEYBOARD,
    price_usd: 18.25,
    vat_rate: 0.20,
    stock: 120,
    critical_limit: 10,
    compatible_models: ['HP Pavilion 15-cb', 'HP Pavilion 15-ck', 'HP Omen 15-ce'],
    dealer_discount_percent: 10,
    image_url: 'https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Türkçe Q klavye düzeni, LED aydınlatmalı tuşlar. Sessiz ve konforlu tuş hissiyatı. Orijinal HP montaj klipsleri ile kolay takılır. Dayanıklı polimer tuş yapısı.',
    reviews: [
       { id: 'r4', user: 'Servis Noktası', rating: 5, comment: 'Montajı kolay, ışıklandırma sorunsuz.', date: '2023-10-15' },
       { id: 'r5', user: 'Ali V.', rating: 3, comment: 'Tuş hissiyatı orijinalinden biraz sert.', date: '2023-10-18' }
    ]
  },
  {
    id: 'p_004',
    sku: 'CHP-SR40B',
    shelf_location: 'KASA-01',
    name: 'Intel SR40B (i7-8750H) BGA Chipset',
    category: ProductCategory.CHIPSET,
    price_usd: 145.00,
    vat_rate: 0.20,
    stock: 8,
    critical_limit: 2,
    compatible_models: ['MSI GL63', 'Asus FX504', 'Monster Tulpar T7'],
    dealer_discount_percent: 5,
    image_url: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Intel Coffee Lake 8. nesil işlemci. 6 çekirdek, 12 thread, 2.2GHz taban - 4.1GHz turbo frekans. BGA1440 soket tipi, reballing işlemi yapılmış ve test edilmiş.',
    reviews: []
  },
  {
    id: 'p_005',
    sku: 'SSD-NVME-512',
    shelf_location: 'A-08-02',
    name: 'Samsung PM991 512GB NVMe SSD',
    category: ProductCategory.STORAGE,
    price_usd: 42.00,
    vat_rate: 0.20,
    stock: 200,
    critical_limit: 20,
    compatible_models: ['Universal M.2 Slot'],
    dealer_discount_percent: 8,
    image_url: 'https://images.pexels.com/photos/4316/technology-computer-chips-gigabyte.jpg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Samsung OEM SSD, PCIe 3.0 x4 NVMe 1.3 arayüzü. 2400MB/s okuma, 1800MB/s yazma hızı. M.2 2280 form faktörü, TLC NAND flash bellek. 5 yıl garantili.',
    reviews: [
      { id: 'r6', user: 'Gamze Y.', rating: 5, comment: 'Hız testleri mükemmel.', date: '2023-10-22' }
    ]
  },
  // RAM Ürünleri
  {
    id: 'p_006',
    sku: 'RAM-DDR4-8GB',
    shelf_location: 'D-01-05',
    name: 'Samsung 8GB DDR4 2666MHz SODIMM',
    category: ProductCategory.RAM,
    price_usd: 22.00,
    vat_rate: 0.20,
    stock: 150,
    critical_limit: 15,
    compatible_models: ['Universal DDR4 Slot', 'HP EliteBook', 'Dell Latitude', 'Lenovo ThinkPad'],
    dealer_discount_percent: 8,
    image_url: 'https://images.pexels.com/photos/2588757/pexels-photo-2588757.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Samsung orijinal DDR4 RAM modülü. 2666MHz hız, CL19 latency. Notebook için SODIMM form faktörü. Lifetime garanti.',
    reviews: [
      { id: 'r7', user: 'Kerem A.', rating: 5, comment: 'Mükemmel performans, sorunsuz çalışıyor.', date: '2023-11-05' }
    ]
  },
  {
    id: 'p_007',
    sku: 'RAM-DDR4-16GB',
    shelf_location: 'D-01-06',
    name: 'Kingston 16GB DDR4 3200MHz SODIMM',
    category: ProductCategory.RAM,
    price_usd: 38.00,
    vat_rate: 0.20,
    stock: 85,
    critical_limit: 10,
    compatible_models: ['Universal DDR4 Slot', 'ASUS ROG', 'MSI Gaming', 'Monster Notebook'],
    dealer_discount_percent: 10,
    image_url: 'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Kingston Fury Impact serisi gaming RAM. 3200MHz XMP profili, düşük latency. Oyun ve ağır iş yükleri için ideal.',
    reviews: [
      { id: 'r8', user: 'Oğuz K.', rating: 4, comment: 'Oyunlarda performans artışı gözlemledim.', date: '2023-11-10' }
    ]
  },
  // Motherboard Ürünleri
  {
    id: 'p_008',
    sku: 'MB-HP-840G5',
    shelf_location: 'E-03-02',
    name: 'HP EliteBook 840 G5 Anakart (i5-8350U)',
    category: ProductCategory.MOTHERBOARD,
    price_usd: 185.00,
    vat_rate: 0.20,
    stock: 6,
    critical_limit: 2,
    compatible_models: ['HP EliteBook 840 G5', 'HP EliteBook 850 G5'],
    dealer_discount_percent: 5,
    image_url: 'https://images.pexels.com/photos/163125/board-motherboard-chip-hardware-163125.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'HP EliteBook 840 G5 orijinal anakart. Intel i5-8350U işlemci entegreli. Test edilmiş ve garantili. BIOS güncel.',
    reviews: []
  },
  {
    id: 'p_009',
    sku: 'MB-DELL-5590',
    shelf_location: 'E-03-04',
    name: 'Dell Latitude 5590 Anakart (i7-8650U)',
    category: ProductCategory.MOTHERBOARD,
    price_usd: 220.00,
    vat_rate: 0.20,
    stock: 4,
    critical_limit: 2,
    compatible_models: ['Dell Latitude 5590', 'Dell Latitude 5591'],
    dealer_discount_percent: 5,
    image_url: 'https://images.pexels.com/photos/2582928/pexels-photo-2582928.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Dell Latitude 5590 anakart. Intel i7-8650U vPro işlemci. Thunderbolt 3 desteği. Yenilenmiş ve test edilmiş.',
    reviews: [
      { id: 'r9', user: 'Serkan T.', rating: 5, comment: 'Arızalı anakartımı değiştirdim, kusursuz çalışıyor.', date: '2023-11-15' }
    ]
  },
  // Ek Ekranlar
  {
    id: 'p_010',
    sku: 'SCR-140-FHD-40',
    shelf_location: 'A-12-08',
    name: '14.0" FHD 40-Pin LED Screen (IPS, 120Hz)',
    category: ProductCategory.SCREEN,
    price_usd: 85.00,
    vat_rate: 0.20,
    stock: 25,
    critical_limit: 5,
    compatible_models: ['Lenovo ThinkPad T480', 'Dell Latitude 7480', 'HP ProBook 640 G4'],
    dealer_discount_percent: 10,
    image_url: 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: '14 inç Full HD IPS panel. 120Hz yenileme hızı, %100 sRGB renk gamı. İnce çerçeve tasarımı. Gaming ve profesyonel kullanım için ideal.',
    reviews: [
      { id: 'r10', user: 'Burak M.', rating: 5, comment: 'Renk kalitesi muhteşem, 120Hz fark yaratıyor.', date: '2023-12-01' }
    ]
  },
  {
    id: 'p_011',
    sku: 'SCR-173-FHD-30',
    shelf_location: 'A-12-12',
    name: '17.3" FHD 30-Pin LED Screen (TN, 60Hz)',
    category: ProductCategory.SCREEN,
    price_usd: 75.00,
    vat_rate: 0.20,
    stock: 18,
    critical_limit: 3,
    compatible_models: ['HP Omen 17', 'ASUS ROG G703', 'MSI GT75'],
    dealer_discount_percent: 8,
    image_url: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: '17.3 inç Full HD TN panel. 60Hz, hızlı tepki süresi. Gaming notebook\'lar için uygun. Mat ekran kaplaması.',
    reviews: []
  },
  // Ek Bataryalar
  {
    id: 'p_012',
    sku: 'BAT-HP-CI03XL',
    shelf_location: 'B-05-06',
    name: 'HP CI03XL 48Wh Battery (ProBook)',
    category: ProductCategory.BATTERY,
    price_usd: 32.00,
    vat_rate: 0.20,
    stock: 45,
    critical_limit: 8,
    compatible_models: ['HP ProBook 640 G2', 'HP ProBook 650 G2', 'HP ProBook 655 G2'],
    dealer_discount_percent: 12,
    image_url: 'https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'HP CI03XL uyumlu batarya. 48Wh kapasite, 3 hücreli. 4-5 saat kullanım süresi. CE sertifikalı.',
    reviews: [
      { id: 'r11', user: 'Ayşe D.', rating: 4, comment: 'Orijinaliyle aynı performans, fiyatı çok uygun.', date: '2023-12-05' }
    ]
  },
  {
    id: 'p_013',
    sku: 'BAT-LENOVO-T480',
    shelf_location: 'B-05-10',
    name: 'Lenovo ThinkPad T480 72Wh Battery',
    category: ProductCategory.BATTERY,
    price_usd: 48.00,
    vat_rate: 0.20,
    stock: 22,
    critical_limit: 5,
    compatible_models: ['Lenovo ThinkPad T480', 'Lenovo ThinkPad T580', 'Lenovo ThinkPad T470'],
    dealer_discount_percent: 10,
    image_url: 'https://images.pexels.com/photos/5473956/pexels-photo-5473956.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Lenovo ThinkPad 72Wh yüksek kapasiteli batarya. 6+ saat kullanım süresi. Hot-swap desteği. Orijinal kalite.',
    reviews: [
      { id: 'r12', user: 'Emre Y.', rating: 5, comment: 'Tüm gün toplantılarda yetti, harika!', date: '2023-12-10' }
    ]
  },
  // Ek Klavyeler
  {
    id: 'p_014',
    sku: 'KB-DELL-5590-TR',
    shelf_location: 'C-22-15',
    name: 'Dell Latitude 5590 TR Keyboard',
    category: ProductCategory.KEYBOARD,
    price_usd: 24.00,
    vat_rate: 0.20,
    stock: 65,
    critical_limit: 10,
    compatible_models: ['Dell Latitude 5590', 'Dell Latitude 5591', 'Dell Latitude 5580'],
    dealer_discount_percent: 10,
    image_url: 'https://images.pexels.com/photos/1194713/pexels-photo-1194713.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Dell Latitude serisi Türkçe Q klavye. Backlight özellikli. Point stick dahil. Orijinal montaj klipsleri.',
    reviews: [
      { id: 'r13', user: 'Fatma K.', rating: 4, comment: 'Tuş hissiyatı orijinaline çok yakın.', date: '2023-12-12' }
    ]
  },
  {
    id: 'p_015',
    sku: 'KB-LENOVO-T480-TR',
    shelf_location: 'C-22-18',
    name: 'Lenovo ThinkPad T480 TR Keyboard Backlit',
    category: ProductCategory.KEYBOARD,
    price_usd: 28.00,
    vat_rate: 0.20,
    stock: 40,
    critical_limit: 8,
    compatible_models: ['Lenovo ThinkPad T480', 'Lenovo ThinkPad T480s', 'Lenovo ThinkPad T490'],
    dealer_discount_percent: 8,
    image_url: 'https://images.pexels.com/photos/3944405/pexels-photo-3944405.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'ThinkPad T480 Türkçe klavye. LED aydınlatmalı. TrackPoint dahil. Orjinal ThinkPad tuş hissiyatı.',
    reviews: []
  },
  // Ek Depolama
  {
    id: 'p_016',
    sku: 'SSD-NVME-256',
    shelf_location: 'A-08-04',
    name: 'WD SN530 256GB NVMe SSD',
    category: ProductCategory.STORAGE,
    price_usd: 28.00,
    vat_rate: 0.20,
    stock: 180,
    critical_limit: 25,
    compatible_models: ['Universal M.2 Slot'],
    dealer_discount_percent: 10,
    image_url: 'https://images.pexels.com/photos/2588757/pexels-photo-2588757.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'WD SN530 OEM SSD. PCIe 3.0 x4 NVMe. 2400MB/s okuma hızı. M.2 2230/2280 form faktörü.',
    reviews: [
      { id: 'r14', user: 'Murat C.', rating: 5, comment: 'Fiyat/performans oranı mükemmel.', date: '2023-12-15' }
    ]
  },
  {
    id: 'p_017',
    sku: 'SSD-NVME-1TB',
    shelf_location: 'A-08-06',
    name: 'Samsung PM9A1 1TB NVMe SSD (Gen4)',
    category: ProductCategory.STORAGE,
    price_usd: 72.00,
    vat_rate: 0.20,
    stock: 55,
    critical_limit: 10,
    compatible_models: ['Universal M.2 Slot', 'Gen4 NVMe Support Required'],
    dealer_discount_percent: 8,
    image_url: 'https://images.pexels.com/photos/4792733/pexels-photo-4792733.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Samsung PM9A1 (980 Pro OEM). PCIe 4.0 x4, 7000MB/s okuma, 5200MB/s yazma. TLC NAND, DRAM cache.',
    reviews: [
      { id: 'r15', user: 'Can S.', rating: 5, comment: 'İnanılmaz hızlı, boot süresi 8 saniyeye düştü!', date: '2023-12-18' }
    ]
  },
  // Ek Chipsetler
  {
    id: 'p_018',
    sku: 'CHP-AMD-R5',
    shelf_location: 'KASA-02',
    name: 'AMD Ryzen 5 4500U BGA Chipset',
    category: ProductCategory.CHIPSET,
    price_usd: 125.00,
    vat_rate: 0.20,
    stock: 5,
    critical_limit: 2,
    compatible_models: ['HP ProBook 445 G7', 'Lenovo ThinkPad E14 Gen2', 'ASUS VivoBook'],
    dealer_discount_percent: 5,
    image_url: 'https://images.pexels.com/photos/2582932/pexels-photo-2582932.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'AMD Ryzen 5 4500U işlemci. 6 çekirdek, 6 thread. 2.3GHz taban, 4.0GHz boost. Reballing yapılmış.',
    reviews: []
  },
  {
    id: 'p_019',
    sku: 'CHP-SR3LA-i5',
    shelf_location: 'KASA-03',
    name: 'Intel SR3LA (i5-8250U) BGA Chipset',
    category: ProductCategory.CHIPSET,
    price_usd: 95.00,
    vat_rate: 0.20,
    stock: 12,
    critical_limit: 3,
    compatible_models: ['Dell Inspiron 5570', 'HP 15-da', 'Lenovo Ideapad 330'],
    dealer_discount_percent: 5,
    image_url: 'https://images.pexels.com/photos/4195326/pexels-photo-4195326.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'Intel Core i5-8250U işlemci. 4 çekirdek, 8 thread. 1.6GHz taban, 3.4GHz turbo. Test edilmiş ve garantili.',
    reviews: [
      { id: 'r16', user: 'Hakan B.', rating: 5, comment: 'Yanık işlemcili anakartı kurtardık, teşekkürler!', date: '2023-12-20' }
    ]
  },
  {
    id: 'p_020',
    sku: 'GPU-MX150',
    shelf_location: 'KASA-04',
    name: 'NVIDIA GeForce MX150 2GB GDDR5 GPU',
    category: ProductCategory.CHIPSET,
    price_usd: 85.00,
    vat_rate: 0.20,
    stock: 8,
    critical_limit: 2,
    compatible_models: ['ASUS VivoBook S15', 'Lenovo Ideapad 520', 'Acer Swift 3'],
    dealer_discount_percent: 5,
    image_url: 'https://images.pexels.com/photos/2582935/pexels-photo-2582935.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    description: 'NVIDIA MX150 ekran kartı çipi. 2GB GDDR5 VRAM. Pascal mimarisi. BGA reballing yapılmış.',
    reviews: []
  }
];

// 2. Users (Internal & B2B)
export const mockUsers: User[] = [
  {
    id: 'u_admin',
    name: 'System Admin',
    email: 'admin@notebookpro.com',
    phone: '905551112233',
    role: UserRole.ADMIN,
    is_approved: true,
    created_at: new Date('2023-01-01')
  },
  {
    id: 'u_tech_1',
    name: 'Ahmet Usta (Kıdemli)',
    email: 'ahmet@notebookpro.com',
    phone: '905552223344',
    role: UserRole.TECHNICIAN,
    is_approved: true,
    created_at: new Date('2023-02-01')
  },
  {
    id: 'u_tech_2',
    name: 'Mehmet Usta (Stajyer)',
    email: 'mehmet@notebookpro.com',
    phone: '905553334455',
    role: UserRole.TECHNICIAN,
    is_approved: true,
    created_at: new Date('2023-06-01')
  },
  {
    id: 'u_dealer_1',
    name: 'Ege Bilgisayar',
    email: 'info@egepc.com',
    phone: '902324445566',
    role: UserRole.DEALER,
    is_approved: true, 
    company_details: {
      title: 'Ege Bilgisayar Ltd. Şti.',
      taxTitle: 'Ege Bilgisayar Ltd. Şti.',
      tax_office: 'Kordon',
      taxOffice: 'Kordon',
      tax_number: '1234567890',
      taxNumber: '1234567890',
      address: 'İzmir, TR'
    },
    created_at: new Date('2023-03-15')
  },
  {
    id: 'u_dealer_2',
    name: 'Yeni Başvuru Bilişim',
    email: 'contact@yenipc.com',
    phone: '902129998877',
    role: UserRole.DEALER,
    is_approved: false,
    created_at: new Date('2023-10-25')
  }
];

// 3. External Service Partners
export const mockPartners: ServicePartner[] = [
  {
    id: 'part_001',
    name: 'Kartal Anakart Merkezi',
    specialty: ['motherboard', 'gpu_reballing', 'bios_io'],
    phone: '902163334455',
    address: 'Kartal, İstanbul',
    contract_date: new Date('2022-05-20')
  },
  {
    id: 'part_002',
    name: 'Yetkili Panel Servis A.Ş.',
    specialty: ['screen_bonding', 'flex_repair'],
    phone: '902128887766',
    address: 'Mecidiyeköy, İstanbul',
    contract_date: new Date('2021-11-10')
  }
];

// 4. Repair Records
export const mockRepairRecords: RepairRecord[] = [
  {
    id: 'rep_1001',
    tracking_code: 'NB-24-A101',
    customer_name: 'Zeynep Yılmaz',
    customer_phone: '905321112233',
    device_brand: 'Apple',
    device_model: 'MacBook Pro A1708',
    issue_description: 'No power, liquid damage suspected.',
    status: RepairStatus.AT_PARTNER,
    assigned_technician_id: 'u_tech_1',
    assigned_technician: 'Ahmet Usta (Kıdemli)',
    outsourced_to_partner_id: 'part_001',
    cost_to_us: 1500,
    labor_cost: 200,
    price_to_customer: 3500,
    currency_rate_at_time: 34.20,
    created_at: new Date('2023-10-20'),
    technician_notes: ['Liquid indicators red.', 'Sent to partner for chemical cleaning and chipset check.']
  },
  {
    id: 'rep_1002',
    tracking_code: 'NB-24-B202',
    customer_name: 'Ali Veli',
    customer_phone: '905334445566',
    device_brand: 'Lenovo',
    device_model: 'Legion 5',
    issue_description: 'Overheating, fan noise.',
    status: RepairStatus.WAITING_PARTS,
    assigned_technician_id: 'u_tech_2',
    assigned_technician: 'Mehmet Usta (Stajyer)',
    outsourced_to_partner_id: null,
    cost_to_us: 450,
    labor_cost: 500,
    price_to_customer: 1800,
    currency_rate_at_time: 35.00,
    created_at: new Date('2023-10-26'),
    technician_notes: ['Fans ordered.', 'Waiting for shipment.']
  },
  {
    id: 'rep_1003',
    tracking_code: 'NB-24-C303',
    customer_name: 'Kurumsal A.Ş.',
    customer_phone: '902123334444',
    device_brand: 'Dell',
    device_model: 'Latitude 5420',
    issue_description: 'Screen cracked.',
    status: RepairStatus.COMPLETED,
    assigned_technician_id: 'u_tech_1',
    assigned_technician: 'Ahmet Usta (Kıdemli)',
    outsourced_to_partner_id: null,
    cost_to_us: 2200, 
    labor_cost: 300,
    price_to_customer: 3800,
    currency_rate_at_time: 35.00,
    created_at: new Date('2023-10-27'),
    completed_at: new Date('2023-10-28'),
    technician_notes: ['Panel replaced with original IPS.', 'Tests passed.']
  }
];
