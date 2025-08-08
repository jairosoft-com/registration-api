import { IComponent, IComponentRegistry } from '@common/types/component';
import { createChildLogger } from '@common/utils/logger';
import { Logger } from 'pino';
import { Express } from 'express';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Component Registry implementation
 * Manages registration, initialization, and lifecycle of all components
 */
export class ComponentRegistry implements IComponentRegistry {
  private components: Map<string, IComponent> = new Map();
  private logger: Logger;
  private initialized: boolean = false;

  constructor() {
    this.logger = createChildLogger('component-registry');
  }

  /**
   * Register a component
   */
  public register(component: IComponent): void {
    if (this.components.has(component.name)) {
      this.logger.warn(`Component ${component.name} is already registered`);
      return;
    }

    this.components.set(component.name, component);
    this.logger.info(`Registered component: ${component.name} v${component.version}`);
  }

  /**
   * Get a component by name
   */
  public get(name: string): IComponent | undefined {
    return this.components.get(name);
  }

  /**
   * Get all registered components
   */
  public getAll(): IComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Initialize all registered components
   */
  public async initializeAll(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Components already initialized');
      return;
    }

    this.logger.info('Initializing all components...');

    // Sort components by dependencies
    const sortedComponents = this.sortByDependencies();

    // Initialize components in order
    for (const component of sortedComponents) {
      try {
        if (component.initialize) {
          await component.initialize();
        }
        this.logger.info(`Initialized component: ${component.name}`);
      } catch (error) {
        this.logger.error({ err: error }, `Failed to initialize component: ${component.name}`);
        throw error;
      }
    }

    this.initialized = true;
    this.logger.info('All components initialized successfully');
  }

  /**
   * Shutdown all registered components
   */
  public async shutdownAll(): Promise<void> {
    this.logger.info('Shutting down all components...');

    // Shutdown in reverse order of initialization
    const sortedComponents = this.sortByDependencies().reverse();

    for (const component of sortedComponents) {
      try {
        if (component.shutdown) {
          await component.shutdown();
        }
        this.logger.info(`Shutdown component: ${component.name}`);
      } catch (error) {
        this.logger.error({ err: error }, `Error shutting down component: ${component.name}`);
      }
    }

    this.initialized = false;
    this.logger.info('All components shutdown complete');
  }

  /**
   * Mount all component routes to Express app
   */
  public mountRoutes(app: Express): void {
    this.logger.info('Mounting component routes...');

    for (const component of this.components.values()) {
      app.use(component.basePath, component.router);
      this.logger.info(`Mounted ${component.name} at ${component.basePath}`);
    }
  }

  /**
   * Auto-discover components from filesystem
   */
  public async autoDiscover(componentsPath: string): Promise<void> {
    this.logger.info(`Auto-discovering components from: ${componentsPath}`);

    try {
      const directories = readdirSync(componentsPath).filter((item) => {
        const itemPath = join(componentsPath, item);
        return statSync(itemPath).isDirectory();
      });

      for (const dir of directories) {
        const componentPath = join(componentsPath, dir);
        const indexPath = join(componentPath, 'index.ts');

        try {
          // Check if index.ts exists
          statSync(indexPath);
        } catch (error) {
          this.logger.debug(`Skipping ${dir}: No index.ts file found in component directory`);
          continue;
        }

        try {
          // Try to import the component
          const module = await import(indexPath);

          if (module.default && this.isValidComponent(module.default)) {
            const component = module.default as IComponent;
            this.register(component);
          } else if (module.component && this.isValidComponent(module.component)) {
            const component = module.component as IComponent;
            this.register(component);
          } else {
            this.logger.warn(
              `Invalid component structure in ${dir}: Missing required properties (name, version, router, basePath)`
            );
          }
        } catch (error) {
          this.logger.debug(
            { err: error },
            `Failed to import component from ${dir}: Module import error`
          );
        }
      }
    } catch (error) {
      this.logger.error({ err: error }, 'Error during component auto-discovery');
    }
  }

  /**
   * Check if an object is a valid component
   */
  private isValidComponent(obj: any): obj is IComponent {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      typeof obj.version === 'string' &&
      typeof obj.basePath === 'string' &&
      obj.router
    );
  }

  /**
   * Sort components by dependencies using topological sort
   */
  private sortByDependencies(): IComponent[] {
    const sorted: IComponent[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      visiting.add(name);
      const component = this.components.get(name);

      if (component) {
        // Visit dependencies first
        const dependencies = (component as any).getDependencies?.() || [];
        for (const dep of dependencies) {
          if (this.components.has(dep)) {
            visit(dep);
          }
        }
        sorted.push(component);
      }

      visiting.delete(name);
      visited.add(name);
    };

    // Visit all components
    for (const name of this.components.keys()) {
      visit(name);
    }

    return sorted;
  }

  /**
   * Get component statistics
   */
  public getStats(): {
    total: number;
    initialized: boolean;
    components: Array<{
      name: string;
      version: string;
      basePath: string;
    }>;
  } {
    return {
      total: this.components.size,
      initialized: this.initialized,
      components: Array.from(this.components.values()).map((c) => ({
        name: c.name,
        version: c.version,
        basePath: c.basePath,
      })),
    };
  }
}

// Export singleton instance
export const componentRegistry = new ComponentRegistry();
