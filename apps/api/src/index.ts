import { startServer, createServer } from './server';

export { createServer, startServer };

if (require.main === module) {
  startServer();
}
