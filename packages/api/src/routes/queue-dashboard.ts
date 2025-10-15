import { Hono } from 'hono';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { authMiddleware } from '../middleware/auth.js';
import { 
  emailQueue, 
  notificationQueue, 
  orderProcessingQueue, 
  analyticsQueue 
} from '../services/queue.service.js';

const queueDashboard = new Hono();

// Create Bull Board
const serverAdapter = new HonoAdapter();
serverAdapter.setBasePath('/api/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(emailQueue),
    new BullAdapter(notificationQueue),
    new BullAdapter(orderProcessingQueue),
    new BullAdapter(analyticsQueue),
  ],
  serverAdapter: serverAdapter,
});

// Admin authentication middleware
const adminAuthMiddleware = async (c: any, next: any) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
};

// Mount Bull Board with admin authentication
queueDashboard.use('/admin/queues/*', authMiddleware);
queueDashboard.use('/admin/queues/*', adminAuthMiddleware);
queueDashboard.route('/admin/queues/*', serverAdapter.getRouter());

// Queue statistics endpoint
queueDashboard.get('/admin/queue-stats', authMiddleware, adminAuthMiddleware, async (c) => {
  try {
    const stats = await Promise.all([
      emailQueue.getWaiting(),
      emailQueue.getActive(),
      emailQueue.getCompleted(),
      emailQueue.getFailed(),
      notificationQueue.getWaiting(),
      notificationQueue.getActive(),
      notificationQueue.getCompleted(),
      notificationQueue.getFailed(),
      orderProcessingQueue.getWaiting(),
      orderProcessingQueue.getActive(),
      orderProcessingQueue.getCompleted(),
      orderProcessingQueue.getFailed(),
      analyticsQueue.getWaiting(),
      analyticsQueue.getActive(),
      analyticsQueue.getCompleted(),
      analyticsQueue.getFailed(),
    ]);

    return c.json({
      email: {
        waiting: stats[0].length,
        active: stats[1].length,
        completed: stats[2].length,
        failed: stats[3].length,
      },
      notification: {
        waiting: stats[4].length,
        active: stats[5].length,
        completed: stats[6].length,
        failed: stats[7].length,
      },
      orderProcessing: {
        waiting: stats[8].length,
        active: stats[9].length,
        completed: stats[10].length,
        failed: stats[11].length,
      },
      analytics: {
        waiting: stats[12].length,
        active: stats[13].length,
        completed: stats[14].length,
        failed: stats[15].length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({ error: 'Failed to get queue statistics' }, 500);
  }
});

export default queueDashboard;