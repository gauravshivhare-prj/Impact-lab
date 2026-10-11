import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import env from './config/env.js';
import ghatRoutes from './routes/ghat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import scenarioRoutes from './routes/scenario.routes.js';
import reportRoutes from './routes/report.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/ghats', ghatRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/scenarios', scenarioRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
