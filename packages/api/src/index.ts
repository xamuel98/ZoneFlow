import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import createApp from './app.js';

// Load environment variables
dotenv.config();

const app = createApp();

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 ZoneFlow API Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;