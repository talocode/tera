import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import toolsRoutes from './routes/tools.js';

dotenv.config();

const app: express.Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Web dev
      'http://localhost:8081', // Expo dev
      'http://localhost:19000', // Expo tunnel
      process.env.WEB_URL || 'http://localhost:3000',
      process.env.MOBILE_APP_URL || 'com.tera.app',
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tools', toolsRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);

    const status = err.status || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `\n✅ Tera API Server running on http://localhost:${PORT}`
  );
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
