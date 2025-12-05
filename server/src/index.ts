import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import repairRoutes from './routes/repair.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import settingRoutes from './routes/setting.routes.js';
import emailRoutes from './routes/email.routes.js';

const app: Express = express();

// ===================
// MIDDLEWARE SETUP
// ===================

// Security headers
app.use(helmet());

// CORS - Multiple origins support
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (env.CORS_ORIGINS.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (env.isDev) {
      return callback(null, true);
    }
    
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { error: 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.' }
});
app.use('/api', limiter);

// Request logging
if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(env.UPLOAD_DIR));

// ===================
// API ROUTES
// ===================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/email', emailRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0'
  });
});

// API documentation
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'NotebookPro API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      repairs: '/api/repairs',
      notifications: '/api/notifications',
      coupons: '/api/coupons',
      settings: '/api/settings',
      health: '/api/health'
    }
  });
});

// ===================
// ERROR HANDLING
// ===================

app.use(notFoundHandler);
app.use(errorHandler);

// ===================
// SERVER START
// ===================

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 NotebookPro API Server`);
  console.log('='.repeat(50));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`📍 API Docs: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
});

export default app;

