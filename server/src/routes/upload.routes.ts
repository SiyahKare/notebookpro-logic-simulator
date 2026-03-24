import { Router, Request, Response } from 'express';
import { uploadProductImage } from '../middlewares/upload.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/product-image', authenticate, uploadProductImage.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Dosya seçilmedi veya geçersiz format.' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        url: imageUrl
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Sunucu hatası.' });
  }
});

export default router;
