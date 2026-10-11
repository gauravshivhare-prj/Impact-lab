import 'dotenv/config';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { loadDataContext } from './services/dataContext.service.js';

async function start() {
  const config = loadEnv();
  const dataContext = await loadDataContext();

  const app = createApp({ config, dataContext });
  const server = app.listen(config.port, (err) => {
    if (err) {
      console.error(`Failed to listen on port ${config.port}: ${err.message}`);
      process.exit(1);
    }
    console.log(
      `Ghatरक्षक API listening on port ${config.port} (${config.nodeEnv}); ` +
        `${dataContext.importSummary.totalRecords} records loaded.`,
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
  console.error('Failed to start Ghatरक्षक API:', err.message);
  process.exit(1);
});
