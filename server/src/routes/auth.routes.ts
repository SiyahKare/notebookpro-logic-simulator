import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Generate tokens
const generateTokens = (user: { id: string; email: string; role: string; name: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  const refreshToken = uuidv4();
  
  return { accessToken, refreshToken };
};

// ===================
// POST /api/auth/register
// ===================
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone, role = 'CUSTOMER', companyTitle, taxOffice, taxNumber } = req.body;

  // Validate required fields
  if (!email || !password || !name) {
    throw new AppError('Email, şifre ve isim zorunludur', 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Bu e-posta adresi zaten kayıtlı', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Determine if approval needed (dealers need approval)
  const isApproved = role !== 'DEALER';

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      role,
      isApproved,
      companyTitle,
      taxOffice,
      taxNumber
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
      createdAt: true
    }
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });

  res.status(201).json({
    success: true,
    message: role === 'DEALER' 
      ? 'Kayıt başarılı. Bayi hesabınız onay bekliyor.' 
      : 'Kayıt başarılı',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
}));

// ===================
// POST /api/auth/login
// ===================
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email ve şifre zorunludur', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
      isApproved: true,
      isActive: true
    }
  });

  if (!user) {
    throw new AppError('Geçersiz email veya şifre', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Geçersiz email veya şifre', 401);
  }

  // Check if active
  if (!user.isActive) {
    throw new AppError('Hesabınız devre dışı bırakılmış', 401);
  }

  // Check if approved (for dealers)
  if (user.role === 'DEALER' && !user.isApproved) {
    throw new AppError('Bayi hesabınız henüz onaylanmamış', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  res.json({
    success: true,
    message: 'Giriş başarılı',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved
      },
      accessToken,
      refreshToken
    }
  });
}));

// ===================
// POST /api/auth/refresh
// ===================
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token gerekli', 400);
  }

  // Find token
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  });

  if (!tokenRecord) {
    throw new AppError('Geçersiz refresh token', 401);
  }

  if (tokenRecord.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    throw new AppError('Refresh token süresi dolmuş', 401);
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    id: tokenRecord.user.id,
    email: tokenRecord.user.email,
    role: tokenRecord.user.role,
    name: tokenRecord.user.name
  });

  // Delete old token and create new one
  await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: tokenRecord.user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken
    }
  });
}));

// ===================
// POST /api/auth/logout
// ===================
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
  }

  // Optionally delete all user's refresh tokens
  // await prisma.refreshToken.deleteMany({ where: { userId: req.user!.id } });

  res.json({
    success: true,
    message: 'Çıkış başarılı'
  });
}));

// ===================
// GET /api/auth/me
// ===================
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isApproved: true,
      companyTitle: true,
      taxOffice: true,
      taxNumber: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          orders: true,
          repairs: true,
          favorites: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

// ===================
// PUT /api/auth/password
// ===================
router.put('/password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Mevcut ve yeni şifre zorunludur', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Yeni şifre en az 6 karakter olmalıdır', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { password: true }
  });

  const isPasswordValid = await bcrypt.compare(currentPassword, user!.password);
  if (!isPasswordValid) {
    throw new AppError('Mevcut şifre yanlış', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: hashedPassword }
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId: req.user!.id }
  });

  res.json({
    success: true,
    message: 'Şifre başarıyla güncellendi. Lütfen tekrar giriş yapın.'
  });
}));

export default router;

