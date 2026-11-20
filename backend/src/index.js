import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { connectRedis } from './config/redis.js';
import authRoutes from './routes/auth.js';
import financialRoutes from './routes/financial.js';
import publicRoutes from './routes/public.js';
import { initUsers } from './routes/auth.js';

dotenv.config();

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/public', publicRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Endpoint not found' });
});

async function startServer() {
  await initUsers();

  const redisConnected = await connectRedis();
  if (!redisConnected) {
    console.warn('Running without Redis - rate limiting will use in-memory store (not suitable for production multi-instance deployments)');
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`RatnaOS backend running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`API base: http://localhost:${port}/api`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;