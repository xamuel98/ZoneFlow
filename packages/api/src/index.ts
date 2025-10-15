import { serve } from '@hono/node-server';
import { createServer } from 'http';
import dotenv from 'dotenv';
import createApp from './app.js';
import { WebSocketService } from './services/websocket.service.js';
// import { QueueService } from './services/queue.service.js';

// Load environment variables
dotenv.config();

const app = createApp();

const port = parseInt(process.env.PORT || '3000');
const wsPort = parseInt(process.env.WEBSOCKET_PORT || '3002');

console.log(`🚀 ZoneFlow API Server starting on port ${port}`);
console.log(`🔌 WebSocket Server starting on port ${wsPort}`);

// Start HTTP server
const server = serve({
  fetch: app.fetch,
  port,
});

// Start WebSocket server on separate port
const wsServer = createServer();
const webSocketService = new WebSocketService(wsServer);
wsServer.listen(wsPort, () => {
  console.log(`✅ WebSocket server running on port ${wsPort}`);
});

// Initialize Queue service and scheduled jobs
try {
  // QueueService.setupScheduledJobs();
  console.log('⚠️  Queue service disabled (Redis not available)');
} catch (error) {
  console.log('⚠️  Queue service initialization failed:', error);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  
  // Close WebSocket server
  wsServer.close(() => {
    console.log('✅ WebSocket server closed');
  });
  
  // Close HTTP server
  if (server && typeof server.close === 'function') {
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  
  // Close WebSocket server
  wsServer.close(() => {
    console.log('✅ WebSocket server closed');
  });
  
  // Close HTTP server
  if (server && typeof server.close === 'function') {
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export default app;