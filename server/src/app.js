import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import ghatRoutes from './routes/ghat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import scenarioRoutes from './routes/scenario.routes.js';
import assistantRoutes from './routes/assistant.routes.js';
import simulationRoutes from './routes/simulation.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { createReportRoutes } from './routes/report.routes.js';
import { createRiskRoutes } from './routes/risk.routes.js';
import { createApiRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sessionMiddleware } from './middleware/auth.js';
import { getDatabase } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const API_PREFIX = '/api/v1';

/**
 * @param {{ config: object, dataContext: object, fetchImpl?: Function }} deps
 */
export function createApp({ config, dataContext, fetchImpl }) {
  const app = express();

  // Initialize database
  getDatabase();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.locals.dataContext = dataContext;
  app.locals.config = config;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://*.tile.openstreetmap.org',
            'https://*.openstreetmap.org',
            'https://*.arcgisonline.com',
            'https://*.cartocdn.com',
            'https://images.unsplash.com',
          ],
          connectSrc: ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: config.clientOrigins.includes('*') ? true : config.clientOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Accept'],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(sessionMiddleware);
  app.use(API_PREFIX, createApiRateLimiter());

  // Health check (unauthenticated)
  app.get(`${API_PREFIX}/health`, (req, res) => {
    res.json({ data: { status: 'ok' }, meta: {} });
  });

  // Authentication routes (mostly unauthenticated)
  app.use(`${API_PREFIX}/auth`, authRoutes);

  // Public data routes (read-only, no auth required for now)
  app.use(`${API_PREFIX}/ghats`, ghatRoutes);
  app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
  app.use(`${API_PREFIX}/scenarios`, scenarioRoutes);
  app.use(`${API_PREFIX}/assistant`, assistantRoutes);
  app.use(`${API_PREFIX}/simulations`, simulationRoutes);
  app.use(`${API_PREFIX}/reports`, createReportRoutes());
  app.use(`${API_PREFIX}/risk`, createRiskRoutes({ engineUrl: config.engineUrl, fetchImpl }));

  // Admin routes (requires administrator role)
  app.use(`${API_PREFIX}/admin`, adminRoutes);

  // Serve static client assets in production if client/dist exists
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(clientDistPath, 'index.html'));
      }
      next();
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
