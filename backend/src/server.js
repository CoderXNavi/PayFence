/**
 * PayFence Server Entry Point
 * Starts the HTTP server on configured port.
 */

import app from './app.js';
import { initDatabase } from './config/database.js';
import { initStore } from './models/store.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await initDatabase();
    initStore();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🛡️  PayFence Backend listening on http://localhost:${PORT}`);
      console.log(`🛡️  Autonomous AI Payment Guard: ACTIVE`);
      console.log(`🛡️  Standard limits: Cap $50 / Daily $200 / Balance $500`);
      console.log(`====================================================`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start PayFence server:', err);
    process.exit(1);
  }
}

bootstrap();
