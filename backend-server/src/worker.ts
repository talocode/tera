import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/hono-auth.js';
import chatRoutes from './routes/hono-chat.js';
import toolsRoutes from './routes/hono-tools.js';

const app = new Hono();

// Global Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin: any) => {
    // Dynamically match allowed origins (similar to original express server config)
    if (!origin) return '*';
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /\.teraai\.chat$/,
      /https:\/\/tera-web\.pages\.dev$/
    ];
    if (allowedPatterns.some(p => p.test(origin))) {
      return origin;
    }
    return 'http://localhost:3000'; // Default fallback
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Route mappings
app.route('/api/auth', authRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/tools', toolsRoutes);

// Health Check
app.get('/health', (c: any) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default app;
