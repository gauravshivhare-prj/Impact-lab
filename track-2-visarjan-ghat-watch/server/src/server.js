import 'dotenv/config';
import { createApp } from './app.js';
import { getCerebrasApiKey, loadEnv } from './config/env.js';
import { loadDataContext } from './services/dataContext.service.js';
import { createCerebrasClient } from './services/reports/cerebras.service.js';

async function start() {
  const config = loadEnv();
  const dataContext = await loadDataContext();
  const aiClient = createCerebrasClient({
    apiKey: getCerebrasApiKey(),
    model: config.cerebrasModel,
    timeoutMs: config.cerebrasTimeoutMs,
  });

  const app = createApp({ config, dataContext, aiClient });
  const server = app.listen(config.port, (err) => {
    if (err) {
      console.error(`Failed to listen on port ${config.port}: ${err.message}`);
      process.exit(1);
    }
    console.log(
      `GhatWatch API listening on port ${config.port} (${config.nodeEnv}); ` +
        `${dataContext.importSummary.totalRecords} records loaded; AI briefs ${aiClient.enabled ? 'enabled' : 'disabled (template briefs)'}.`,
    );
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start GhatWatch API:', err.message);
  process.exit(1);
});
