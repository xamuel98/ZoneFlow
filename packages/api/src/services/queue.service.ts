import Bull, { Queue, Job } from 'bull';
import { redis } from './redis.service.js';
import { EmailService } from './email.service.js';
import { webSocketService } from './websocket.service.js';

// Queue definitions
export const emailQueue = new Bull('email processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const notificationQueue = new Bull('notification processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
  },
});

export const orderProcessingQueue = new Bull('order processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 10,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

export const analyticsQueue = new Bull('analytics processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 3,
    attempts: 2,
  },
});

// Job processors
emailQueue.process('send-email', async (job: Job) => {
  const { to, subject, html, template, data } = job.data;
  
  try {
    if (template) {
      await EmailService.sendTemplateEmail(to, subject, template, data);
    } else {
      await EmailService.sendEmail(to, subject, html);
    }
    
    console.log(`Email sent successfully to ${to}`);
    return { success: true, recipient: to };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
});

emailQueue.process('send-bulk-email', async (job: Job) => {
  const { recipients, subject, html, template, data } = job.data;
  const results = [];
  
  for (const recipient of recipients) {
    try {
      if (template) {
        await EmailService.sendTemplateEmail(recipient, subject, template, data);
      } else {
        await EmailService.sendEmail(recipient, subject, html);
      }
      results.push({ recipient, success: true });
    } catch (error) {
      results.push({ recipient, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  
  return results;
});

notificationQueue.process('send-notification', async (job: Job) => {
  const { userId, userRole, message, type, data } = job.data;
  
  try {
    if (userId) {
      webSocketService.sendToUser(userId, 'notification:received', {
        message,
        type,
        data,
        timestamp: Date.now()
      });
    } else if (userRole) {
      webSocketService.sendToRole(userRole, 'notification:received', {
        message,
        type,
        data,
        timestamp: Date.now()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Notification sending failed:', error);
    throw error;
  }
});

orderProcessingQueue.process('process-order-status-change', async (job: Job) => {
  const { orderId, newStatus, driverId, location } = job.data;
  
  try {
    // Update order status in database
    // This would typically involve database operations
    
    // Send real-time notification
    webSocketService.sendToOrder(orderId, 'order:status:updated', {
      orderId,
      status: newStatus,
      driverId,
      location,
      timestamp: Date.now()
    });
    
    // Send email notifications if needed
    if (newStatus === 'delivered') {
      await emailQueue.add('send-email', {
        to: 'customer@example.com', // Get from order data
        subject: 'Order Delivered',
        template: 'order-delivered',
        data: { orderId, deliveryTime: new Date() }
      });
    }
    
    return { success: true, orderId, newStatus };
  } catch (error) {
    console.error('Order processing failed:', error);
    throw error;
  }
});

orderProcessingQueue.process('assign-driver', async (job: Job) => {
  const { orderId, driverId } = job.data;
  
  try {
    // Logic to assign driver to order
    // Update database, send notifications, etc.
    
    // Notify driver
    webSocketService.sendToUser(driverId, 'order:assigned', {
      orderId,
      timestamp: Date.now()
    });
    
    // Notify customer
    await notificationQueue.add('send-notification', {
      userId: 'customer-id', // Get from order
      message: 'A driver has been assigned to your order',
      type: 'order_update'
    });
    
    return { success: true, orderId, driverId };
  } catch (error) {
    console.error('Driver assignment failed:', error);
    throw error;
  }
});

analyticsQueue.process('calculate-driver-metrics', async (job: Job) => {
  const { driverId, date } = job.data;
  
  try {
    // Calculate driver performance metrics
    // This would involve complex database queries and calculations
    
    const metrics = {
      deliveries: 0,
      averageDeliveryTime: 0,
      customerRating: 0,
      distanceTraveled: 0,
      earnings: 0
    };
    
    // Store metrics in cache for quick access
    await redis.setex(
      `driver:${driverId}:metrics:${date}`,
      86400, // 24 hours
      JSON.stringify(metrics)
    );
    
    return metrics;
  } catch (error) {
    console.error('Analytics calculation failed:', error);
    throw error;
  }
});

analyticsQueue.process('generate-daily-report', async (job: Job) => {
  const { date } = job.data;
  
  try {
    // Generate comprehensive daily report
    const report = {
      date,
      totalOrders: 0,
      completedOrders: 0,
      revenue: 0,
      activeDrivers: 0,
      averageDeliveryTime: 0
    };
    
    // Store report
    await redis.setex(
      `report:daily:${date}`,
      604800, // 7 days
      JSON.stringify(report)
    );
    
    // Send report to admins
    await emailQueue.add('send-email', {
      to: 'admin@zoneflow.com',
      subject: `Daily Report - ${date}`,
      template: 'daily-report',
      data: report
    });
    
    return report;
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
});

// Queue management functions
export class QueueService {
  static async addEmailJob(jobData: any, options?: any) {
    return emailQueue.add('send-email', jobData, options);
  }
  
  static async addBulkEmailJob(jobData: any, options?: any) {
    return emailQueue.add('send-bulk-email', jobData, options);
  }
  
  static async addNotificationJob(jobData: any, options?: any) {
    return notificationQueue.add('send-notification', jobData, options);
  }
  
  static async addOrderProcessingJob(jobType: string, jobData: any, options?: any) {
    return orderProcessingQueue.add(jobType, jobData, options);
  }
  
  static async addAnalyticsJob(jobType: string, jobData: any, options?: any) {
    return analyticsQueue.add(jobType, jobData, options);
  }
  
  // Scheduled jobs
  static setupScheduledJobs() {
    // Daily analytics report
    analyticsQueue.add(
      'generate-daily-report',
      { date: new Date().toISOString().split('T')[0] },
      {
        repeat: { cron: '0 6 * * *' }, // 6 AM daily
        removeOnComplete: 5,
        removeOnFail: 3
      }
    );
    
    // Driver metrics calculation
    analyticsQueue.add(
      'calculate-driver-metrics',
      {},
      {
        repeat: { cron: '0 */6 * * *' }, // Every 6 hours
        removeOnComplete: 3,
        removeOnFail: 2
      }
    );
  }
  
  // Queue monitoring
  static getQueueStats() {
    return Promise.all([
      emailQueue.getJobCounts(),
      notificationQueue.getJobCounts(),
      orderProcessingQueue.getJobCounts(),
      analyticsQueue.getJobCounts()
    ]).then(([email, notification, order, analytics]) => ({
      email,
      notification,
      order,
      analytics
    }));
  }
  
  static async pauseAllQueues() {
    await Promise.all([
      emailQueue.pause(),
      notificationQueue.pause(),
      orderProcessingQueue.pause(),
      analyticsQueue.pause()
    ]);
  }
  
  static async resumeAllQueues() {
    await Promise.all([
      emailQueue.resume(),
      notificationQueue.resume(),
      orderProcessingQueue.resume(),
      analyticsQueue.resume()
    ]);
  }
}

// Error handling
emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`Notification job ${job.id} failed:`, err);
});

orderProcessingQueue.on('failed', (job, err) => {
  console.error(`Order processing job ${job.id} failed:`, err);
});

analyticsQueue.on('failed', (job, err) => {
  console.error(`Analytics job ${job.id} failed:`, err);
});

// Success logging
emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});