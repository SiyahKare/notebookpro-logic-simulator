import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate, adminOnly } from '../middlewares/auth.js';

const router = Router();

// GET /api/settings
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.setting.findMany();
  
  const settingsMap: Record<string, any> = {};
  settings.forEach(s => {
    let value: any = s.value;
    if (s.type === 'number') value = parseFloat(s.value);
    else if (s.type === 'boolean') value = s.value === 'true';
    else if (s.type === 'json') value = JSON.parse(s.value);
    settingsMap[s.key] = value;
  });

  res.json({ success: true, data: settingsMap });
}));

// GET /api/settings/:key
router.get('/:key', asyncHandler(async (req: Request, res: Response) => {
  const setting = await prisma.setting.findUnique({ where: { key: req.params.key } });
  if (!setting) throw new AppError('Ayar bulunamadi', 404);

  let value: any = setting.value;
  if (setting.type === 'number') value = parseFloat(setting.value);
  else if (setting.type === 'boolean') value = setting.value === 'true';
  else if (setting.type === 'json') value = JSON.parse(setting.value);

  res.json({ success: true, data: { key: setting.key, value, type: setting.type } });
}));

// PUT /api/settings/:key (Admin only)
router.put('/:key', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value, type = 'string' } = req.body;

  const stringValue = type === 'json' ? JSON.stringify(value) : String(value);

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value: stringValue, type },
    create: { key, value: stringValue, type }
  });

  res.json({ success: true, data: setting });
}));

// POST /api/settings/bulk (Admin only)
router.post('/bulk', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;

  for (const { key, value, type = 'string' } of settings) {
    const stringValue = type === 'json' ? JSON.stringify(value) : String(value);
    await prisma.setting.upsert({
      where: { key },
      update: { value: stringValue, type },
      create: { key, value: stringValue, type }
    });
  }

  res.json({ success: true, message: 'Ayarlar guncellendi' });
}));

export default router;

