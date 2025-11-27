import { Product, ProductCategory, User, UserRole, RepairRecord, RepairStatus } from '../types/index';

export const mockProducts: Product[] = [
  {
    id: 'prod_001',
    sku: 'SCR-156-FHD-IPS',
    name: '15.6" FHD IPS 30-Pin Slim LED Screen',
    category: ProductCategory.SCREEN,
    description: 'High quality replacement panel, matte finish.',
    image_url: 'https://picsum.photos/200/200',
    price_usd: 68.50,
    dealer_discount_percent: 15, // 15% discount for approved dealers
    vat_rate: 0.20,
    stock: 45,
    compatible_models: [
      'Asus X550 Series',
      'Lenovo Ideapad 320-15',
      'HP Pavilion 15-cw',
      'Acer Aspire 5 A515',
      'Dell Inspiron 3580'
    ]
  },
  {
    id: 'prod_002',
    sku: 'KBD-LEN-TP-X1',
    name: 'Lenovo ThinkPad X1 Carbon Gen 6 Keyboard (Backlit)',
    category: ProductCategory.KEYBOARD,
    description: 'Original quality US layout keyboard with backlight.',
    image_url: 'https://picsum.photos/200/201',
    price_usd: 45.00,
    dealer_discount_percent: 10,
    vat_rate: 0.20,
    stock: 12,
    compatible_models: [
      'Lenovo ThinkPad X1 Carbon Gen 6',
      'Lenovo ThinkPad X1 Carbon Gen 5'
    ]
  },
  {
    id: 'prod_003',
    sku: 'BAT-DELL-60W',
    name: 'Dell 4-Cell 60Wh Replacement Battery',
    category: ProductCategory.BATTERY,
    description: 'Long life lithium-ion battery.',
    image_url: 'https://picsum.photos/200/202',
    price_usd: 32.00,
    dealer_discount_percent: 20,
    vat_rate: 0.20,
    stock: 8,
    compatible_models: [
      'Dell XPS 13 9360',
      'Dell XPS 13 9350',
      'Dell Precision 5510'
    ]
  },
  {
    id: 'prod_004',
    sku: 'SSD-NVME-1TB',
    name: 'Samsung 980 PRO 1TB NVMe SSD',
    category: ProductCategory.STORAGE,
    description: 'PCIe Gen 4.0 x4, NVMe 1.3c',
    image_url: 'https://picsum.photos/200/203',
    price_usd: 115.00,
    dealer_discount_percent: 5, // Low margin on brand parts
    vat_rate: 0.20,
    stock: 100,
    compatible_models: [
      'Universal M.2 Slot',
      'Sony PlayStation 5',
      'Generic Laptop',
      'Desktop PC'
    ]
  }
];

export const mockUsers: User[] = [
  {
    id: 'u_admin',
    name: 'System Admin',
    email: 'admin@notebookpro.com',
    phone: '905550000000',
    role: UserRole.ADMIN,
    is_approved: true,
    created_at: new Date('2023-01-01')
  },
  {
    id: 'u_dealer_pending',
    name: 'Teknik Servis LTD (Pending)',
    email: 'info@teknikservis.com',
    phone: '905320000001',
    role: UserRole.DEALER,
    is_approved: false, // Should see regular prices
    company_details: {
      taxTitle: 'Teknik Servis LTD STI',
      taxNumber: '1234567890',
      taxOffice: 'Maslak',
      address: 'Istanbul, TR'
    },
    created_at: new Date('2023-10-05')
  },
  {
    id: 'u_dealer_approved',
    name: 'Mega Bilgisayar (Approved)',
    email: 'satin@megapc.com',
    phone: '905320000002',
    role: UserRole.DEALER,
    is_approved: true, // Should see discounted prices
    company_details: {
      taxTitle: 'Mega Bilgisayar AS',
      taxNumber: '9876543210',
      taxOffice: 'Kadikoy',
      address: 'Istanbul, TR'
    },
    created_at: new Date('2023-06-15')
  },
  {
    id: 'u_customer',
    name: 'Ahmet Yilmaz',
    email: 'ahmet@gmail.com',
    phone: '905050000003',
    role: UserRole.CUSTOMER,
    is_approved: true, // Meaningless for customer, but default true
    created_at: new Date('2023-10-20')
  }
];

export const mockRepairRecords: RepairRecord[] = [
  {
    id: 'rep_101',
    tracking_code: 'NB-2023-8841',
    customer_name: 'Mehmet Demir',
    customer_phone: '905339998877',
    device_brand: 'Apple',
    device_model: 'MacBook Pro A1708',
    issue_description: 'Screen flickers when lid is opened more than 90 degrees (Flexgate).',
    status: RepairStatus.WAITING_APPROVAL,
    estimated_cost_tl: 4500,
    created_at: new Date('2023-10-24T10:00:00'),
    updated_at: new Date('2023-10-25T14:30:00')
  },
  {
    id: 'rep_102',
    tracking_code: 'NB-2023-8842',
    customer_name: 'Ayse Kara',
    customer_phone: '905441112233',
    device_brand: 'HP',
    device_model: 'Victus 16',
    issue_description: 'Overheating and shutting down during games.',
    status: RepairStatus.DIAGNOSING,
    created_at: new Date('2023-10-26T09:15:00'),
    updated_at: new Date('2023-10-26T09:15:00')
  }
];