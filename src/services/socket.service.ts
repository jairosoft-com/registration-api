import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import logger from '@common/utils/logger';
import config from '@/config';

interface SocketUser {
  userId: string;
  email: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface LiveUpdate {
  id: string;
  type: 'user_activity' | 'system_update' | 'data_change';
  data: any;
  timestamp: Date;
  broadcast: boolean;
}

// Public interface for SocketService to use in other services
export interface ISocketService {
  io: SocketIOServer | null;
  broadcastUserStatus(userId: string, status: 'online' | 'offline'): void;
  sendNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): void;
  broadcastLiveUpdate(update: Omit<LiveUpdate, 'id' | 'timestamp'>): void;
}

class SocketService implements ISocketService {
  public io: SocketIOServer | null = null; // Made public for interface
  private connectedUsers: Map<string, SocketUser> = new Map();
  private notifications: Map<string, Notification[]> = new Map();
  private liveUpdates: LiveUpdate[] = [];

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    logger.info('Socket.IO server initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const cleanToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(cleanToken, config.jwt.secret) as any;

        socket.data.userId = decoded.userId;
        socket.data.email = decoded.email;

        next();
      } catch (error) {
        logger.error({ error }, 'Socket authentication failed');
        next(new Error('Invalid authentication token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: any): void {
    const userId = socket.data.userId;
    const email = socket.data.email;

    // Store user connection
    const user: SocketUser = {
      userId,
      email,
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connectedUsers.set(userId, user);
    logger.info(`User ${email} connected via socket ${socket.id}`);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Send pending notifications
    this.sendPendingNotifications(userId);

    // Setup socket event handlers
    this.setupSocketEventHandlers(socket);

    // Emit connection event
    socket.emit('connected', {
      message: 'Successfully connected to real-time service',
      userId,
      timestamp: new Date().toISOString(),
    });

    // Broadcast user online status
    this.broadcastUserStatus(userId, 'online');
  }

  /**
   * Setup individual socket event handlers
   */
  private setupSocketEventHandlers(socket: any): void {
    const userId = socket.data.userId;

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(userId, socket.id);
    });

    // Handle user activity
    socket.on('user_activity', (data: any) => {
      this.handleUserActivity(userId, data);
    });

    // Handle notification acknowledgment
    socket.on('notification_read', (notificationId: string) => {
      this.markNotificationAsRead(userId, notificationId);
    });

    // Handle custom events
    socket.on('custom_event', (data: any) => {
      this.handleCustomEvent(userId, data);
    });

    // Handle typing indicators
    socket.on('typing_start', (data: any) => {
      this.handleTypingIndicator(userId, 'start', data);
    });

    socket.on('typing_stop', (data: any) => {
      this.handleTypingIndicator(userId, 'stop', data);
    });

    // Handle presence updates
    socket.on('presence_update', (data: any) => {
      this.handlePresenceUpdate(userId, data);
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(userId: string, socketId: string): void {
    const user = this.connectedUsers.get(userId);
    if (user && user.socketId === socketId) {
      this.connectedUsers.delete(userId);
      logger.info(`User ${user.email} disconnected`);

      // Broadcast user offline status
      this.broadcastUserStatus(userId, 'offline');
    }
  }

  /**
   * Handle user activity
   */
  private handleUserActivity(userId: string, data: any): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      user.lastActivity = new Date();
      this.connectedUsers.set(userId, user);

      // Broadcast activity to relevant users
      this.broadcastUserActivity(userId, data);
    }
  }

  /**
   * Handle custom events
   */
  private handleCustomEvent(userId: string, data: any): void {
    logger.info(`Custom event from user ${userId}:`, data);

    // Process custom event based on type
    switch (data.type) {
      case 'data_update':
        this.handleDataUpdate(userId, data);
        break;
      case 'system_interaction':
        this.handleSystemInteraction(userId, data);
        break;
      default:
        logger.warn(`Unknown custom event type: ${data.type}`);
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(userId: string, action: 'start' | 'stop', data: any): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      // Broadcast typing indicator to relevant users
      this.io?.to(`room:${data.roomId}`).emit('typing_indicator', {
        userId,
        userEmail: user.email,
        action,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle presence updates
   */
  private handlePresenceUpdate(userId: string, data: any): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      // Update user presence
      this.broadcastPresenceUpdate(userId, data.status, data.message);
    }
  }

  /**
   * Send notification to user
   */
  sendNotification(userId: string, notification: Omit<Notification, 'id' | 'createdAt'>): void {
    const fullNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(fullNotification);

    // Send to connected user
    this.io?.to(`user:${userId}`).emit('notification', fullNotification);

    logger.info(`Notification sent to user ${userId}: ${notification.title}`);
  }

  /**
   * Send pending notifications to user
   */
  private sendPendingNotifications(userId: string): void {
    const userNotifications = this.notifications.get(userId) || [];
    const unreadNotifications = userNotifications.filter((n) => !n.read);

    if (unreadNotifications.length > 0) {
      this.io?.to(`user:${userId}`).emit('pending_notifications', unreadNotifications);
      logger.info(`Sent ${unreadNotifications.length} pending notifications to user ${userId}`);
    }
  }

  /**
   * Mark notification as read
   */
  private markNotificationAsRead(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.read = true;
      logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
    }
  }

  /**
   * Broadcast user status
   */
  public broadcastUserStatus(userId: string, status: 'online' | 'offline'): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io?.emit('user_status', {
        userId,
        email: user.email,
        status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Broadcast user activity
   */
  private broadcastUserActivity(userId: string, data: any): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io?.emit('user_activity', {
        userId,
        email: user.email,
        activity: data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Broadcast presence update
   */
  private broadcastPresenceUpdate(userId: string, status: string, message?: string): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io?.emit('presence_update', {
        userId,
        email: user.email,
        status,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle data updates
   */
  private handleDataUpdate(userId: string, data: any): void {
    const liveUpdate: LiveUpdate = {
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'data_change',
      data,
      timestamp: new Date(),
      broadcast: true,
    };

    this.liveUpdates.push(liveUpdate);

    // Broadcast to all connected users
    this.io?.emit('data_update', liveUpdate);

    logger.info(`Data update broadcasted by user ${userId}`);
  }

  /**
   * Handle system interactions
   */
  private handleSystemInteraction(userId: string, data: any): void {
    // Process system interaction
    logger.info(`System interaction from user ${userId}:`, data);

    // Send acknowledgment
    this.io?.to(`user:${userId}`).emit('system_interaction_ack', {
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users list
   */
  getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get user notifications
   */
  getUserNotifications(userId: string): Notification[] {
    return this.notifications.get(userId) || [];
  }

  /**
   * Get live updates
   */
  getLiveUpdates(): LiveUpdate[] {
    return this.liveUpdates;
  }

  /**
   * Broadcast system message
   */
  broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    const systemMessage = {
      type: 'system_message',
      message,
      severity: type,
      timestamp: new Date().toISOString(),
    };

    this.io?.emit('system_message', systemMessage);
    logger.info(`System message broadcasted: ${message}`);
  }

  /**
   * Join user to room
   */
  joinRoom(userId: string, roomId: string): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io?.sockets.sockets.get(user.socketId)?.join(`room:${roomId}`);
      logger.info(`User ${userId} joined room ${roomId}`);
    }
  }

  /**
   * Leave user from room
   */
  leaveRoom(userId: string, roomId: string): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io?.sockets.sockets.get(user.socketId)?.leave(`room:${roomId}`);
      logger.info(`User ${userId} left room ${roomId}`);
    }
  }

  /**
   * Send message to room
   */
  sendToRoom(roomId: string, event: string, data: any): void {
    this.io?.to(`room:${roomId}`).emit(event, data);
    logger.info(`Message sent to room ${roomId}: ${event}`);
  }

  /**
   * Disconnect user
   */
  disconnectUser(userId: string): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io?.sockets.sockets.get(user.socketId)?.disconnect();
      this.connectedUsers.delete(userId);
      logger.info(`User ${userId} forcefully disconnected`);
    }
  }

  /**
   * Broadcast live update to all connected clients
   * Implements the ISocketService interface method
   */
  public broadcastLiveUpdate(update: Omit<LiveUpdate, 'id' | 'timestamp'>): void {
    const liveUpdate: LiveUpdate = {
      id: `update_${Date.now()}`,
      ...update,
      timestamp: new Date(),
      broadcast: true,
    };

    // Store the update
    this.liveUpdates.push(liveUpdate);

    // Keep only last 100 updates
    if (this.liveUpdates.length > 100) {
      this.liveUpdates.shift();
    }

    // Broadcast to all connected clients
    this.io?.emit('live_update', liveUpdate);

    logger.info({ updateType: update.type }, 'Live update broadcasted');
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
