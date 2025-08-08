import { BaseComponent } from '@common/base/BaseComponent';
import { IComponentMetadata } from '@common/types/component';
import userRouter from './users.routes';

/**
 * Users Component
 * Handles user management and authentication
 */
class UsersComponent extends BaseComponent {
  constructor() {
    const metadata: IComponentMetadata = {
      name: 'users',
      version: '1',
      description: 'User management and authentication',
      enabled: true,
      dependencies: [],
      tags: ['users', 'authentication', 'auth'],
    };

    super(metadata);
  }

  /**
   * Initialize component routes
   */
  protected initializeRoutes(): void {
    // Use the existing user router
    this.router.use('/', userRouter);
  }

  /**
   * Initialize component
   */
  public async initialize(): Promise<void> {
    await super.initialize();

    this.logger.info('Users component ready');
  }

  /**
   * Shutdown component
   */
  public async shutdown(): Promise<void> {
    await super.shutdown();

    this.logger.info('Users component shutdown complete');
  }
}

// Export component instance
export default new UsersComponent();
