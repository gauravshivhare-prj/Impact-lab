import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import ghatRoutes from './routes/ghat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import scenarioRoutes from './routes/scenario.routes.js';
import { createReportRoutes } from './routes/report.routes.js';
import { createApiRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export const API_PREFIX = '/api/v1';

/**
 * @param {{ config: object, dataContext: object }} deps
 */
export function createApp({ config, dataContext }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.locals.dataContext = dataContext;

  app.use(helmet());
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
