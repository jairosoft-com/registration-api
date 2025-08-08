import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ComponentRegistry } from './ComponentRegistry';
import { IComponent } from '@common/types/component';
import { Router } from 'express';

// Mock component factory
const createMockComponent = (
  name: string,
  version: string = '1',
  dependencies: string[] = []
): IComponent => {
  const router = Router();
  return {
    name,
    version,
    router,
    basePath: `/api/v${version}/${name}`,
    initialize: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
    getDependencies: () => dependencies,
  } as any;
};

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  describe('Component Registration', () => {
    it('should register a component successfully', () => {
      const component = createMockComponent('test');

      registry.register(component);

      expect(registry.get('test')).toBe(component);
    });

    it('should not register duplicate components', () => {
      const component1 = createMockComponent('test');
      const component2 = createMockComponent('test');

      registry.register(component1);
      registry.register(component2);

      expect(registry.get('test')).toBe(component1);
      expect(registry.getAll()).toHaveLength(1);
    });

    it('should get all registered components', () => {
      const comp1 = createMockComponent('comp1');
      const comp2 = createMockComponent('comp2');
      const comp3 = createMockComponent('comp3');

      registry.register(comp1);
      registry.register(comp2);
      registry.register(comp3);

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all).toContain(comp1);
      expect(all).toContain(comp2);
      expect(all).toContain(comp3);
    });

    it('should return undefined for non-existent component', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });
  });

  describe('Component Initialization', () => {
    it('should initialize all components', async () => {
      const comp1 = createMockComponent('comp1');
      const comp2 = createMockComponent('comp2');

      registry.register(comp1);
      registry.register(comp2);

      await registry.initializeAll();

      expect(comp1.initialize).toHaveBeenCalled();
      expect(comp2.initialize).toHaveBeenCalled();
    });

    it('should initialize components in dependency order', async () => {
      const comp1 = createMockComponent('comp1', '1', ['comp2']);
      const comp2 = createMockComponent('comp2', '1', ['comp3']);
      const comp3 = createMockComponent('comp3');

      const initOrder: string[] = [];
      comp1.initialize = jest.fn(async () => {
        initOrder.push('comp1');
      });
      comp2.initialize = jest.fn(async () => {
        initOrder.push('comp2');
      });
      comp3.initialize = jest.fn(async () => {
        initOrder.push('comp3');
      });

      registry.register(comp1);
      registry.register(comp2);
      registry.register(comp3);

      await registry.initializeAll();

      expect(initOrder).toEqual(['comp3', 'comp2', 'comp1']);
    });

    it('should not initialize twice', async () => {
      const component = createMockComponent('test');
      registry.register(component);

      await registry.initializeAll();
      await registry.initializeAll();

      expect(component.initialize).toHaveBeenCalledTimes(1);
    });

    it('should throw on circular dependencies', async () => {
      const comp1 = createMockComponent('comp1', '1', ['comp2']);
      const comp2 = createMockComponent('comp2', '1', ['comp1']);

      registry.register(comp1);
      registry.register(comp2);

      await expect(registry.initializeAll()).rejects.toThrow('Circular dependency detected');
    });
  });

  describe('Component Shutdown', () => {
    it('should shutdown all components', async () => {
      const comp1 = createMockComponent('comp1');
      const comp2 = createMockComponent('comp2');

      registry.register(comp1);
      registry.register(comp2);

      await registry.initializeAll();
      await registry.shutdownAll();

      expect(comp1.shutdown).toHaveBeenCalled();
      expect(comp2.shutdown).toHaveBeenCalled();
    });

    it('should shutdown in reverse initialization order', async () => {
      const comp1 = createMockComponent('comp1', '1', ['comp2']);
      const comp2 = createMockComponent('comp2', '1', ['comp3']);
      const comp3 = createMockComponent('comp3');

      const shutdownOrder: string[] = [];
      comp1.shutdown = jest.fn(async () => {
        shutdownOrder.push('comp1');
      });
      comp2.shutdown = jest.fn(async () => {
        shutdownOrder.push('comp2');
      });
      comp3.shutdown = jest.fn(async () => {
        shutdownOrder.push('comp3');
      });

      registry.register(comp1);
      registry.register(comp2);
      registry.register(comp3);

      await registry.initializeAll();
      await registry.shutdownAll();

      expect(shutdownOrder).toEqual(['comp1', 'comp2', 'comp3']);
    });
  });

  describe('Component Statistics', () => {
    it('should return component statistics', async () => {
      const comp1 = createMockComponent('comp1', '1');
      const comp2 = createMockComponent('comp2', '2');

      registry.register(comp1);
      registry.register(comp2);

      const stats = registry.getStats();

      expect(stats.total).toBe(2);
      expect(stats.initialized).toBe(false);
      expect(stats.components).toHaveLength(2);
      expect(stats.components[0]).toEqual({
        name: 'comp1',
        version: '1',
        basePath: '/api/v1/comp1',
      });

      await registry.initializeAll();

      const statsAfterInit = registry.getStats();
      expect(statsAfterInit.initialized).toBe(true);
    });
  });

  describe('Route Mounting', () => {
    it('should mount component routes to Express app', () => {
      const mockApp = {
        use: jest.fn(),
      } as any;

      const comp1 = createMockComponent('comp1');
      const comp2 = createMockComponent('comp2');

      registry.register(comp1);
      registry.register(comp2);

      registry.mountRoutes(mockApp);

      expect(mockApp.use).toHaveBeenCalledTimes(2);
      expect(mockApp.use).toHaveBeenCalledWith('/api/v1/comp1', comp1.router);
      expect(mockApp.use).toHaveBeenCalledWith('/api/v1/comp2', comp2.router);
    });
  });
});
