import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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
      role: 'ADMIN',
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
      role: 'TECHNICIAN',
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
      role: 'DEALER',
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
      role: 'CUSTOMER',
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
      category: 'SCREEN',
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
      category: 'BATTERY',
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
      category: 'KEYBOARD',
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
      sku: 'RAM-DDR4-8GB',
      name: 'Samsung 8GB DDR4 2666MHz SODIMM',
      category: 'RAM',
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
      sku: 'SSD-NVME-512',
      name: 'Samsung PM991 512GB NVMe SSD',
      category: 'STORAGE',
      priceUsd: 42.00,
      stock: 200,
      criticalLimit: 20,
      dealerDiscountPercent: 8,
      shelfLocation: 'A-08-02',
      imageUrl: 'https://images.pexels.com/photos/4316/technology-computer-chips-gigabyte.jpg?auto=compress&cs=tinysrgb&w=400',
      description: 'PCIe 3.0 x4 NVMe, 2400MB/s okuma',
      compatibleModels: ['Universal M.2 Slot']
    }
  ];

  for (const productData of products) {
    const { compatibleModels, ...data } = productData;
    const product = await prisma.product.upsert({
      where: { sku: data.sku },
      update: {},
      create: {
        ...data,
        compatibleModels: {
          create: compatibleModels.map(model => ({ modelName: model }))
        }
      }
    });
    console.log('✅ Product created:', product.sku);
  }

  // Create coupons
  const coupons = [
    {
      code: 'HOSGELDIN10',
      type: 'PERCENTAGE',
      value: 10,
      minPurchase: 500,
      maxDiscount: 200,
      validUntil: new Date('2025-12-31'),
      description: 'İlk siparişinize %10 indirim'
    },
    {
      code: 'YILBASI100',
      type: 'FIXED',
      value: 100,
      minPurchase: 1000,
      validUntil: new Date('2025-01-15'),
      description: 'Yılbaşına özel 100₺ indirim'
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
    { key: 'company_email', value: 'info@notebookpro.com', type: 'string' }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }
  console.log('✅ Settings created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

