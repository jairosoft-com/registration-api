import { BaseComponent } from '@common/base/BaseComponent';
import { IComponentMetadata } from '@common/types/component';
import healthRouter from './health.routes';

/**
 * Health Component
 * Provides health check endpoints for monitoring application status
 */
class HealthComponent extends BaseComponent {
  constructor() {
    const metadata: IComponentMetadata = {
      name: 'health',
      version: '1',
      description: 'Health check and monitoring endpoints',
      enabled: true,
      dependencies: [],
      tags: ['monitoring', 'health', 'status'],
    };

    super(metadata);
  }

  /**
   * Initialize component routes
   */
  protected initializeRoutes(): void {
    // Apply routes to the component router
    this.router.use('/', healthRouter);
  }

  /**
   * Initialize component
   */
  public async initialize(): Promise<void> {
    await super.initialize();

    // Health component doesn't need special initialization
    this.logger.info('Health component ready');
  }

  /**
   * Shutdown component
   */
  public async shutdown(): Promise<void> {
    await super.shutdown();

    // Health component doesn't need special cleanup
    this.logger.info('Health component shutdown complete');
  }
}

// Export component instance
export default new HealthComponent();
