import { PrismaClient, UserRole, CouponType, StockMoveType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categorySeed = [
  {
    slug: 'screen',
    name: 'Ekran',
    description: 'Notebook LCD, LED ve IPS ekran panelleri',
  },
  {
    slug: 'battery',
    name: 'Batarya',
    description: 'Orijinal ve uyumlu notebook bataryalari',
  },
  {
    slug: 'keyboard',
    name: 'Klavye',
    description: 'Notebook klavye ve backlit klavye modelleri',
  },
  {
    slug: 'storage',
    name: 'Depolama',
    description: 'SSD, NVMe ve disk cozumleri',
  },
  {
    slug: 'ram',
    name: 'RAM',
    description: 'DDR4 ve DDR5 notebook bellek urunleri',
  },
];

const productSeed = [
  {
    sku: 'SCR-156-SLIM-30',
    name: '15.6 Slim 30-Pin IPS LED Ekran',
    categorySlug: 'screen',
    priceUsd: 68,
    stock: 45,
    criticalLimit: 5,
    dealerDiscountPercent: 10,
    shelfLocation: 'A-12-04',
    imageUrl: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Full HD IPS panel, 30 pin EDP baglanti, yuksek renk dogrulugu.',
    compatibleModels: ['Asus X550', 'Lenovo Ideapad 320', 'Dell Inspiron 3542'],
  },
  {
    sku: 'BAT-DELL-60W',
    name: 'Dell 60Wh 4-Hucre Batarya',
    categorySlug: 'battery',
    priceUsd: 35.5,
    stock: 12,
    criticalLimit: 4,
    dealerDiscountPercent: 12,
    shelfLocation: 'B-05-01',
    imageUrl: 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Dell Latitude serisi icin uyumlu 60Wh notebook bataryasi.',
    compatibleModels: ['Dell Latitude 7480', 'Dell Latitude 7490'],
  },
  {
    sku: 'KB-HP-15-TR',
    name: 'HP Pavilion 15 Turkce Q Klavye',
    categorySlug: 'keyboard',
    priceUsd: 18.25,
    stock: 60,
    criticalLimit: 8,
    dealerDiscountPercent: 10,
    shelfLocation: 'C-22-10',
    imageUrl: 'https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Backlit destekli Turkce Q notebook klavyesi.',
    compatibleModels: ['HP Pavilion 15-cb', 'HP Pavilion 15-ck'],
  },
  {
    sku: 'SSD-NVME-512',
    name: 'Samsung 512GB NVMe SSD',
    categorySlug: 'storage',
    priceUsd: 42,
    stock: 80,
    criticalLimit: 10,
    dealerDiscountPercent: 8,
    shelfLocation: 'A-08-02',
    imageUrl: 'https://images.pexels.com/photos/4316/technology-computer-chips-gigabyte.jpg?auto=compress&cs=tinysrgb&w=400',
    description: 'PCIe NVMe SSD, 2400MB/s okuma performansi.',
    compatibleModels: ['Universal M.2 Slot'],
  },
  {
    sku: 'RAM-DDR4-8GB',
    name: 'Samsung 8GB DDR4 2666MHz SODIMM',
    categorySlug: 'ram',
    priceUsd: 22,
    stock: 90,
    criticalLimit: 10,
    dealerDiscountPercent: 8,
    shelfLocation: 'D-01-05',
    imageUrl: 'https://images.pexels.com/photos/2588757/pexels-photo-2588757.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Notebook icin 8GB DDR4 bellek modulu.',
    compatibleModels: ['Universal DDR4 Slot', 'HP EliteBook', 'Dell Latitude'],
  },
  {
    sku: 'RAM-DDR4-16GB',
    name: 'Kingston 16GB DDR4 3200MHz SODIMM',
    categorySlug: 'ram',
    priceUsd: 38,
    stock: 50,
    criticalLimit: 8,
    dealerDiscountPercent: 10,
    shelfLocation: 'D-01-06',
    imageUrl: 'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Yuksek performansli 16GB DDR4 notebook bellek.',
    compatibleModels: ['Universal DDR4 Slot', 'ASUS ROG', 'MSI Gaming'],
  },
];

const settingSeed = [
  { key: 'exchange_rate', value: '35', type: 'number' },
  { key: 'gift_wrap_price', value: '25', type: 'number' },
];

async function upsertUsers() {
  const users = [
    {
      email: 'admin@notebookpro.com',
      password: 'admin123',
      name: 'System Admin',
      phone: '905551112233',
      role: UserRole.ADMIN,
      isApproved: true,
      isActive: true,
    },
    {
      email: 'ahmet@notebookpro.com',
      password: 'tech123',
      name: 'Ahmet Usta',
      phone: '905552223344',
      role: UserRole.TECHNICIAN,
      isApproved: true,
      isActive: true,
    },
    {
      email: 'info@egepc.com',
      password: 'dealer123',
      name: 'Ege Bilgisayar',
      phone: '902324445566',
      role: UserRole.DEALER,
      isApproved: true,
      isActive: true,
      companyTitle: 'Ege Bilgisayar Ltd. Sti.',
      taxOffice: 'Kordon',
      taxNumber: '1234567890',
    },
    {
      email: 'ali@gmail.com',
      password: 'customer123',
      name: 'Ali Yilmaz',
      phone: '905559998877',
      role: UserRole.CUSTOMER,
      isApproved: true,
      isActive: true,
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
        isActive: user.isActive,
        companyTitle: user.companyTitle,
        taxOffice: user.taxOffice,
        taxNumber: user.taxNumber,
      },
      create: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
        isActive: user.isActive,
        companyTitle: user.companyTitle,
        taxOffice: user.taxOffice,
        taxNumber: user.taxNumber,
      },
    });

    console.log(`✅ User ready: ${record.email}`);
  }
}

async function upsertCategories() {
  const categoryMap = new Map<string, string>();

  for (const category of categorySeed) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });

    categoryMap.set(category.slug, record.id);
    console.log(`✅ Category ready: ${record.name}`);
  }

  return categoryMap;
}

async function upsertProducts(categoryMap: Map<string, string>) {
  for (const product of productSeed) {
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for product ${product.sku}`);
    }

    const record = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        description: product.description,
        categoryId,
        priceUsd: product.priceUsd,
        vatRate: 0.2,
        stock: product.stock,
        criticalLimit: product.criticalLimit,
        dealerDiscountPercent: product.dealerDiscountPercent,
        shelfLocation: product.shelfLocation,
        imageUrl: product.imageUrl,
        isActive: true,
        compatibleModels: {
          deleteMany: {},
          create: product.compatibleModels.map((modelName) => ({ modelName })),
        },
      },
      create: {
        sku: product.sku,
        name: product.name,
        description: product.description,
        categoryId,
        priceUsd: product.priceUsd,
        vatRate: 0.2,
        stock: product.stock,
        criticalLimit: product.criticalLimit,
        dealerDiscountPercent: product.dealerDiscountPercent,
        shelfLocation: product.shelfLocation,
        imageUrl: product.imageUrl,
        isActive: true,
        compatibleModels: {
          create: product.compatibleModels.map((modelName) => ({ modelName })),
        },
      },
    });

    const stockMovementCount = await prisma.stockMovement.count({
      where: { productId: record.id },
    });

    if (stockMovementCount === 0 && product.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: record.id,
          type: StockMoveType.IN,
          quantity: product.stock,
          reason: 'Initial demo stock',
          performedBy: 'Seed Script',
        },
      });
    }

    console.log(`✅ Product ready: ${record.sku}`);
  }
}

async function upsertCoupon() {
  const coupon = await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {
      value: 10,
      type: CouponType.PERCENTAGE,
      minPurchase: 500,
      maxDiscount: 750,
      usageLimit: 100,
      validUntil: new Date('2027-12-31T23:59:59.000Z'),
      isActive: true,
      description: 'Ilk alisveris indirimi',
      categories: ['screen', 'battery', 'keyboard', 'storage', 'ram'],
    },
    create: {
      code: 'WELCOME10',
      type: CouponType.PERCENTAGE,
      value: 10,
      minPurchase: 500,
      maxDiscount: 750,
      usageLimit: 100,
      validUntil: new Date('2027-12-31T23:59:59.000Z'),
      isActive: true,
      description: 'Ilk alisveris indirimi',
      categories: ['screen', 'battery', 'keyboard', 'storage', 'ram'],
    },
  });

  console.log(`✅ Coupon ready: ${coupon.code}`);
}

async function upsertSettings() {
  for (const setting of settingSeed) {
    const record = await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: setting,
    });

    console.log(`✅ Setting ready: ${record.key}`);
  }
}

async function main() {
  console.log('🌱 Seeding PostgreSQL database...');

  await upsertUsers();
  const categoryMap = await upsertCategories();
  await upsertProducts(categoryMap);
  await upsertCoupon();
  await upsertSettings();

  console.log('🎉 Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
