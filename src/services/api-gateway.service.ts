import { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import logger from '@common/utils/logger';
import config from '@/config';
import { serviceDiscoveryService } from './service-discovery.service';
import { eventService } from './event.service';

interface RouteConfig {
  path: string;
  service: string;
  method: string;
  auth: boolean;
  rateLimit?: number;
  timeout?: number;
  transform?: boolean;
}

interface ServiceResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
  service: string;
  responseTime: number;
}

class ApiGatewayService {
  private routes: Map<string, RouteConfig> = new Map();
  // Circuit breakers functionality can be implemented later
  // private circuitBreakers: Map<string, any> = new Map();
  private requestCounters: Map<string, number> = new Map();

  constructor() {
    this.setupDefaultRoutes();
  }

  /**
   * Setup default routes
   */
  private setupDefaultRoutes(): void {
    // User service routes
    this.addRoute({
      path: '/api/v1/users',
      service: 'user-service',
      method: 'GET',
      auth: true,
      rateLimit: 100,
      timeout: 5000,
    });

    this.addRoute({
      path: '/api/v1/users/register',
      service: 'user-service',
      method: 'POST',
      auth: false,
      rateLimit: 10,
      timeout: 5000,
    });

    this.addRoute({
      path: '/api/v1/users/login',
      service: 'user-service',
      method: 'POST',
      auth: false,
      rateLimit: 10,
      timeout: 5000,
    });

    // Auth service routes
    this.addRoute({
      path: '/api/v1/auth',
      service: 'auth-service',
      method: 'GET',
      auth: true,
      rateLimit: 100,
      timeout: 3000,
    });

    // Notification service routes
    this.addRoute({
      path: '/api/v1/notifications',
      service: 'notification-service',
      method: 'GET',
      auth: true,
      rateLimit: 50,
      timeout: 3000,
    });

    this.addRoute({
      path: '/api/v1/notifications/send',
      service: 'notification-service',
      method: 'POST',
      auth: true,
      rateLimit: 20,
      timeout: 5000,
    });

    logger.info('API Gateway routes configured');
  }

  /**
   * Add a route configuration
   */
  addRoute(config: RouteConfig): void {
    const routeKey = `${config.method}:${config.path}`;
    this.routes.set(routeKey, config);
    logger.info(`Route added: ${config.method} ${config.path} -> ${config.service}`);
  }

  /**
   * Get route configuration
   */
  getRoute(method: string, path: string): RouteConfig | null {
    const routeKey = `${method}:${path}`;
    return this.routes.get(routeKey) || null;
  }

  /**
   * Route request to appropriate service
   */
  async routeRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const routeConfig = this.getRoute(req.method, req.path);

    if (!routeConfig) {
      return next();
    }

    try {
      // Check rate limiting
      if (!this.checkRateLimit(routeConfig)) {
        res.status(429).json({
          status: 'error',
          statusCode: 429,
          message: 'Rate limit exceeded',
        });
        return;
      }

      // Authenticate request if required
      if (routeConfig.auth && !this.authenticateRequest(req)) {
        res.status(401).json({
          status: 'error',
          statusCode: 401,
          message: 'Authentication required',
        });
        return;
      }

      // Get service endpoint
      const serviceEndpoint = serviceDiscoveryService.getServiceEndpoint(routeConfig.service);

      if (!serviceEndpoint) {
        res.status(503).json({
          status: 'error',
          statusCode: 503,
          message: 'Service unavailable',
        });
        return;
      }

      // Forward request to service
      const response = await this.forwardRequest(req, serviceEndpoint, routeConfig);

      // Transform response if needed
      const transformedResponse = routeConfig.transform
        ? this.transformResponse(response, routeConfig)
        : response;

      // Send response
      res
        .status(transformedResponse.status)
        .set(transformedResponse.headers)
        .json(transformedResponse.data);

      // Log request
      this.logRequest(req, response, routeConfig);

      // Emit request event
      await eventService.emitEvent('gateway.request_processed', {
        path: req.path,
        method: req.method,
        service: routeConfig.service,
        responseTime: response.responseTime,
        statusCode: response.status,
      });
    } catch (error) {
      logger.error({ error }, 'API Gateway error');

      res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Internal gateway error',
      });
    }
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(routeConfig: RouteConfig): boolean {
    if (!routeConfig.rateLimit) return true;

    const key = `${routeConfig.service}:${routeConfig.path}`;
    const currentCount = this.requestCounters.get(key) || 0;

    if (currentCount >= routeConfig.rateLimit) {
      return false;
    }

    this.requestCounters.set(key, currentCount + 1);

    // Reset counter after 1 minute
    setTimeout(() => {
      this.requestCounters.set(key, Math.max(0, (this.requestCounters.get(key) || 0) - 1));
    }, 60000);

    return true;
  }

  /**
   * Authenticate request
   */
  private authenticateRequest(req: Request): boolean {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      // Add user info to request
      (req as any).user = decoded;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Forward request to service
   */
  private async forwardRequest(
    req: Request,
    serviceEndpoint: string,
    routeConfig: RouteConfig
  ): Promise<ServiceResponse> {
    const startTime = Date.now();

    const url = `${serviceEndpoint}${req.path}`;
    const headers = this.prepareHeaders(req);

    const axiosConfig = {
      method: req.method,
      url,
      headers,
      data: req.body,
      params: req.query,
      timeout: routeConfig.timeout || 5000,
    };

    try {
      const response: AxiosResponse = await axios(axiosConfig);

      const responseTime = Date.now() - startTime;

      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
        service: routeConfig.service,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      if (error.response) {
        // Service responded with error
        return {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers as Record<string, string>,
          service: routeConfig.service,
          responseTime,
        };
      } else {
        // Network error or timeout
        throw new Error(`Service ${routeConfig.service} is unavailable`);
      }
    }
  }

  /**
   * Prepare headers for service request
   */
  private prepareHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': req.get('User-Agent') || 'API-Gateway',
      'X-Forwarded-For': req.ip || req.connection.remoteAddress || '',
      'X-Request-ID': (req.headers['x-request-id'] as string) || this.generateRequestId(),
    };

    // Forward user info if authenticated
    if ((req as any).user) {
      headers['X-User-ID'] = (req as any).user.userId;
      headers['X-User-Email'] = (req as any).user.email;
    }

    // Forward authorization header
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    return headers;
  }

  /**
   * Transform response
   */
  private transformResponse(response: ServiceResponse, _routeConfig: RouteConfig): ServiceResponse {
    // Add gateway metadata
    const transformedData = {
      ...response.data,
      _gateway: {
        service: response.service,
        responseTime: response.responseTime,
        timestamp: new Date().toISOString(),
      },
    };

    return {
      ...response,
      data: transformedData,
    };
  }

  /**
   * Log request
   */
  private logRequest(req: Request, response: ServiceResponse, _routeConfig: RouteConfig): void {
    logger.info({
      method: req.method,
      path: req.path,
      service: response.service,
      statusCode: response.status,
      responseTime: response.responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get gateway statistics
   */
  getStatistics(): Record<string, any> {
    const routes = Array.from(this.routes.values());
    const requestCounts = Array.from(this.requestCounters.entries());

    return {
      totalRoutes: routes.length,
      routesByService: this.groupRoutesByService(routes),
      requestCounts,
      activeServices: serviceDiscoveryService.getAllServices().length,
    };
  }

  /**
   * Group routes by service
   */
  private groupRoutesByService(routes: RouteConfig[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    routes.forEach((route) => {
      grouped[route.service] = (grouped[route.service] || 0) + 1;
    });

    return grouped;
  }

  /**
   * Health check for gateway
   */
  async healthCheck(): Promise<Record<string, any>> {
    const services = serviceDiscoveryService.getAllServices();
    const healthyServices = services.filter((s) => s.health === 'healthy');

    return {
      status: healthyServices.length > 0 ? 'healthy' : 'unhealthy',
      totalServices: services.length,
      healthyServices: healthyServices.length,
      routes: this.routes.size,
      uptime: process.uptime(),
    };
  }

  /**
   * Get service endpoints
   */
  getServiceEndpoints(): Record<string, string[]> {
    const endpoints: Record<string, string[]> = {};

    Array.from(this.routes.values()).forEach((route) => {
      if (!endpoints[route.service]) {
        endpoints[route.service] = [];
      }
      endpoints[route.service].push(`${route.method} ${route.path}`);
    });

    return endpoints;
  }
}

// Export singleton instance
export const apiGatewayService = new ApiGatewayService();
export default apiGatewayService;
