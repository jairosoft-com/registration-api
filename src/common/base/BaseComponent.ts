import { Router } from 'express';
import { IComponent, IComponentMetadata } from '@common/types/component';
import { createChildLogger } from '@common/utils/logger';
import { Logger } from 'pino';

/**
 * Abstract base class for all components
 * Provides common functionality and structure for components
 */
export abstract class BaseComponent implements IComponent {
  public readonly name: string;
  public readonly version: string;
  public readonly router: Router;
  public readonly basePath: string;
  protected readonly logger: Logger;
  protected metadata: IComponentMetadata;

  constructor(metadata: IComponentMetadata, basePath?: string) {
    this.name = metadata.name;
    this.version = metadata.version;
    this.metadata = metadata;
    this.router = Router();
    this.basePath = basePath || `/api/v${this.version}/${this.name}`;
    this.logger = createChildLogger(`component:${this.name}`);

    // Initialize routes
    this.initializeRoutes();
  }

  /**
   * Abstract method to be implemented by each component
   * Sets up the component's routes
   */
  protected abstract initializeRoutes(): void;

  /**
   * Optional initialization method for async setup
   */
  public async initialize(): Promise<void> {
    this.logger.info(`Initializing component: ${this.name} v${this.version}`);
    // Override in child classes for custom initialization
  }

  /**
   * Optional shutdown method for cleanup
   */
  public async shutdown(): Promise<void> {
    this.logger.info(`Shutting down component: ${this.name}`);
    // Override in child classes for custom cleanup
  }

  /**
   * Get component metadata
   */
  public getMetadata(): IComponentMetadata {
    return this.metadata;
  }

  /**
   * Check if component is enabled
   */
  public isEnabled(): boolean {
    return this.metadata.enabled !== false;
  }

  /**
   * Get component dependencies
   */
  public getDependencies(): string[] {
    return this.metadata.dependencies || [];
  }
}
