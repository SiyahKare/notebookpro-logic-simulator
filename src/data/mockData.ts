
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
    image_url: 'https://picsum.photos/200/200',
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
    image_url: 'https://picsum.photos/200/201',
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
    image_url: 'https://picsum.photos/200/202',
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
    image_url: 'https://picsum.photos/200/203',
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
    image_url: 'https://picsum.photos/200/204',
    reviews: [
      { id: 'r6', user: 'Gamze Y.', rating: 5, comment: 'Hız testleri mükemmel.', date: '2023-10-22' }
    ]
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
