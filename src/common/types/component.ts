import { Router } from 'express';

/**
 * Base interface for all components in the application
 */
export interface IComponent {
  /** Component name (e.g., 'users', 'health') */
  name: string;

  /** Component version for API versioning */
  version: string;

  /** Express router for the component */
  router: Router;

  /** Base path for mounting the component (e.g., '/api/v1/users') */
  basePath: string;

  /** Component initialization method */
  initialize?(): Promise<void>;

  /** Component shutdown method for cleanup */
  shutdown?(): Promise<void>;
}

/**
 * Component metadata for registration and discovery
 */
export interface IComponentMetadata {
  /** Component name */
  name: string;

  /** Component description */
  description?: string;

  /** Component version */
  version: string;

  /** Component dependencies on other components */
  dependencies?: string[];

  /** Component tags for categorization */
  tags?: string[];

  /** Whether the component is enabled */
  enabled?: boolean;
}

/**
 * Component controller interface
 */
export interface IComponentController {
  /** Initialize controller */
  initialize?(): Promise<void>;
}

/**
 * Component service interface
 */
export interface IComponentService {
  /** Initialize service */
  initialize?(): Promise<void>;

  /** Cleanup service resources */
  cleanup?(): Promise<void>;
}

/**
 * Component repository interface for data access
 */
export interface IComponentRepository {
  /** Initialize repository connections */
  initialize?(): Promise<void>;

  /** Close repository connections */
  close?(): Promise<void>;
}

/**
 * Complete component structure
 */
export interface IComponentStructure {
  /** Component metadata */
  metadata: IComponentMetadata;

  /** Component router */
  router: Router;

  /** Component controller */
  controller?: IComponentController;

  /** Component service */
  service?: IComponentService;

  /** Component repository */
  repository?: IComponentRepository;
}

/**
 * Component registry for managing all components
 */
export interface IComponentRegistry {
  /** Register a new component */
  register(component: IComponent): void;

  /** Get a component by name */
  get(name: string): IComponent | undefined;

  /** Get all registered components */
  getAll(): IComponent[];

  /** Initialize all components */
  initializeAll(): Promise<void>;

  /** Shutdown all components */
  shutdownAll(): Promise<void>;
}
