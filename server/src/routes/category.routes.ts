import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate, adminOnly } from '../middlewares/auth.js';
import slugify from 'slugify';

const router = Router();

// Helper to generate slug
const generateSlug = (text: string) => {
  return slugify(text, { lower: true, strict: true, locale: 'tr' });
};

// ===================
// GET /api/categories
// ===================
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      subCategories: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  res.json({ success: true, data: categories });
}));

// ===================
// POST /api/categories
// ===================
router.post('/', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) throw new AppError('Kategori adı zorunludur', 400);

  let slug = generateSlug(name);
  // Check if slug exists
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const category = await prisma.category.create({
    data: { name, slug, description }
  });

  res.status(201).json({ success: true, data: category });
}));

// ===================
// PUT /api/categories/:id
// ===================
router.put('/:id', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  let updateData: any = { description };
  if (name) {
    updateData.name = name;
    updateData.slug = generateSlug(name);
    const existing = await prisma.category.findFirst({ where: { slug: updateData.slug, id: { not: id } } });
    if (existing) updateData.slug = `${updateData.slug}-${Date.now().toString().slice(-4)}`;
  }

  const category = await prisma.category.update({
    where: { id },
    data: updateData
  });

  res.json({ success: true, data: category });
}));

// ===================
// DELETE /api/categories/:id
// ===================
router.delete('/:id', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Check if there are attached products
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) throw new AppError('Bu kategoriye ait ürünler var, önce onları silin/taşıyın', 400);

  await prisma.category.delete({ where: { id } });
  res.json({ success: true, message: 'Kategori silindi' });
}));

// ===================
// POST /api/categories/:id/subcategories
// ===================
router.post('/:id/subcategories', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) throw new AppError('Alt kategori adı zorunludur', 400);

  let slug = generateSlug(name);
  const existing = await prisma.subCategory.findFirst({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const subCategory = await prisma.subCategory.create({
    data: { name, slug, categoryId: id }
  });

  res.status(201).json({ success: true, data: subCategory });
}));

// ===================
// PUT /api/categories/subcategories/:subId
// ===================
router.put('/subcategories/:subId', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { subId } = req.params;
  const { name } = req.body;

  if (!name) throw new AppError('Alt kategori adı zorunludur', 400);

  let slug = generateSlug(name);
  const existing = await prisma.subCategory.findFirst({ where: { slug, id: { not: subId } } });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const subCat = await prisma.subCategory.update({
    where: { id: subId },
    data: { name, slug }
  });

  res.json({ success: true, data: subCat });
}));

// ===================
// DELETE /api/categories/subcategories/:subId
// ===================
router.delete('/subcategories/:subId', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { subId } = req.params;
  
  const count = await prisma.product.count({ where: { subCategoryId: subId } });
  if (count > 0) throw new AppError('Bu alt kategoriye ait ürünler var, önce onları taşıyın', 400);

  await prisma.subCategory.delete({ where: { id: subId } });
  res.json({ success: true, message: 'Alt kategori silindi' });
}));

export default router;
