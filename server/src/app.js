import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ghatRoutes from './routes/ghat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import scenarioRoutes from './routes/scenario.routes.js';
import { createReportRoutes } from './routes/report.routes.js';
import { createRiskRoutes } from './routes/risk.routes.js';
import { createApiRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const API_PREFIX = '/api/v1';

/**
 * @param {{ config: object, dataContext: object, fetchImpl?: Function }} deps
 */
export function createApp({ config, dataContext, fetchImpl }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.locals.dataContext = dataContext;

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
      origin: config.clientOrigins,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Accept'],
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(API_PREFIX, createApiRateLimiter());

  app.get(`${API_PREFIX}/health`, (req, res) => {
    res.json({ data: { status: 'ok' }, meta: {} });
  });
  app.use(`${API_PREFIX}/ghats`, ghatRoutes);
  app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
  app.use(`${API_PREFIX}/scenarios`, scenarioRoutes);
  app.use(`${API_PREFIX}/reports`, createReportRoutes());
  app.use(`${API_PREFIX}/risk`, createRiskRoutes({ engineUrl: config.engineUrl, fetchImpl }));

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
