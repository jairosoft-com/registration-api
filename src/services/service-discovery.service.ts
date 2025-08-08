import { EventEmitter } from 'events';
import logger from '@common/utils/logger';
import { eventService } from './event.service';

interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  health: 'healthy' | 'unhealthy' | 'degraded';
  lastHeartbeat: Date;
  metadata: Record<string, any>;
  endpoints: string[];
}

interface ServiceRegistry {
  [serviceId: string]: ServiceInfo;
}

class ServiceDiscoveryService extends EventEmitter {
  private services: ServiceRegistry = {};
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly heartbeatIntervalMs = 30000; // 30 seconds
  private readonly healthCheckIntervalMs = 60000; // 1 minute
  private readonly serviceTimeoutMs = 90000; // 1.5 minutes

  constructor() {
    super();
    this.startHeartbeat();
    this.startHealthChecks();
  }

  /**
   * Register a service
   */
  registerService(serviceInfo: Omit<ServiceInfo, 'lastHeartbeat'>): void {
    const service: ServiceInfo = {
      ...serviceInfo,
      lastHeartbeat: new Date(),
    };

    this.services[serviceInfo.id] = service;

    logger.info(
      `Service registered: ${serviceInfo.name} (${serviceInfo.id}) at ${serviceInfo.host}:${serviceInfo.port}`
    );

    // Emit service registration event
    eventService.emitEvent('service.registered', {
      serviceId: serviceInfo.id,
      serviceName: serviceInfo.name,
      host: serviceInfo.host,
      port: serviceInfo.port,
    });

    this.emit('service:registered', service);
  }

  /**
   * Deregister a service
   */
  deregisterService(serviceId: string): void {
    const service = this.services[serviceId];
    if (service) {
      delete this.services[serviceId];

      logger.info(`Service deregistered: ${service.name} (${serviceId})`);

      // Emit service deregistration event
      eventService.emitEvent('service.deregistered', {
        serviceId,
        serviceName: service.name,
      });

      this.emit('service:deregistered', service);
    }
  }

  /**
   * Update service heartbeat
   */
  updateHeartbeat(serviceId: string): void {
    const service = this.services[serviceId];
    if (service) {
      service.lastHeartbeat = new Date();
      logger.debug(`Heartbeat updated for service: ${service.name} (${serviceId})`);
    }
  }

  /**
   * Update service health
   */
  updateServiceHealth(serviceId: string, health: 'healthy' | 'unhealthy' | 'degraded'): void {
    const service = this.services[serviceId];
    if (service) {
      const previousHealth = service.health;
      service.health = health;

      if (previousHealth !== health) {
        logger.info(
          `Service health changed: ${service.name} (${serviceId}) ${previousHealth} -> ${health}`
        );

        // Emit health change event
        eventService.emitEvent('service.health_changed', {
          serviceId,
          serviceName: service.name,
          previousHealth,
          currentHealth: health,
        });

        this.emit('service:health_changed', service, previousHealth, health);
      }
    }
  }

  /**
   * Get all registered services
   */
  getAllServices(): ServiceInfo[] {
    return Object.values(this.services);
  }

  /**
   * Get service by ID
   */
  getService(serviceId: string): ServiceInfo | null {
    return this.services[serviceId] || null;
  }

  /**
   * Get services by name
   */
  getServicesByName(name: string): ServiceInfo[] {
    return Object.values(this.services).filter((service) => service.name === name);
  }

  /**
   * Get healthy services by name
   */
  getHealthyServicesByName(name: string): ServiceInfo[] {
    return this.getServicesByName(name).filter((service) => service.health === 'healthy');
  }

  /**
   * Get service endpoint for load balancing
   */
  getServiceEndpoint(
    serviceName: string,
    loadBalancingStrategy: 'round-robin' | 'least-connections' | 'random' = 'round-robin'
  ): string | null {
    const healthyServices = this.getHealthyServicesByName(serviceName);

    if (healthyServices.length === 0) {
      return null;
    }

    switch (loadBalancingStrategy) {
      case 'round-robin':
        return this.roundRobinLoadBalancer(healthyServices);
      case 'least-connections':
        return this.leastConnectionsLoadBalancer(healthyServices);
      case 'random':
        return this.randomLoadBalancer(healthyServices);
      default:
        return this.roundRobinLoadBalancer(healthyServices);
    }
  }

  /**
   * Round-robin load balancer
   */
  private roundRobinLoadBalancer(services: ServiceInfo[]): string {
    // Simple round-robin implementation
    const index = Math.floor(Math.random() * services.length); // For now, using random
    const service = services[index];
    return `http://${service.host}:${service.port}`;
  }

  /**
   * Least connections load balancer
   */
  private leastConnectionsLoadBalancer(services: ServiceInfo[]): string {
    // For now, return the first healthy service
    // In a real implementation, you'd track connection counts
    const service = services[0];
    return `http://${service.host}:${service.port}`;
  }

  /**
   * Random load balancer
   */
  private randomLoadBalancer(services: ServiceInfo[]): string {
    const service = services[Math.floor(Math.random() * services.length)];
    return `http://${service.host}:${service.port}`;
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.emit('heartbeat', {
        timestamp: new Date().toISOString(),
        serviceCount: Object.keys(this.services).length,
      });
    }, this.heartbeatIntervalMs);

    logger.info('Service discovery heartbeat started');
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckIntervalMs);

    logger.info('Service discovery health checks started');
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const now = new Date();

    for (const [serviceId, service] of Object.entries(this.services)) {
      const timeSinceLastHeartbeat = now.getTime() - service.lastHeartbeat.getTime();

      if (timeSinceLastHeartbeat > this.serviceTimeoutMs) {
        // Service is considered unhealthy
        this.updateServiceHealth(serviceId, 'unhealthy');

        logger.warn(
          `Service ${service.name} (${serviceId}) is unhealthy - no heartbeat for ${timeSinceLastHeartbeat}ms`
        );

        // Emit service unhealthy event
        eventService.emitEvent('service.unhealthy', {
          serviceId,
          serviceName: service.name,
          timeSinceLastHeartbeat,
        });
      } else if (timeSinceLastHeartbeat > this.heartbeatIntervalMs * 2) {
        // Service is degraded
        this.updateServiceHealth(serviceId, 'degraded');

        logger.warn(`Service ${service.name} (${serviceId}) is degraded - delayed heartbeat`);
      } else {
        // Service is healthy
        this.updateServiceHealth(serviceId, 'healthy');
      }
    }
  }

  /**
   * Get service discovery statistics
   */
  getStatistics(): Record<string, any> {
    const services = Object.values(this.services);
    const healthyServices = services.filter((s) => s.health === 'healthy');
    const unhealthyServices = services.filter((s) => s.health === 'unhealthy');
    const degradedServices = services.filter((s) => s.health === 'degraded');

    return {
      totalServices: services.length,
      healthyServices: healthyServices.length,
      unhealthyServices: unhealthyServices.length,
      degradedServices: degradedServices.length,
      servicesByType: this.getServicesByType(),
      averageResponseTime: this.calculateAverageResponseTime(),
    };
  }

  /**
   * Get services grouped by type
   */
  private getServicesByType(): Record<string, number> {
    const serviceTypes: Record<string, number> = {};

    Object.values(this.services).forEach((service) => {
      const type = service.name.split('-')[0] || 'unknown';
      serviceTypes[type] = (serviceTypes[type] || 0) + 1;
    });

    return serviceTypes;
  }

  /**
   * Calculate average response time (placeholder)
   */
  private calculateAverageResponseTime(): number {
    // In a real implementation, you'd track actual response times
    return 150; // Placeholder: 150ms average
  }

  /**
   * Stop the service discovery service
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    logger.info('Service discovery service stopped');
  }

  /**
   * Clean up expired services
   */
  cleanupExpiredServices(): void {
    const now = new Date();
    const expiredServices: string[] = [];

    for (const [serviceId, service] of Object.entries(this.services)) {
      const timeSinceLastHeartbeat = now.getTime() - service.lastHeartbeat.getTime();

      if (timeSinceLastHeartbeat > this.serviceTimeoutMs * 2) {
        expiredServices.push(serviceId);
      }
    }

    expiredServices.forEach((serviceId) => {
      this.deregisterService(serviceId);
      logger.info(`Expired service removed: ${serviceId}`);
    });
  }
}

// Export singleton instance
export const serviceDiscoveryService = new ServiceDiscoveryService();
export default serviceDiscoveryService;
