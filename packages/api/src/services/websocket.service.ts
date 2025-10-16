import { Socket, Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { cacheService } from './redis.service.js';
import jwt from 'jsonwebtoken';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);
      
      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        
        // Join user-specific room
        socket.join(`user:${socket.userId}`);
        
        // Join role-specific room
        if (socket.userRole) {
          socket.join(`role:${socket.userRole}`);
        }
      }

      // Handle driver location updates
      socket.on('driver:location:update', async (data) => {
        if (socket.userRole === 'driver') {
          // Cache driver location
          await cacheService.setHash(
            `driver:${socket.userId}:location`,
            'current',
            JSON.stringify({
              lat: data.lat,
              lng: data.lng,
              timestamp: Date.now(),
              heading: data.heading,
              speed: data.speed
            })
          );

          // Broadcast to dispatchers and admins
          socket.to('role:dispatcher').to('role:admin').emit('driver:location:updated', {
            driverId: socket.userId,
            location: data
          });
        }
      });

      // Handle order status updates
      socket.on('order:status:update', async (data) => {
        const { orderId, status, location } = data;
        
        // Cache order status
        await cacheService.set(
          `order:${orderId}:status`,
          JSON.stringify({ status, timestamp: Date.now(), location }),
          3600 // 1 hour TTL
        );

        // Notify all relevant parties
        this.io.emit('order:status:updated', {
          orderId,
          status,
          location,
          timestamp: Date.now()
        });
      });

      // Handle real-time notifications
      socket.on('notification:send', (data) => {
        const { targetUserId, targetRole, message, type } = data;
        
        if (targetUserId) {
          // Send to specific user
          socket.to(`user:${targetUserId}`).emit('notification:received', {
            message,
            type,
            timestamp: Date.now()
          });
        } else if (targetRole) {
          // Send to all users with specific role
          socket.to(`role:${targetRole}`).emit('notification:received', {
            message,
            type,
            timestamp: Date.now()
          });
        }
      });

      // Handle chat messages
      socket.on('chat:message', async (data) => {
        const { orderId, message, recipientId } = data;
        
        // Store message in cache
        const messageData = {
          senderId: socket.userId,
          message,
          timestamp: Date.now(),
          orderId
        };
        
        await cacheService.setHash(
          `chat:${orderId}`,
          Date.now().toString(),
          JSON.stringify(messageData)
        );

        // Send to recipient
        if (recipientId) {
          socket.to(`user:${recipientId}`).emit('chat:message:received', messageData);
        }
        
        // Send to order participants
        socket.to(`order:${orderId}`).emit('chat:message:received', messageData);
      });

      // Handle joining order-specific rooms
      socket.on('order:join', (orderId) => {
        socket.join(`order:${orderId}`);
      });

      socket.on('order:leave', (orderId) => {
        socket.leave(`order:${orderId}`);
      });

      // Handle geofence events
      socket.on('geofence:enter', async (data) => {
        const { geofenceId, driverId, orderId } = data;
        
        // Cache geofence event
        await cacheService.set(
          `geofence:${geofenceId}:last_entry`,
          JSON.stringify({ driverId, orderId, timestamp: Date.now() }),
          3600
        );

        // Notify relevant parties
        this.io.emit('geofence:entered', {
          geofenceId,
          driverId,
          orderId,
          timestamp: Date.now()
        });
      });

      socket.on('geofence:exit', async (data) => {
        const { geofenceId, driverId, orderId } = data;
        
        // Cache geofence event
        await cacheService.set(
          `geofence:${geofenceId}:last_exit`,
          JSON.stringify({ driverId, orderId, timestamp: Date.now() }),
          3600
        );

        // Notify relevant parties
        this.io.emit('geofence:exited', {
          geofenceId,
          driverId,
          orderId,
          timestamp: Date.now()
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          
          // Update driver status to offline if it's a driver
          if (socket.userRole === 'driver') {
            cacheService.set(`driver:${socket.userId}:status`, 'offline', 300); // 5 min TTL
          }
        }
      });
    });
  }

  // Public methods for sending messages from API routes
  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public sendToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  public sendToOrder(orderId: string, event: string, data: any) {
    this.io.to(`order:${orderId}`).emit(event, data);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Real-time analytics
  public async getDriverLocations(): Promise<any[]> {
    const drivers = [];
    for (const [userId] of this.connectedUsers) {
      const location = await cacheService.getAllHash(`driver:${userId}:location`);
      if (location && location.current) {
        drivers.push({
          driverId: userId,
          location: JSON.parse(location.current)
        });
      }
    }
    return drivers;
  }

  public getConnectionStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      connectedUsers: this.connectedUsers.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }
}

export let webSocketService: WebSocketService;