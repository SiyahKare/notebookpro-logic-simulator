import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { prisma } from '../config/database.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
}

// Verify JWT token
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Yetkilendirme token\'ı bulunamadı', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true }
    });

    if (!user) {
      throw new AppError('Bu token\'a ait kullanıcı bulunamadı', 401);
    }

    if (!user.isActive) {
      throw new AppError('Hesabınız devre dışı bırakılmış', 401);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Geçersiz token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token süresi dolmuş', 401));
    } else {
      next(error);
    }
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true }
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };
    }

    next();
  } catch {
    // Ignore errors, just continue without user
    next();
  }
};

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Giriş yapmanız gerekiyor', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bu işlem için yetkiniz yok', 403));
    }

    next();
  };
};

// Admin only
export const adminOnly = authorize('ADMIN');

// Admin or Technician
export const staffOnly = authorize('ADMIN', 'TECHNICIAN');

// Dealer or higher
export const dealerOrHigher = authorize('ADMIN', 'DEALER');

