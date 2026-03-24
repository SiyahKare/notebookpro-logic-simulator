import { PrismaClient, UserRole, ProductCategory, CouponType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PostgreSQL database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@notebookpro.com' },
    update: {},
    create: {
      email: 'admin@notebookpro.com',
      password: adminPassword,
      name: 'System Admin',
      phone: '905551112233',
      role: UserRole.ADMIN,
      isApproved: true,
      isActive: true
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // Create technician
  const techPassword = await bcrypt.hash('tech123', 12);
  const tech = await prisma.user.upsert({
    where: { email: 'ahmet@notebookpro.com' },
    update: {},
    create: {
      email: 'ahmet@notebookpro.com',
      password: techPassword,
      name: 'Ahmet Usta',
      phone: '905552223344',
      role: UserRole.TECHNICIAN,
      isApproved: true,
      isActive: true
    }
  });
  console.log('✅ Technician created:', tech.email);

  // Create dealer
  const dealerPassword = await bcrypt.hash('dealer123', 12);
  const dealer = await prisma.user.upsert({
    where: { email: 'info@egepc.com' },
    update: {},
    create: {
      email: 'info@egepc.com',
      password: dealerPassword,
      name: 'Ege Bilgisayar',
      phone: '902324445566',
      role: UserRole.DEALER,
      isApproved: true,
      isActive: true,
      companyTitle: 'Ege Bilgisayar Ltd. Şti.',
      taxOffice: 'Kordon',
      taxNumber: '1234567890'
    }
  });
  console.log('✅ Dealer created:', dealer.email);

  // Create customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'ali@gmail.com' },
    update: {},
    create: {
      email: 'ali@gmail.com',
      password: customerPassword,
      name: 'Ali Yılmaz',
      phone: '905559998877',
      role: UserRole.CUSTOMER,
      isApproved: true,
      isActive: true
    }
  });
  console.log('✅ Customer created:', customer.email);

  // Create products
  const products = [
    {
      sku: 'SCR-156-SLIM-30',
      name: '15.6" Slim 30-Pin LED Screen (IPS)',
      category: ProductCategory.SCREEN,
      priceUsd: 68.00,
      stock: 45,
      criticalLimit: 5,
      dealerDiscountPercent: 10,
      shelfLocation: 'A-12-04',
      imageUrl: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'IPS panel, Full HD 1920x1080, 30 pin EDP',
      compatibleModels: ['Asus X550', 'Lenovo Ideapad 320', 'Dell Inspiron 3542', 'HP 15-bs']
    },
    {
      sku: 'BAT-DELL-60W',
      name: 'Dell 60Wh 4-Cell Battery (Type F3YGT)',
      category: ProductCategory.BATTERY,
      priceUsd: 35.50,
      stock: 3,
      criticalLimit: 5,
      dealerDiscountPercent: 15,
      shelfLocation: 'B-05-01',
      imageUrl: 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: '60Wh, 4 hücreli Li-Ion',
      compatibleModels: ['Dell Latitude 7480', 'Dell Latitude 7490']
    },
    {
      sku: 'KB-HP-15-TR',
      name: 'HP Pavilion 15-cb TR Keyboard Backlit',
      category: ProductCategory.KEYBOARD,
      priceUsd: 18.25,
      stock: 120,
      criticalLimit: 10,
      dealerDiscountPercent: 10,
      shelfLocation: 'C-22-10',
      imageUrl: 'https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Türkçe Q, LED aydınlatmalı',
      compatibleModels: ['HP Pavilion 15-cb', 'HP Pavilion 15-ck']
    },
    {
      sku: 'CHP-SR40B',
      name: 'Intel SR40B (i7-8750H) BGA Chipset',
      category: ProductCategory.CHIPSET,
      priceUsd: 145.00,
      stock: 8,
      criticalLimit: 2,
      dealerDiscountPercent: 5,
      shelfLocation: 'KASA-01',
      imageUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Intel Coffee Lake, 6 çekirdek, 12 thread',
      compatibleModels: ['MSI GL63', 'Asus FX504', 'Monster Tulpar T7']
    },
    {
      sku: 'RAM-DDR4-8GB',
      name: 'Samsung 8GB DDR4 2666MHz SODIMM',
      category: ProductCategory.RAM,
      priceUsd: 22.00,
      stock: 150,
      criticalLimit: 15,
      dealerDiscountPercent: 8,
      shelfLocation: 'D-01-05',
      imageUrl: 'https://images.pexels.com/photos/2588757/pexels-photo-2588757.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'DDR4 2666MHz, CL19',
      compatibleModels: ['Universal DDR4 Slot']
    },
    {
      sku: 'RAM-DDR4-16GB',
      name: 'Kingston 16GB DDR4 3200MHz SODIMM',
      category: ProductCategory.RAM,
      priceUsd: 38.00,
      stock: 85,
      criticalLimit: 10,
      dealerDiscountPercent: 10,
      shelfLocation: 'D-01-06',
      imageUrl: 'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'DDR4 3200MHz XMP, Gaming RAM',
      compatibleModels: ['Universal DDR4 Slot', 'ASUS ROG', 'MSI Gaming']
    },
    {
      sku: 'SSD-NVME-512',
      name: 'Samsung PM991 512GB NVMe SSD',
      category: ProductCategory.STORAGE,
      priceUsd: 42.00,
      stock: 200,
      criticalLimit: 20,
      dealerDiscountPercent: 8,
      shelfLocation: 'A-08-02',
      imageUrl: 'https://images.pexels.com/photos/4316/technology-computer-chips-gigabyte.jpg?auto=compress&cs=tinysrgb&w=400',
      description: 'PCIe 3.0 x4 NVMe, 2400MB/s okuma',
      compatibleModels: ['Universal M.2 Slot']
    },
    {
      sku: 'SSD-NVME-1TB',
      name: 'Samsung PM9A1 1TB NVMe SSD (Gen4)',
      category: ProductCategory.STORAGE,
      priceUsd: 72.00,
      stock: 55,
      criticalLimit: 10,
      dealerDiscountPercent: 8,
      shelfLocation: 'A-08-06',
      imageUrl: 'https://images.pexels.com/photos/4792733/pexels-photo-4792733.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'PCIe 4.0 x4, 7000MB/s okuma, 5200MB/s yazma',
      compatibleModels: ['Universal M.2 Slot', 'Gen4 NVMe Support Required']
    },
    {
      sku: 'MB-HP-840G5',
      name: 'HP EliteBook 840 G5 Anakart (i5-8350U)',
      category: ProductCategory.MOTHERBOARD,
      priceUsd: 185.00,
      stock: 6,
      criticalLimit: 2,
      dealerDiscountPercent: 5,
      shelfLocation: 'E-03-02',
      imageUrl: 'https://images.pexels.com/photos/163125/board-motherboard-chip-hardware-163125.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'HP EliteBook 840 G5 orijinal anakart',
      compatibleModels: ['HP EliteBook 840 G5', 'HP EliteBook 850 G5']
    },
    {
      sku: 'SCR-140-FHD-40',
      name: '14.0" FHD 40-Pin LED Screen (IPS, 120Hz)',
      category: ProductCategory.SCREEN,
      priceUsd: 85.00,
      stock: 25,
      criticalLimit: 5,
      dealerDiscountPercent: 10,
      shelfLocation: 'A-12-08',
      imageUrl: 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: '14 inç Full HD IPS panel, 120Hz',
      compatibleModels: ['Lenovo ThinkPad T480', 'Dell Latitude 7480']
    },
    {
      sku: 'MAC-BAT-A2338',
      name: 'Apple MacBook Pro M1/M2 (A2338) Batarya',
      category: ProductCategory.BATTERY,
      priceUsd: 115.00,
      stock: 12,
      criticalLimit: 3,
      dealerDiscountPercent: 10,
      shelfLocation: 'B-08-01',
      imageUrl: 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Orijinal Apple A2338 Batarya (58.2Wh)',
      compatibleModels: ['MacBook Pro M1 A2338', 'MacBook Pro M2 A2338']
    },
    {
      sku: 'SSD-SATA-1TB',
      name: 'Crucial BX500 1TB 3D NAND SATA 2.5-inch SSD',
      category: ProductCategory.STORAGE,
      priceUsd: 55.00,
      stock: 80,
      criticalLimit: 15,
      dealerDiscountPercent: 12,
      shelfLocation: 'A-02-05',
      imageUrl: 'https://images.pexels.com/photos/4316/technology-computer-chips-gigabyte.jpg?auto=compress&cs=tinysrgb&w=400',
      description: '540MB/s okuma, 500MB/s yazma SATA 3 SSD',
      compatibleModels: ['Universal SATA 2.5" slot']
    },
    {
      sku: 'KB-LEN-T480',
      name: 'Lenovo ThinkPad T480 Arkadan Aydınlatmalı TR Klavye',
      category: ProductCategory.KEYBOARD,
      priceUsd: 45.00,
      stock: 35,
      criticalLimit: 5,
      dealerDiscountPercent: 10,
      shelfLocation: 'C-04-11',
      imageUrl: 'https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'ThinkPad T480 orijinal Türkçe Q klavye, Backlit',
      compatibleModels: ['Lenovo ThinkPad T480', 'Lenovo ThinkPad T470']
    },
    {
      sku: 'MAC-SCR-A2337',
      name: 'Apple MacBook Air M1 (A2337) Komple Ekran (Uzay Grisi)',
      category: ProductCategory.SCREEN,
      priceUsd: 320.00,
      stock: 5,
      criticalLimit: 2,
      dealerDiscountPercent: 5,
      shelfLocation: 'A-15-02',
      imageUrl: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Orijinal MacBook Air M1 A2337 Retina LCD Ekran Kasa',
      compatibleModels: ['MacBook Air M1 A2337']
    },
    {
      sku: 'MB-DELL-XPS9300',
      name: 'Dell XPS 13 (9300) Anakart (i7-1065G7, 16GB RAM)',
      category: ProductCategory.MOTHERBOARD,
      priceUsd: 450.00,
      stock: 2,
      criticalLimit: 1,
      dealerDiscountPercent: 0,
      shelfLocation: 'E-01-01',
      imageUrl: 'https://images.pexels.com/photos/163125/board-motherboard-chip-hardware-163125.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Orijinal Dell Anakart, 16GB LPDDR4x lehimli RAM',
      compatibleModels: ['Dell XPS 13 9300']
    }
  ];

  for (const productData of products) {
    const { compatibleModels, ...data } = productData;
    
    // Check if product exists
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          ...data,
          compatibleModels: {
            create: compatibleModels.map(model => ({ modelName: model }))
          }
        }
      });
      console.log('✅ Product created:', product.sku);
    } else {
      console.log('⏭️ Product exists:', data.sku);
    }
  }

  // Create coupons
  const coupons = [
    {
      code: 'HOSGELDIN10',
      type: CouponType.PERCENTAGE,
      value: 10,
      minPurchase: 500,
      maxDiscount: 200,
      validUntil: new Date('2025-12-31'),
      description: 'İlk siparişinize %10 indirim',
      categories: ['SCREEN', 'BATTERY', 'KEYBOARD']
    },
    {
      code: 'YILBASI100',
      type: CouponType.FIXED,
      value: 100,
      minPurchase: 1000,
      validUntil: new Date('2025-01-15'),
      description: 'Yılbaşına özel 100₺ indirim',
      categories: []
    },
    {
      code: 'EKRAN15',
      type: CouponType.PERCENTAGE,
      value: 15,
      maxDiscount: 500,
      validUntil: new Date('2025-06-30'),
      description: 'Ekran ürünlerinde %15 indirim',
      categories: ['SCREEN']
    },
    {
      code: 'VIP20',
      type: CouponType.PERCENTAGE,
      value: 20,
      minPurchase: 2000,
      maxDiscount: 1000,
      validUntil: new Date('2025-12-31'),
      description: 'VIP müşterilere özel %20 indirim',
      categories: []
    }
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon
    });
    console.log('✅ Coupon created:', coupon.code);
  }

  // Create default settings
  const settings = [
    { key: 'exchange_rate_usd', value: '35', type: 'number' },
    { key: 'min_free_shipping', value: '500', type: 'number' },
    { key: 'shipping_cost', value: '50', type: 'number' },
    { key: 'gift_wrap_price', value: '25', type: 'number' },
    { key: 'company_name', value: 'NotebookPro', type: 'string' },
    { key: 'company_phone', value: '+90 212 123 45 67', type: 'string' },
    { key: 'company_email', value: 'info@notebookpro.com', type: 'string' },
    { key: 'company_address', value: 'Perpa Ticaret Merkezi, A Blok Kat: 11, Şişli/İstanbul', type: 'string' },
    { key: 'vat_rate', value: '0.20', type: 'number' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean' }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }
  console.log('✅ Settings created');

  // Create sample address for customer
  await prisma.address.upsert({
    where: { id: 'default-address-1' },
    update: {},
    create: {
      id: 'default-address-1',
      userId: customer.id,
      title: 'Ev',
      fullName: 'Ali Yılmaz',
      phone: '905559998877',
      city: 'İstanbul',
      district: 'Kadıköy',
      address: 'Caferağa Mah. Moda Cad. No:15 D:3',
      postalCode: '34710',
      isDefault: true
    }
  });
  console.log('✅ Sample address created');

  console.log('');
  console.log('🎉 PostgreSQL seeding completed!');
  console.log('');
  console.log('📊 Database Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Products: ${await prisma.product.count()}`);
  console.log(`   - Coupons: ${await prisma.coupon.count()}`);
  console.log(`   - Settings: ${await prisma.setting.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
