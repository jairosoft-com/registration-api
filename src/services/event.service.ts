import { EventEmitter } from 'events';
import logger from '@common/utils/logger';
import { socketService } from './socket.service';

interface EventData {
  id: string;
  type: string;
  userId?: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface EventLog {
  id: string;
  eventId: string;
  eventType: string;
  userId?: string;
  data: any;
  timestamp: Date;
  processed: boolean;
  retryCount: number;
  error?: string;
}

interface EventHandler {
  eventType: string;
  handler: (event: EventData) => Promise<void>;
  priority: number;
  retryable: boolean;
  maxRetries: number;
}

class EventService extends EventEmitter {
  private events: EventData[] = [];
  private eventLogs: EventLog[] = [];
  private handlers: Map<string, EventHandler[]> = new Map();
  private isReplaying = false;
  private maxEventHistory = 1000;

  constructor() {
    super();
    this.setupDefaultHandlers();
  }

  /**
   * Setup default event handlers
   */
  private setupDefaultHandlers(): void {
    // User events
    this.registerHandler('user.registered', this.handleUserRegistered.bind(this), 1);
    this.registerHandler('user.logged_in', this.handleUserLoggedIn.bind(this), 1);
    this.registerHandler('user.logged_out', this.handleUserLoggedOut.bind(this), 1);
    this.registerHandler('user.updated', this.handleUserUpdated.bind(this), 1);

    // System events
    this.registerHandler('system.startup', this.handleSystemStartup.bind(this), 1);
    this.registerHandler('system.shutdown', this.handleSystemShutdown.bind(this), 1);
    this.registerHandler('system.error', this.handleSystemError.bind(this), 1);

    // Data events
    this.registerHandler('data.created', this.handleDataCreated.bind(this), 1);
    this.registerHandler('data.updated', this.handleDataUpdated.bind(this), 1);
    this.registerHandler('data.deleted', this.handleDataDeleted.bind(this), 1);

    // Notification events
    this.registerHandler('notification.sent', this.handleNotificationSent.bind(this), 1);
    this.registerHandler('notification.read', this.handleNotificationRead.bind(this), 1);
  }

  /**
   * Register an event handler
   */
  registerHandler(
    eventType: string,
    handler: (event: EventData) => Promise<void>,
    priority: number = 1,
    retryable: boolean = true,
    maxRetries: number = 3
  ): void {
    const eventHandler: EventHandler = {
      eventType,
      handler,
      priority,
      retryable,
      maxRetries,
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(eventHandler);

    // Sort handlers by priority (higher priority first)
    this.handlers.get(eventType)!.sort((a, b) => b.priority - a.priority);

    logger.info(`Event handler registered for ${eventType} with priority ${priority}`);
  }

  /**
   * Emit an event
   */
  async emitEvent(
    eventType: string,
    data: any,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: EventData = {
      id: eventId,
      type: eventType,
      userId,
      data,
      timestamp: new Date(),
      metadata,
    };

    // Store event
    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEventHistory) {
      this.events = this.events.slice(-this.maxEventHistory);
    }

    // Log event
    const eventLog: EventLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      eventType,
      userId,
      data,
      timestamp: new Date(),
      processed: false,
      retryCount: 0,
    };

    this.eventLogs.push(eventLog);

    // Emit to internal listeners
    this.emit(eventType, event);

    // Process event handlers
    await this.processEvent(event);

    logger.info(`Event emitted: ${eventType} (${eventId})`);
    return eventId;
  }

  /**
   * Process an event through its handlers
   */
  private async processEvent(event: EventData): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    for (const handler of handlers) {
      try {
        await handler.handler(event);

        // Mark as processed
        const eventLog = this.eventLogs.find((log) => log.eventId === event.id);
        if (eventLog) {
          eventLog.processed = true;
        }

        logger.debug(`Event ${event.type} processed by handler`);
      } catch (error) {
        logger.error({ error }, `Error processing event ${event.type}`);

        // Update event log with error
        const eventLog = this.eventLogs.find((log) => log.eventId === event.id);
        if (eventLog && handler.retryable && eventLog.retryCount < handler.maxRetries) {
          eventLog.retryCount++;
          eventLog.error = error instanceof Error ? error.message : 'Unknown error';

          // Schedule retry
          setTimeout(
            () => {
              this.processEvent(event);
            },
            Math.pow(2, eventLog.retryCount) * 1000
          ); // Exponential backoff
        }
      }
    }
  }

  /**
   * Replay events from a specific timestamp
   */
  async replayEvents(fromTimestamp: Date): Promise<void> {
    if (this.isReplaying) {
      throw new Error('Event replay already in progress');
    }

    this.isReplaying = true;
    logger.info(`Starting event replay from ${fromTimestamp.toISOString()}`);

    const eventsToReplay = this.events.filter((event) => event.timestamp >= fromTimestamp);

    for (const event of eventsToReplay) {
      try {
        await this.processEvent(event);
        logger.debug(`Replayed event: ${event.type} (${event.id})`);
      } catch (error) {
        logger.error({ error }, `Error replaying event ${event.type}`);
      }
    }

    this.isReplaying = false;
    logger.info(`Event replay completed. Replayed ${eventsToReplay.length} events`);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): EventData[] {
    return this.events.filter((event) => event.type === eventType);
  }

  /**
   * Get events by user
   */
  getEventsByUser(userId: string): EventData[] {
    return this.events.filter((event) => event.userId === userId);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): EventData[] {
    return this.events.slice(-limit);
  }

  /**
   * Get event statistics
   */
  getEventStatistics(): Record<string, any> {
    const eventCounts: Record<string, number> = {};
    const userEventCounts: Record<string, number> = {};

    this.events.forEach((event) => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      if (event.userId) {
        userEventCounts[event.userId] = (userEventCounts[event.userId] || 0) + 1;
      }
    });

    return {
      totalEvents: this.events.length,
      eventTypes: Object.keys(eventCounts).length,
      eventCounts,
      userEventCounts,
      recentActivity: this.events.slice(-10).map((event) => ({
        type: event.type,
        userId: event.userId,
        timestamp: event.timestamp,
      })),
    };
  }

  /**
   * Clear old events
   */
  clearOldEvents(olderThan: Date): void {
    const initialCount = this.events.length;
    this.events = this.events.filter((event) => event.timestamp >= olderThan);
    const removedCount = initialCount - this.events.length;

    logger.info(`Cleared ${removedCount} old events`);
  }

  // Default event handlers

  private async handleUserRegistered(event: EventData): Promise<void> {
    logger.info(`User registered: ${event.userId}`);

    // Send welcome notification
    if (event.userId) {
      socketService.sendNotification(event.userId, {
        userId: event.userId,
        type: 'success',
        title: 'Welcome!',
        message: 'Your account has been successfully created.',
        read: false,
      });
    }

    // Broadcast system message
    socketService.broadcastSystemMessage('New user registered', 'info');
  }

  private async handleUserLoggedIn(event: EventData): Promise<void> {
    logger.info(`User logged in: ${event.userId}`);

    // Update user status
    if (event.userId) {
      // Use public API to broadcast user status
      socketService.broadcastUserStatus(event.userId, 'online');
    }
  }

  private async handleUserLoggedOut(event: EventData): Promise<void> {
    logger.info(`User logged out: ${event.userId}`);

    // Update user status
    if (event.userId) {
      // Use public API to broadcast user status
      socketService.broadcastUserStatus(event.userId, 'offline');
    }
  }

  private async handleUserUpdated(event: EventData): Promise<void> {
    logger.info(`User updated: ${event.userId}`);

    // Broadcast user update
    if (event.userId) {
      socketService.sendToRoom('user_updates', 'user_updated', {
        userId: event.userId,
        data: event.data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleSystemStartup(_event: EventData): Promise<void> {
    logger.info('System startup event processed');
    socketService.broadcastSystemMessage('System is starting up', 'info');
  }

  private async handleSystemShutdown(_event: EventData): Promise<void> {
    logger.info('System shutdown event processed');
    socketService.broadcastSystemMessage('System is shutting down', 'warning');
  }

  private async handleSystemError(event: EventData): Promise<void> {
    logger.error('System error event processed:', event.data);
    socketService.broadcastSystemMessage('System error occurred', 'error');
  }

  private async handleDataCreated(event: EventData): Promise<void> {
    logger.info(`Data created: ${event.type}`);

    // Broadcast data creation
    socketService.io?.emit('data_created', {
      type: event.type,
      data: event.data,
      userId: event.userId,
      timestamp: new Date().toISOString(),
    });
  }

  private async handleDataUpdated(event: EventData): Promise<void> {
    logger.info(`Data updated: ${event.type}`);

    // Broadcast data update
    socketService.io?.emit('data_updated', {
      type: event.type,
      data: event.data,
      userId: event.userId,
      timestamp: new Date().toISOString(),
    });
  }

  private async handleDataDeleted(event: EventData): Promise<void> {
    logger.info(`Data deleted: ${event.type}`);

    // Broadcast data deletion
    socketService.io?.emit('data_deleted', {
      type: event.type,
      data: event.data,
      userId: event.userId,
      timestamp: new Date().toISOString(),
    });
  }

  private async handleNotificationSent(event: EventData): Promise<void> {
    logger.info(`Notification sent: ${event.data.title}`);

    // Broadcast notification event
    socketService.io?.emit('notification_sent', {
      userId: event.userId,
      notification: event.data,
      timestamp: new Date().toISOString(),
    });
  }

  private async handleNotificationRead(event: EventData): Promise<void> {
    logger.info(`Notification read: ${event.data.notificationId}`);

    // Broadcast notification read event
    socketService.io?.emit('notification_read', {
      userId: event.userId,
      notificationId: event.data.notificationId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const eventService = new EventService();
export default eventService;
