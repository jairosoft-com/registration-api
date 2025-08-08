# **A Human- and AI-Friendly Project Template for Node.js Microservices**

## **Section 1: Architectural Foundations for Modern Microservices**

This report presents a definitive, production-ready project template for building microservices with Node.js and the Express.js framework. The architecture is designed to be robust, scalable, and maintainable, adhering to the latest industry best practices. A primary design goal is to create a template that is equally intelligible to both human developers and modern AI coding assistants, fostering a new paradigm of hybrid development. This section establishes the foundational principles that govern the template's design, focusing not just on the "how" but, more importantly, the "why" behind each architectural decision.

### **1.1 The Twelve-Factor App: A Guiding Philosophy**

The foundation of any modern, cloud-native application is a strict adherence to a set of guiding principles that ensure portability, scalability, and ease of deployment. The Twelve-Factor App methodology provides this essential framework, serving as the bedrock for this project template. It establishes a clean contract between the application and its execution environment, which is critical for the automated, ephemeral nature of microservices. By conforming to these principles, the application becomes predictable and well-behaved, not only for human operators but also for the automated systems and AI tools that will interact with it.

Several factors are particularly critical for this microservice template and are implemented without compromise:

* **I. Config:** All configuration, including database connection strings, API keys, port numbers, and other environment-specific values, must be stored in the environment. Configuration must never be hardcoded or committed to the codebase. This practice is fundamental for security and portability, allowing the same application image to be deployed across different environments (development, staging, production) without code changes. For local development, this template utilizes a `.env` file loaded by the `dotenv` library. In production, the execution environment (e.g., a container orchestrator like Kubernetes or a PaaS like Heroku) is responsible for injecting these variables.  
* **II. Dependencies:** The application must explicitly declare all its dependencies and never rely on system-wide packages. This is managed through the `package.json` file. Furthermore, the `package-lock.json` file must be committed to the version control system to ensure that builds are deterministic and repeatable, guaranteeing that every developer and build server installs the exact same version of every dependency.  
* **III. Logs:** Logs are treated as event streams and are never written to files within the application container. Instead, all log output is directed to `stdout` as a stream of structured, timestamped events (preferably in JSON format). This decouples the application from the concerns of log routing, storage, and analysis. The execution environment is responsible for capturing this stream and forwarding it to a centralized logging platform (e.g., ELK Stack, Splunk, Datadog). This approach simplifies the application code and enhances observability in a distributed system.  
* **VI. Port Binding:** The microservice is entirely self-contained and exports its HTTP service by binding to a port. This port is specified via an environment variable (e.g., `PORT`), making the service portable and executable in any environment without reliance on a specific web server injection at runtime.  
* **V. Processes:** The application must be executed as one or more stateless processes. Any data that needs to persist must be stored in a stateful backing service, such as a database, object store, or cache. This "share-nothing" architecture is a prerequisite for horizontal scalability, as any instance of the service can handle any request, allowing for seamless scaling and fault tolerance.

Adherence to these principles provides a clear and predictable "API" for interaction with the application's environment. For an AI coding assistant, which is trained on vast quantities of public codebases that follow these established patterns, this predictability is invaluable. When an AI encounters a codebase that retrieves configuration strictly from `process.env` (Factor III), it understands this contract and will generate new code that follows the same pattern. It will not attempt to hardcode values or read from a configuration file. In this way, the Twelve-Factor App methodology transcends being a mere set of best practices for human developers; it becomes a crucial component in making the codebase intelligible and safely extensible for AI partners by defining the "rules of the game."

### **1.2 Beyond Layers: Adopting a Component-Driven Structure**

While a traditional layered architecture—separating code into directories like `/controllers`, `/services`, and `/models`—is a common starting point for many Node.js applications, it has significant drawbacks for building scalable microservices. This approach organizes code by its technical function, not its business purpose. As an application grows, the logic for a single business feature becomes scattered across multiple top-level directories, leading to high coupling between layers and low cohesion within features. This makes it difficult to understand the scope of a feature, test it in isolation, or, most importantly, extract it into a separate microservice without extensive and costly refactoring.

To overcome these limitations, this template adopts a **component-driven architecture**, also known as structuring by business capability or "feature-slicing". The core application logic resides within a `/src/components` directory. Each subdirectory within `/components` represents a self-contained business domain, or "bounded context," such as `/users` or `/orders`.

The benefits of this approach are substantial:

* **High Cohesion:** All files related to a single business feature—its routes, controller, business logic, data model, and tests—are co-located within a single directory. This makes the code easier to find, understand, and maintain.  
* **Low Coupling:** Each component is designed to be as self-contained as possible, interacting with other components only through well-defined public interfaces, such as exported service methods or by emitting events. This minimizes dependencies and ripple effects when changes are made.  
* **Future-Proof Scalability:** This structure directly mirrors the desired end-state of a microservices architecture. Because the codebase is already logically partitioned by business domain, extracting a component into its own independently deployable microservice becomes a trivial task of moving the directory to a new repository.

This architectural choice is not merely stylistic; it is a fundamental prerequisite for building true microservices. While many introductory tutorials demonstrate a layered structure, a template designed for a microservices world must prioritize domain-centric organization from its inception. It aligns the code structure with the business architecture, setting the stage for sustainable growth and evolution.

### **1.3 Designing for a Hybrid Team: Principles of Human and AI Intelligibility**

The unique requirement for this template to be understood by both human developers and AI coding assistants necessitates a design philosophy that prioritizes clarity, predictability, and explicitness. This goes beyond simple code formatting and influences the core architectural patterns of the template.

The following principles are foundational to this hybrid development approach:

* **Explicitness over Implicitness:** The codebase must avoid "magic" or hidden behaviors. All dependencies, configurations, and data flows should be explicit and easy to trace. For example, instead of relying on global singletons, dependencies will be explicitly managed, and configuration will be loaded from a single, clear source (the environment).  
* **Predictability and Consistency:** The structure of every component must be identical. If a `users` component contains `users.controller.ts`, `users.service.ts`, and `users.model.ts`, then an `orders` component must follow the exact same file naming and structural conventions. This powerful consistency allows both humans and AI to predict where to find existing code and, more importantly, where to place new code.  
* **Self-Documentation through Code:** The template leverages clear, descriptive naming for all files, directories, variables, and functions. Furthermore, it mandates the use of TypeScript, whose static type system serves as a rich, machine-readable form of documentation for data structures, function signatures, and API contracts. This provides invaluable context that AI tools can parse and utilize.  
* **The `README.md` as a Project "System Prompt":** The `README.md` file is the primary entry point for any developer, human or AI, approaching the project. It must be treated not as passive documentation but as an active specification for the project's "operating system."

This last principle is transformative. Just as a well-crafted prompt is essential for eliciting a high-quality response from a generative AI, a well-structured `README.md` can serve as a persistent "system prompt" or set of "custom instructions" for an AI code assistant. By explicitly stating the architectural rules in the

`README.md`—for example, "This project follows a component-driven architecture. To add a new feature, create a new directory under `/src/components` that includes `.routes.ts`, `.controller.ts`, and `.service.ts` files"—we are directly instructing the AI on how to generate new code that conforms to the template's standards. This elevates the `README.md` from a simple text file to an active configuration manifest for AI-assisted development, directly addressing the user's most forward-thinking requirement.

## **Section 2: Blueprint of the Express.js Microservice Template**

This section provides the detailed file and directory structure for the microservice template. Each element is designed with purpose, adhering to the principles of separation of concerns, clarity, and maintainability. The structure is logical and predictable, providing a solid foundation for both human developers and AI assistants to build upon.

### **2.1 A Common, Layered Foundation: The MVC and Service Pattern**

A common and effective best practice for structuring Node.js projects is to separate concerns into distinct layers, a practice that greatly enhances modularity and maintainability. This layered approach, often a variation of the Model-View-Controller (MVC) pattern, ensures that different parts of the application have clear and distinct responsibilities. The most widely adopted structure includes the following directories :

* **Routes**: This layer is exclusively responsible for defining the API endpoints. It maps incoming HTTP requests (e.g., `GET /users`, `POST /users`) to the appropriate controller functions that will handle them.  
* **Controllers**: Controllers act as the intermediary between the HTTP request/response cycle and the application's internal business logic. A controller's job is to parse incoming request data (like parameters, queries, and body), call the relevant business logic from a service, and then format and send the final response back to the client. A key best practice is to keep controllers lean and free of business logic, delegating that work to the service layer.  
* **Services**: The service layer contains the core business logic of the application. It orchestrates complex operations, interacts with the data layer (models), and encapsulates the rules and processes that define what the application does. Separating business logic into services makes it more reusable, testable, and independent of the web layer.  
* **Models**: This layer represents the application's data structure and is responsible for all interactions with the database. It defines the schemas for data entities (e.g., using Mongoose for MongoDB or Sequelize for SQL databases) and handles the logic for creating, reading, updating, and deleting records.  
* **Middleware**: This directory holds reusable functions that can process requests before they reach the route handlers. Common examples include functions for authentication, input validation, logging, and centralized error handling.  
* **Config**: This directory centralizes all application configuration, particularly the loading of environment variables and the setup for database connections, ensuring a clean separation of configuration from code.

While this traditional layered structure provides a solid and widely understood foundation, this template enhances it for a microservices context. It takes these distinct layers and organizes them within self-contained, feature-specific components, as detailed in the following sections. This component-driven approach builds upon the principle of separation of concerns by also promoting high cohesion and low coupling between different business domains of the application.

### **2.2 Complete Project Directory Structure**

The following diagram illustrates the complete directory and file structure of the project template. This structure is designed to be logical, scalable, and easy to navigate for both human developers and AI assistants.

.  
├──.dockerignore         \# Specifies files to ignore in Docker build context  
├──.env                  \# Local environment variables (Not committed to Git)  
├──.env.example          \# Example environment variables  
├──.eslintrc.js          \# ESLint configuration for code quality  
├──.gitignore            \# Specifies files to ignore in Git  
├──.prettierrc           \# Prettier configuration for code formatting  
├── Dockerfile            \# Defines the production Docker image (multi-stage)  
├── docker-compose.yml    \# Defines services for local development (app, db, etc.)  
├── jest.config.js        \# Jest testing framework configuration  
├── package.json          \# Project manifest and dependencies  
├── package-lock.json     \# Exact dependency versions  
├── README.md             \# Project documentation and AI instructions  
├── tsconfig.json         \# TypeScript compiler configuration  
│  
├── prisma/               \# Prisma schema and migrations  
│   ├── schema.prisma     \# Single source of truth for database schema  
│   └── migrations/       \# Auto-generated SQL migration files  
│  
├── dist/                 \# Compiled JavaScript output from TypeScript  
│  
└── src/                  \# Application source code  
    ├── app.ts            \# Express app configuration and middleware setup  
    ├── server.ts         \# Server startup, graceful shutdown, and entry point  
    │  
    ├── common/           \# Shared, cross-cutting concerns  
    │   ├── middleware/   \# Reusable Express middleware  
    │   │   ├── authentication.ts  
    │   │   ├── errorHandler.ts  
    │   │   └── requestLogger.ts  
    │   │  
    │   ├── types/        \# Shared TypeScript types and interfaces  
    │   │   └── index.ts  
    │   │  
    │   └── utils/        \# Generic helper functions and classes  
    │       ├── ApiError.ts  
    │       └── catchAsync.ts  
    │  
    ├── components/       \# Core application logic, organized by business feature  
    │   ├── users/        \# Example: 'users' component  
    │   │   ├── index.ts              \# Public API of the component (exports router)  
    │   │   ├── users.controller.ts   \# Handles HTTP requests and responses  
    │   │   ├── users.routes.ts       \# Defines API endpoints for the component  
    │   │   ├── users.service.ts      \# Contains core business logic (uses Prisma Client)  
    │   │   ├── users.test.ts         \# Unit and integration tests for the component  
    │   │   └── users.validation.ts   \# Data validation schemas  
    │   │  
    │   └── orders/       \# Example: 'orders' component (follows same structure)  
    │       ├── index.ts  
    │       ├── orders.controller.ts  
    │       ├──... (etc.)  
    │  
    └── config/           \# Environment-aware configuration loading  
        ├── index.ts      \# Loads and validates config from environment variables  
        └── prisma.ts     \# Prisma Client configuration and instance

### **2.3 Root-Level Configuration**

The root of the project contains configuration files that define the project's environment, dependencies, scripts, and quality control settings.

* `package.json`: This file is the manifest for the Node.js project. It contains:  
  * **Metadata:** Project name, version, description, and license.  
  * **Dependencies:** The `dependencies` section lists packages required for the application to run in production (e.g., `express`, `pino`, `helmet`). The `devDependencies` section lists packages used only for development and testing (e.g., `typescript`, `jest`, `nodemon`).  
  * **Scripts:** A standardized set of `npm` scripts provides a consistent interface for common development tasks, such as starting the server, running tests, and linting the code. This is crucial for automation and ease of use for all developers. Example scripts include `start`, `dev`, `test`, `lint`, and `build`.  
* `tsconfig.json`: This file configures the TypeScript compiler (`tsc`). Key settings for a modern Node.js project include:  
  * `"target": "ES2022"`: Compiles to a modern version of JavaScript to leverage recent language features.  
  * `"module": "ESNext"` and `"moduleResolution": "Node"`: Enables the use of native ECMAScript Modules (ESM), which is the modern standard for JavaScript modules.  
  * `"strict": true`: Enables all strict type-checking options, which is a best practice for catching errors early and writing more robust code.  
  * `"outDir": "./dist"`: Specifies that the compiled JavaScript output will be placed in a `/dist` directory.  
* `.env` and `.env.example`: Following the Twelve-Factor App methodology, all environment-specific configuration is stored in environment variables.  
  * `.env`: This file is used for local development to store secrets and configuration (e.g., `DATABASE_URL`, `JWT_SECRET`). It **must** be included in `.gitignore` and never committed to version control.  
  * `.env.example`: This file is a template that is committed to version control. It lists all the required environment variables with placeholder or default values, serving as documentation for developers setting up the project.  
* `Dockerfile` and `docker-compose.yml`: These files define how the application is containerized. The `Dockerfile` provides instructions for building a production-ready image, while `docker-compose.yml` orchestrates a multi-container environment for local development. These will be detailed in Section 5\.  
* `.eslintrc.js`, `.prettierrc`, `.editorconfig`: These files configure the code quality and formatting tools. They ensure that all code contributed to the project adheres to a consistent style. These are detailed in Section 3\.  
* `.gitignore` and `.dockerignore`: These files are essential for preventing unnecessary or sensitive files from being included in the Git repository or the Docker image build context. Common entries include `/node_modules`, `/dist`, `.env`, and log files.  
* `jest.config.js`: This file configures the Jest testing framework, specifying test environments, coverage reporters, and other testing-related settings. This is detailed in Section 3\.

The following table summarizes the core dependencies recommended for this template and the rationale behind their selection.

| Package | Purpose in Template | Rationale for Selection |
| :---- | :---- | :---- |
| `express` | Web framework for API routing and middleware. | Industry standard for Node.js, offering a minimal yet powerful API with a vast ecosystem of middleware. |
| `typescript` | Superset of JavaScript that adds static typing. | Enforces type safety, improves code quality and maintainability, and provides excellent tooling support, which is critical for large-scale applications and AI understanding. |
| `pino` | High-performance structured JSON logger. | Chosen over alternatives like Winston for its superior performance and low overhead in high-throughput scenarios, a key requirement for microservices. Defaults to machine-readable JSON output. |
| `helmet` | Middleware to set security-related HTTP headers. | Provides an essential baseline of security by default, mitigating common web vulnerabilities. Recommended by OWASP. |
| `dotenv` | Loads environment variables from a `.env` file. | Facilitates adherence to the Twelve-Factor App principle of storing configuration in the environment for local development. |
| `jest` & `supertest` | Testing framework and HTTP assertion library. | Jest provides an integrated "all-in-one" testing solution. Supertest allows for easy testing of HTTP endpoints without a live server, ideal for API contract testing. |
| `standard` | JavaScript style guide, linter, and formatter. | Recommended for its "zero-configuration" approach, which simplifies setup and enforces a highly consistent, predictable style. This predictability is extremely beneficial for AI-assisted development. |
| `opossum` | Circuit breaker implementation for fault tolerance. | A mature and widely-used Node.js module for implementing the circuit breaker pattern, essential for building resilient microservices that communicate over the network. |
| `@prisma/client` | Type-safe database client with auto-generated types. | Provides a modern, type-safe database client that generates TypeScript types from the Prisma schema, ensuring compile-time safety for all database operations. |
| `prisma` | Database toolkit and ORM for Node.js and TypeScript. | Offers a declarative schema definition, automatic migration generation, and excellent developer experience with IntelliSense support. |

### **2.4 The `/src` Directory: Core Application Logic**

All application source code resides within a dedicated `/src` directory. This is a widely adopted convention that cleanly separates the application's logic from the project's root-level configuration files, build artifacts, and documentation. This separation improves organization and simplifies build processes.

The top level of the `/src` directory contains the main application bootstrapping files and the primary folders for organizing the codebase:

* `app.ts`: This file is responsible for creating and configuring the Express application instance. It orchestrates middleware, mounts routes, and sets up error handling.  
* `server.ts`: This file is the main entry point of the application. It imports the configured `app` from `app.ts`, initializes external connections (like the database), starts the HTTP server, and manages graceful shutdown. This deliberate separation of the server from the application logic is a best practice that improves testability and modularity.  
* `/components`: This directory is the heart of the application, containing the business logic organized by feature or domain, as described in Section 1.2.  
* `/config`: This directory holds the logic for loading and validating environment-aware configuration.  
* `/common`: This directory contains shared, cross-cutting concerns that are not specific to any single business component.

### **2.5 The `/config` Directory: Centralized and Environment-Aware Configuration**

To comply with the Twelve-Factor App principles, configuration must be strictly separated from code. The `/config` directory centralizes the logic for loading, validating, and exporting all configuration variables from the environment, ensuring the application is portable and secure.

* **`config/index.ts`:** This is the sole file in the directory and acts as the single source of truth for all configuration.  
  * It uses `dotenv` to load the `.env` file during local development. This call should be one of the first lines of code executed.  
  * It reads all required configuration values from `process.env`.  
  * Crucially, it validates the presence and, where applicable, the format of essential environment variables. If a required variable (like `DATABASE_URL` or `JWT_SECRET`) is missing, the application should throw an error and refuse to start. This "fail-fast" approach prevents obscure runtime errors caused by a misconfigured environment.

* **`config/prisma.ts`:** This file manages the Prisma Client instance, which is the primary interface for database operations.  
  * It creates and exports a single, shared Prisma Client instance to ensure efficient connection management.  
  * It configures logging options for development and production environments.  
  * It handles graceful shutdown by properly disconnecting the client when the application terminates.

```typescript  
// src/config/index.ts  
import dotenv from 'dotenv';

// Load.env file only in non-production environments  
if (process.env.NODE\_ENV\!== 'production') {  
  dotenv.config();  
}

const config \= {  
  env: process.env.NODE\_ENV |

* 

| 'development', port: parseInt(process.env.PORT |

| '3001', 10), database: { url: process.env.DATABASE\_URL, }, jwt: { secret: process.env.JWT\_SECRET, expiresIn: '1d', }, logLevel: process.env.LOG\_LEVEL |

| 'info', };

// Validate essential configuration variables  
if (\!config.database.url ||\!config.jwt.secret) {  
  console.error('FATAL ERROR: Missing essential environment variables. Check.env.example.');  
  process.exit(1);  
}

export default Object.freeze(config); // Freeze the object to prevent modification  

// src/config/prisma.ts  
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

export default prisma;
```

### **2.6 The `/components` Directory: The Heart of the Service**

This directory embodies the component-driven architecture. Each subdirectory represents a distinct business capability. This structure ensures high cohesion and low coupling, making the codebase scalable and easy to navigate.

A typical component, for example `/components/users`, will have the following internal structure:

* `users.routes.ts`: Defines the API endpoints for the user component using an Express Router. It imports methods from the controller and wires them to specific HTTP methods and URL paths.  
* `users.controller.ts`: Acts as the intermediary between the HTTP layer and the business logic layer. Its responsibilities are strictly limited to:  
  1. Parsing the incoming request (`req.body`, `req.params`, `req.query`).  
  2. Calling the appropriate method on the `users.service`.  
  3. Formatting the response and sending it back to the client with the correct HTTP status code. It should contain no business logic itself.  
* `users.service.ts`: Contains the core business logic for the user component. It orchestrates data access by interacting with the Prisma Client and performs any complex operations or calculations. This is where the actual "work" of the component is done. The service imports auto-generated types from `@prisma/client` for type-safe database operations.  
* `users.validation.ts`: (Optional but highly recommended) Defines schemas for validating incoming data, such as request bodies for creating or updating a user. Libraries like `Joi` or `class-validator` are used here to ensure data integrity before it reaches the service layer.  
* `users.test.ts`: Contains all unit and integration tests related to the user component. Co-locating tests with the code they cover makes them easier to find and maintain.  
* `index.ts`: Serves as the public API for the component. At a minimum, it exports the component's router so it can be mounted by the main `app.ts`. It may also export the service if other components need to interact with it directly.

**Note:** With Prisma integration, the `users.model.ts` file is no longer needed as the data schema is centrally defined in `/prisma/schema.prisma`. The Prisma Client provides type-safe database operations directly in the service layer.

### **2.7 The `/common` Directory: Shared Middleware, Utilities, and Types**

To promote code reuse and adhere to the Don't Repeat Yourself (DRY) principle, any logic that is not specific to a single business component but is shared across the application is placed in the `/common` directory.

* `/middleware`: This subdirectory contains reusable Express middleware functions.  
  * `authentication.ts`: Middleware to verify JWTs and attach user information to the request object.  
  * `requestLogger.ts`: Middleware to log details of every incoming HTTP request using Pino.  
  * `errorHandler.ts`: The centralized error handling middleware, which must be the last middleware in the chain.  
  * `validate.ts`: A generic validation middleware that takes a validation schema (from a component's `.validation.ts` file) and applies it to the request.  
* `/utils`: This subdirectory holds generic helper functions, constants, or utility classes.  
  * `ApiError.ts`: A custom error class that extends `Error` to include an HTTP status code and other metadata.  
  * `catchAsync.ts`: A higher-order function that wraps async route handlers to catch any promise rejections and pass them to the central error handler.  
  * `password.ts`: Utility functions for hashing and comparing passwords with `bcrypt`.  
* `/types`: This subdirectory contains shared TypeScript type definitions, interfaces, or enums that are used by multiple components or throughout the application.

### **2.8 Prisma Integration: The Single Source of Truth for Data**

This template integrates **Prisma** as the primary ORM, providing a modern, type-safe approach to database management that is particularly well-suited for AI-assisted development. Prisma's declarative schema definition serves as the single source of truth for all data models, making the codebase more predictable and easier to understand for both human developers and AI tools.

#### **2.8.1 The Prisma Schema: Centralized Data Definition**

The `/prisma/schema.prisma` file is the cornerstone of the data layer. It defines all database models, relationships, and configurations in a declarative, human-readable format that is also easily parsable by AI tools.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  orders    Order[]
  
  @@map("users")
}

model Order {
  id        String   @id @default(cuid())
  userId    String
  total     Decimal
  status    OrderStatus
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  user      User     @relation(fields: [userId], references: [id])
  
  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

#### **2.8.2 Type-Safe Database Operations**

The Prisma Client provides auto-generated TypeScript types that ensure compile-time safety for all database operations. This eliminates runtime errors and provides excellent IntelliSense support.

```typescript
// src/components/users/users.service.ts
import prisma from '../../config/prisma';
import { User, Prisma } from '@prisma/client';

export const createUser = async (data: Prisma.UserCreateInput): Promise<User> => {
  return await prisma.user.create({ data });
};

export const findUserById = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({ 
    where: { id },
    include: { orders: true }
  });
};

export const updateUser = async (
  id: string, 
  data: Prisma.UserUpdateInput
): Promise<User> => {
  return await prisma.user.update({
    where: { id },
    data
  });
};

export const deleteUser = async (id: string): Promise<User> => {
  return await prisma.user.delete({
    where: { id }
  });
};
```

#### **2.8.3 Migration Management**

Prisma automatically generates SQL migration files based on schema changes, ensuring version-controlled database evolution.

```bash
# Generate a new migration
npx prisma migrate dev --name add_user_fields

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

#### **2.8.4 Benefits for AI-Assisted Development**

* **Declarative Schema:** The Prisma schema is self-documenting and easily parsable by AI tools, providing clear context about data structures and relationships.
* **Auto-Generated Types:** TypeScript types are automatically generated from the schema, ensuring consistency between the database and application code.
* **Predictable Patterns:** Prisma Client operations follow consistent patterns that AI tools can reliably generate and understand.
* **Migration Safety:** Automatic migration generation reduces the risk of schema drift and ensures database changes are tracked in version control.

### **2.9 Application Entry Points: `app.ts` and `server.ts`**

These two files work in tandem to bootstrap and run the application.

* **`app.ts`:** This file is responsible for assembling the Express application.  
  1. It creates the Express app instance: `const app = express();`.  
  2. It applies essential global middleware, such as `helmet()` for security, `cors()` for cross-origin resource sharing, `express.json()` for parsing JSON request bodies, and the request logger middleware.  
  3. It programmatically discovers and mounts the routers from each component directory within `/src/components`. This allows for new components to be added without modifying `app.ts`.  
  4. After all application routes are mounted, it adds a "404 Not Found" handler and the final, centralized error-handling middleware. The order is critical.  
  5. Finally, it exports the fully configured `app` instance.  
* **`server.ts`:** This is the executable entry point of the microservice.  
  1. It imports the `app` instance from `app.ts` and the `config` object from `/config`.  
  2. It establishes connections to backing services, such as the database via Prisma Client.  
  3. It starts the HTTP server by calling `app.listen(config.port,...)`.  
  4. It implements graceful shutdown logic. It listens for system signals like `SIGTERM` (sent by container orchestrators) and `SIGINT` (from Ctrl+C). Upon receiving a signal, it stops accepting new requests, waits for existing requests to finish, closes the Prisma Client connection, and then exits the process cleanly. This is a non-negotiable feature for robust, containerized applications.

## **Section 3: Engineering for Production-Grade Quality**

A project template is more than a directory structure; it is a framework that enforces quality, consistency, and security. This section details the integrated tooling and processes that elevate the template to a production-grade standard. These automated systems are designed to provide rapid feedback to developers and ensure that every line of code meets a high bar for quality before it is integrated into the main codebase.

### **3.1 Enforcing Code Consistency: ESLint, Prettier, and EditorConfig**

In any collaborative development environment, a consistent code style is paramount. It reduces cognitive load, makes code more readable and maintainable, and prevents version control history from being cluttered with trivial formatting changes. For a hybrid team of human and AI developers, this consistency is even more critical. AI coding assistants learn and replicate the patterns present in the existing codebase; therefore, a strictly enforced, predictable style guide is essential for guiding the AI to produce compliant code.

This template achieves consistency through a combination of powerful, industry-standard tools:

* **ESLint:** A highly pluggable static analysis tool (linter) for identifying and fixing problematic patterns in JavaScript and TypeScript code. The configuration will include recommended rule sets like `eslint:recommended` and `@typescript-eslint/recommended` to catch common bugs, enforce best practices (e.g., disallowing unused variables), and improve code quality.  
* **Prettier:** An opinionated code formatter that enforces a consistent style by parsing code and re-printing it with its own rules. It eliminates all arguments about style by taking formatting decisions out of the developer's hands. Prettier will be configured to work alongside ESLint, where Prettier handles all formatting rules, and ESLint focuses on code-quality rules.  
* **EditorConfig:** An `.editorconfig` file will be included at the root to help maintain consistent coding styles (like indentation and line endings) across various editors and IDEs.

### **3.2 Automated Quality Gates: Pre-commit Hooks with Husky and lint-staged**

To ensure that code quality standards are not just defined but rigorously enforced, the template automates this enforcement using pre-commit hooks. These hooks run checks before a developer is allowed to commit their code, preventing non-compliant code from ever entering the version control history.

* **Husky:** A tool that makes it easy to set up and manage Git hooks. It will be configured to trigger actions on the `pre-commit` event.  
* **lint-staged:** A tool that runs linters, formatters, or other commands only on the files that are currently staged for a commit (`git add...`). This is vastly more efficient than running checks on the entire project for every commit, providing a much faster feedback loop for the developer.

The `package.json` will be configured to link these tools together. For example:

JSON  
"lint-staged": {  
  "\*.{js,ts}":  
}

This configuration ensures that before any commit, `standard` will automatically format the staged JavaScript/TypeScript files, and then `jest` will run the relevant tests for those changed files. If either of these steps fails, the commit is aborted.

### **3.3 A Multi-Layered Testing Strategy: Unit, Integration, and API Testing**

A comprehensive and automated testing strategy is the cornerstone of building reliable and maintainable microservices. The template establishes a framework for multiple layers of testing, ensuring that the service is validated from its smallest units to its public-facing contract.

* **Tooling:**  
  * **Jest:** This template uses Jest as its primary testing framework. Its "all-in-one" nature, including a test runner, assertion library, and powerful mocking capabilities, simplifies the testing setup.  
  * **Supertest:** For testing the HTTP layer, Supertest is integrated. It allows for making requests directly to the Express application instance without the overhead of running a live server, making API tests fast and reliable.  
* **Testing Layers:**  
  * **Unit Tests:** These tests focus on the smallest testable parts of the application in isolation, such as a single function in a service or a utility class. All external dependencies (like other services or database models) are mocked using Jest's mocking features (`jest.fn()`, `jest.spyOn()`). Unit tests should be fast, numerous, and provide granular feedback.  
  * **Integration Tests:** These tests verify the interaction between several units of the application. For example, an integration test might check that a controller correctly calls the appropriate service method with the right arguments and that the service interacts correctly with a mocked data model. These tests are co-located with the component code in `*.test.ts` files to ensure they are easy to find and maintain.  
  * **API / Contract Tests:** These are the highest level of automated tests within the service. Using Supertest, they test the full request-response cycle at the HTTP level. These tests validate the service's public contract, including API endpoints, request/response body structures, HTTP status codes, and headers. They are crucial for ensuring that the service meets the expectations of its consumers and for preventing breaking changes.

### **3.4 Security by Design: Implementing OWASP Best Practices**

Security must be a foundational aspect of the development process, not an afterthought. This template integrates essential security measures by design, based on the widely recognized OWASP (Open Web Application Security Project) Top 10 security risks.

The following table provides a checklist mapping common OWASP risks to the specific controls and tools implemented within this template.

| OWASP Top 10 Risk | Mitigation Strategy in Template | Relevant Tool(s) / File(s) |
| :---- | :---- | :---- |
| **A01:2021 \- Broken Access Control** | Enforce authorization checks in middleware or route handlers. A stub for Role-Based Access Control (RBAC) is provided. | `/common/middleware/auth.ts` |
| **A02:2021 \- Cryptographic Failures** | Hash passwords using a strong, salted algorithm (`bcrypt`). Use HTTPS with HSTS in production environments. | `/common/utils/password.ts`, `app.ts` (via `helmet`) |
| **A03:2021 \- Injection** | Use a modern ORM/ODM (e.g., Sequelize, TypeORM) that provides parameterized queries to prevent SQL injection. Validate and sanitize all user input. | `/components/*/model.ts`, `/components/*/validation.ts` (using `Joi` or `class-validator`) |
| **A04:2021 \- Insecure Design** | Implement rate limiting to prevent brute-force attacks. Follow the principle of least privilege. | `/common/middleware/rateLimiter.ts` (using `express-rate-limit`), `Dockerfile` (non-root user) |
| **A05:2021 \- Security Misconfiguration** | Use `helmet` middleware to set secure HTTP headers by default. Disable the `X-Powered-By` header. Disable stack traces in production. | `app.ts` (`app.use(helmet())`, `app.disable('x-powered-by')`), `/config/index.ts` (`NODE_ENV`) |
| **A07:2021 \- Identification and Authentication Failures** | Implement secure authentication using JWTs. Enforce strong password policies. Provide hooks for Multi-Factor Authentication (MFA). | `/common/middleware/auth.ts`, `/components/auth/auth.service.ts` |
| **A08:2021 \- Software and Data Integrity Failures** | Use `package-lock.json` for dependency integrity. Regularly scan for vulnerable dependencies using `npm audit` or Snyk. | `package-lock.json`, CI/CD pipeline configuration |
| **A09:2021 \- Security Logging and Monitoring Failures** | Implement structured, centralized logging. Ensure logs are formatted to be easily consumed by monitoring tools and do not contain sensitive data. | `/config/logger.ts` (using `pino`), `/common/middleware/errorHandler.ts` |

Export to Sheets

By embedding these security controls directly into the template, it establishes a secure-by-default posture, reducing the likelihood of common vulnerabilities being introduced during development.

## **Section 4: Observability and Resilience**

In a distributed microservices architecture, individual services must be designed as good "citizens" of the larger ecosystem. This means they must be observable, allowing operators to understand their internal state from the outside, and resilient, capable of handling failures in their dependencies without causing a system-wide collapse. This section outlines the template's built-in capabilities for robust logging, error handling, and fault tolerance.

### **4.1 High-Performance Structured Logging with Pino**

Effective logging is the cornerstone of observability. In a microservices environment, where requests may traverse multiple services, logs are the primary tool for debugging, monitoring, and tracing application behavior. To be effective, logs must be structured (machine-readable) and logging itself must not become a performance bottleneck.

* **Tool Selection:** This template recommends and implements **Pino** as the default logging library. Pino is specifically optimized for speed and low overhead, making it an ideal choice for high-throughput microservices where performance is critical. It produces structured JSON logs by default, which is the preferred format for modern log aggregation and analysis platforms.  
* **Implementation Strategy:**  
  * **Centralized Configuration:** A logger instance is configured in a dedicated file (e.g., `/config/logger.ts`). This configuration sets the log level based on the environment (e.g., `info` in production, `debug` in development) and configures log redaction.  
  * **Request Correlation:** A lightweight middleware is used to inject the logger instance into every request object (`req.log`). This middleware also generates a unique `requestId` for each incoming request, which is then included in every log message generated during the lifecycle of that request. This allows for easy filtering and tracing of all log entries related to a single API call.  
  * **Structured Context:** When logging, developers should pass objects as the first argument to the logger (e.g., `req.log.info({ user: userId }, 'User logged in')`). Pino merges this object into the final JSON log line, providing rich, queryable context.  
  * **Sensitive Data Redaction:** To prevent sensitive information like passwords, API keys, or personal data from leaking into logs, Pino's built-in redaction feature is used. Paths to sensitive fields in logged objects are defined in the logger configuration, and Pino automatically replaces their values with a placeholder like \`\`.

### **4.2 A Robust and Centralized Error Handling Architecture**

A consistent and predictable error handling strategy is essential for creating a reliable API and simplifying debugging. Instead of scattering `try...catch` blocks throughout the controllers, this template implements a centralized error handling mechanism.

* **Implementation Strategy:**  
  * **Custom `ApiError` Class:** A custom error class, `ApiError`, is defined in `/common/utils`. This class extends the native `Error` object and adds properties such as `statusCode` (an HTTP status code) and `isOperational` (a boolean to distinguish between operational errors, which are expected, and programmer errors). This allows developers to throw structured, HTTP-aware errors from anywhere in the application (e.g., `throw new ApiError(404, 'User not found')`).  
  * **Centralized Error Middleware:** A dedicated Express error-handling middleware is defined in `/common/middleware/errorHandler.ts`. This middleware has a special signature of `(err, req, res, next)` and **must** be the very last middleware registered in `app.ts`. It is responsible for:  
    1. Catching all errors that occur in the application, whether thrown synchronously or passed via `next(err)` from an async handler.  
    2. Determining the appropriate HTTP status code and response message. If the error is an instance of `ApiError`, it uses the status code and message from the error object. Otherwise, it defaults to a generic `500 Internal Server Error`.  
    3. Logging the error with its full stack trace using the request-scoped Pino logger (`req.log.error(err)`). This ensures that all errors are recorded for analysis.  
    4. Sending a well-formatted JSON error response to the client. In production, stack traces and other internal details are not sent to the client.  
  * **Handling Uncaught Exceptions and Unhandled Promise Rejections:** To catch catastrophic errors that are not handled by the Express middleware, top-level process event listeners are registered in `server.ts` for `uncaughtException` and `unhandledRejection`. When these events occur, they signify that the application is in an unknown and potentially corrupt state. The best practice, which this template follows, is to log the fatal error and then initiate a graceful shutdown of the server. A process manager like PM2 or a container orchestrator should then be responsible for restarting the service. It is considered unsafe to continue running the application after such an event.

### **4.3 Fault Tolerance Patterns: Implementing Circuit Breakers and Timeouts**

Microservices are distributed systems that communicate over the network, which is inherently unreliable. A service must be designed to tolerate failures in its dependencies (e.g., other microservices, databases, third-party APIs) to prevent a single point of failure from causing a cascading outage across the entire system.

This template provides a foundation for implementing key fault tolerance patterns:

* **Timeouts:** Every outbound network call made by the service must have a configured timeout. This is a non-negotiable rule. Without a timeout, a process can hang indefinitely waiting for a response from a slow or unresponsive downstream service, consuming resources and potentially blocking the Node.js event loop.  
* **Retries with Exponential Backoff:** For transient or intermittent network failures, it is often appropriate to retry the failed operation. However, retries must be implemented carefully. The template advocates for a strategy that includes:  
  * **Limited Attempts:** Only retry a small, fixed number of times.  
  * **Exponential Backoff:** Increase the delay between each retry attempt exponentially (e.g., 100ms, 200ms, 400ms). This prevents the retrying service from overwhelming a downstream dependency that is already struggling to recover.  
  * **Jitter:** Add a small, random amount of time to each backoff delay to prevent multiple instances of a service from retrying in perfect synchronization (the "thundering herd" problem).  
* **Circuit Breaker:** This is the most critical pattern for preventing cascading failures. A circuit breaker acts as a stateful proxy for network calls. It monitors for failures, and if the failure rate for a particular dependency exceeds a configured threshold, the circuit "trips" or "opens." While the circuit is open, all subsequent calls to that dependency fail immediately without making a network request. After a timeout period, the circuit moves to a "half-open" state, allowing a single test request through. If it succeeds, the circuit closes and normal operation resumes. If it fails, the circuit opens again. This pattern allows a failing downstream service time to recover without being hammered by continuous requests.  
* **Tooling:** To facilitate the implementation of these patterns, the template recommends and provides examples using **Opossum**. Opossum is a lightweight, mature, and widely-used circuit breaker library for Node.js. An example would show how to wrap a method in a service layer that makes an external API call with an Opossum circuit breaker, complete with timeout and retry configurations.

## **Section 5: Containerization and Development Workflow**

Containerization is the standard for deploying and running modern cloud-native applications. It provides a consistent, portable, and isolated environment for the microservice. This section details the best practices for packaging the application with Docker for production and orchestrating a seamless, efficient local development workflow using Docker Compose.

### **5.1 The Optimized Production Dockerfile: A Multi-Stage Build Approach**

A production Docker image must be as small, efficient, and secure as possible. A smaller image size leads to faster deployments, reduced storage costs, and a smaller attack surface. The standard best practice for achieving this with Node.js applications is to use a **multi-stage build**.

The `Dockerfile` in this template is structured in two distinct stages:

1. **The `builder` Stage:**  
   * **Base Image:** This stage starts from a full, official `node` image (e.g., `node:lts`) which contains the complete Node.js runtime, npm, and other build tools.  
   * **Dependency Installation:** It first copies only the `package.json` and `package-lock.json` files. Then, it runs `npm ci --omit=dev` to install only the production dependencies. By copying the package files separately from the source code, Docker's layer caching is used effectively. The dependency layer will only be rebuilt if the package files change, not every time the source code changes.  
   * **Code Compilation:** After installing dependencies, it copies the rest of the application's source code and runs the TypeScript compiler (`npm run build`) to transpile the TypeScript code into plain JavaScript, placing the output in a `/dist` directory.  
   * **Prisma Client Generation:** It runs `npx prisma generate` to generate the Prisma Client based on the schema, ensuring the production image includes the latest database types.  
2. **The `production` Stage:**  
   * **Base Image:** This stage starts from a new, minimal base image, such as `node:lts-alpine`. The Alpine Linux-based image is significantly smaller than the full Node.js image, containing only the bare essentials needed to run the application.  
   * **Security:** It creates a dedicated, non-root user and group to run the application. Running as a non-root user is a critical security best practice that follows the principle of least privilege.  
   * **Artifact Copying:** It uses the `COPY --from=builder` instruction to selectively copy only the necessary artifacts from the `builder` stage: the `/dist` directory (containing the compiled JavaScript), the `/node_modules` directory (containing the production dependencies), and the generated Prisma Client.  
   * **Execution:** It sets the `NODE_ENV` environment variable to `production` and defines the `CMD` to run the application using `node dist/server.js`.

This multi-stage approach ensures that the final production image is lean and secure. It contains no source code, no TypeScript compiler, no development dependencies, and no unnecessary build tools, dramatically reducing its size and potential vulnerabilities.

### **5.2 Local Development at Scale: Orchestration with Docker Compose**

For local development, it is crucial to replicate the production environment as closely as possible to achieve "dev/prod parity," the tenth factor of the Twelve-Factor App methodology. Docker Compose is the ideal tool for defining and running a multi-container local environment, allowing a developer to spin up the entire application stack—the Node.js service, a database, a cache, etc.—with a single command.

The `docker-compose.yml` file in this template is configured for an optimal development experience:

* **`app` Service:**  
  * **Development Build Target:** It uses the `target` property within the `build` configuration to instruct Docker to build a specific `development` stage from the multi-stage `Dockerfile`. This development stage can be configured to install `devDependencies` (like `nodemon`) and use a startup command tailored for development.  
  * **Live Reloading with Volumes:** It uses a **bind mount volume** to map the local source code directory (e.g., `./src`) directly into the container's filesystem (e.g., `/app/src`). This is the key to an efficient development workflow. Any changes made to the code on the host machine are instantly reflected inside the running container, and a tool like `nodemon` (running inside the container) will detect these changes and automatically restart the Node.js server. This provides the benefits of a containerized environment without sacrificing the rapid feedback loop of local development.  
  * **Port Mapping:** It maps the application port (e.g., `3000:3000`) and the Node.js inspector/debug port (e.g., `9229:9229`) from the container to the host machine, making the application accessible via `localhost` and enabling remote debugging.  
  * **Environment Variables:** It uses the `env_file` property to load configuration variables from the local `.env` file directly into the container's environment.  
* **`db` Service (and other backing services):**  
  * **Official Images:** It uses official images from Docker Hub for backing services like `postgres` or `mongo`.  
  * **Data Persistence with Volumes:** It uses a **named volume** to persist database data (e.g., `db-data:/var/lib/postgresql/data`). Unlike bind mounts, named volumes are managed by Docker and ensure that data survives even if the `db` container is removed and recreated. This is essential for maintaining state during development.  
  * **Configuration:** It sets the necessary environment variables for the database service itself, such as `POSTGRES_USER` and `POSTGRES_PASSWORD`.

### **5.3 Debugging within a Containerized Environment**

An effective development workflow requires the ability to debug code seamlessly. This template is configured to allow developers to attach their IDE's debugger to the Node.js process running inside the Docker container.

* **Inspector Protocol:** The `dev` script in `package.json` will start the Node.js process with the `--inspect=0.0.0.0:9229` flag. The `0.0.0.0` is crucial as it tells Node.js to listen for debugger connections on all network interfaces within the container, not just `localhost`.  
* **Port Forwarding:** The `docker-compose.yml` file maps port 9229 from the container to the host machine.  
* **IDE Configuration:** With this setup, a developer can configure their IDE (like Visual Studio Code) with a `launch.json` file to "Attach to Node Process." The IDE will connect to `localhost:9229` on the host machine, and Docker will forward that connection to the Node.js inspector running inside the container. This allows for a full-featured debugging experience, including setting breakpoints, inspecting variables, and stepping through code, all while the application runs within its consistent, containerized environment.

## **Section 6: The Definitive `README.md`: The Interface for Human and AI Developers**

In a modern development ecosystem where teams are composed of both human and AI collaborators, the `README.md` file transcends its traditional role as simple documentation. It becomes the central specification, the primary interface, and the "system prompt" for the entire project. A well-architected `README.md` is the most critical component for achieving the goal of a template that is equally intelligible and actionable for all developers, regardless of whether they are human or machine.

### **6.1 Structure and Essential Sections of a High-Impact README**

A high-impact `README.md` must be structured, scannable, and comprehensive. It serves as the project's "book cover" and its primary operational manual. The following sections are considered essential for this template:

* **Project Title & Badges:** A clear, descriptive name for the microservice. Immediately following the title should be a series of status badges (e.g., from Shields.io) that provide at-a-glance metadata, such as build status (CI/CD), test coverage, code quality score, and the project's license.  
* **Description:** A concise, one-paragraph summary of the microservice's purpose. It should answer: What business problem does this service solve? What are its core responsibilities?.  
* **Table of Contents:** For any `README.md` of non-trivial length, a table of contents is mandatory for easy navigation. It allows readers to quickly jump to the section they need.  
* **Architectural Principles (Key for AI-Friendliness):** This is a non-traditional but vital section. It explicitly states the core architectural patterns the project adheres to. This section acts as a set of rules for any code generation task. Example: *"This service follows a component-driven architecture as defined in the organizational template. All business logic is organized by feature under `/src/components`."*  
* **Getting Started / Prerequisites:** A list of required tools that must be installed on a developer's local machine before they can run the project (e.g., Node.js LTS version, Docker, Docker Compose).  
* **Installation:** Step-by-step instructions for the initial setup of the project, such as cloning the repository and running an initial setup script if one exists.  
* **Running the Application (Local Development):** Clear, simple instructions on how to start the entire development stack using a single command, typically `docker-compose up`.  
* **Running Tests:** Instructions on how to execute the various test suites (e.g., `npm test` to run all tests, `npm run test:watch` for interactive development).  
* **API Reference:** This section should provide a link to the service's API documentation. Ideally, this would be an OpenAPI (Swagger) specification, which can be generated automatically from code annotations or a separate YAML file.  
* **Configuration:** A crucial section for both humans and automation. It must contain a table listing every environment variable the application uses, its purpose, whether it is required, and its default value (if any). This removes all ambiguity about how to configure the service.  
* **Contributing:** Guidelines for developers who wish to contribute to the project. This is another key area for providing explicit instructions to AI assistants. It should detail the process for creating a new component, the branching strategy, and the pull request process. Example: *"To add a new feature, create a new directory in `/src/components`. This directory must contain `.routes.ts`, `.controller.ts`, and `.service.ts` files, following the structure of the existing `users` component."*.  
* **License:** A clear statement of the project's open-source license (e.g., MIT, Apache 2.0).

### **6.2 A Complete, Annotated `README.md` Template**

The following is a complete, annotated template for the `README.md` file. The annotations (in the form of blockquotes) explain the purpose of each section and highlight how it is designed to be consumed by both human and AI developers.

---

# **Microservice**

([https://img.shields.io/travis/com/your-org/your-repo.svg?style=flat-square](https://img.shields.io/travis/com/your-org/your-repo.svg?style=flat-square))\]([https://travis-ci.com/your-org/your-repo](https://travis-ci.com/your-org/your-repo)) ([https://img.shields.io/codecov/c/github/your-org/your-repo.svg?style=flat-square](https://img.shields.io/codecov/c/github/your-org/your-repo.svg?style=flat-square))\]([https://codecov.io/gh/your-org/your-repo](https://codecov.io/gh/your-org/your-repo))

**Annotation:** Start with a clear title and essential badges. This provides immediate context and status information. AI tools can parse this metadata to understand the project's health and licensing.

## **Description**

This microservice is responsible for managing user profiles, authentication, and authorization within the ecosystem. It exposes a RESTful API for creating, retrieving, updating, and deleting user accounts.

**Annotation:** A concise, high-level summary. It clearly states the service's bounded context and primary function.

## **Table of Contents**

* \-(\#running-for-development) \-(\#running-tests) \-(\#api-documentation)

**Annotation:** Essential for navigation in a detailed README. The links allow both humans and tools to parse the document structure.

## **Architectural Principles**

This project adheres to a set of strict architectural principles to ensure consistency, maintainability, and scalability.

* **Twelve-Factor App:** This service follows the(). All configuration is provided via environment variables, and logs are treated as event streams to `stdout`.  
* **Component-Driven Architecture:** The codebase is organized by business feature, not by technical layer. All source code for a specific feature (e.g., users, products) is co-located in a directory under `/src/components`. Each component directory contains its own routes, controllers, services, and tests.  
* **Prisma as Single Source of Truth:** All database models and relationships are defined in `/prisma/schema.prisma`, providing a centralized, declarative data definition that is easily parsable by AI tools and human developers alike.  
* **Code Style:** This project uses() for all TypeScript code. All code is automatically formatted on commit.

**Annotation:** This is the "system prompt" for the AI. It explicitly states the core rules of the codebase. An AI assistant reading this will understand that new features must be created as components and that all configuration must come from the environment.

## **Prerequisites**

* (version specified in `.nvmrc`) \-() \-()

## **Installation**

1. Clone the repository:  
2. Create a local environment file from the example:  
3. Populate the `.env` file with your local configuration. See the section for details.

**Annotation:** Clear, step-by-step instructions that are easy for anyone (or any script) to follow.

## **Running for Development**

To start the service and all its backing services (like the database), run the following command:

The service will be available at `http://localhost:3001`. The API is configured with live-reloading, so any changes to the source code will automatically restart the server.

**Annotation:** Provides the single, simple command needed to get the entire development environment running.

## **Running Tests**

To run all unit, integration, and API tests, use:

To run tests in watch mode during development:

## **API Documentation**

This service's API is documented using the OpenAPI 3.0 standard.

\-(./docs/openapi.yml) \-(http://localhost:3001/api-docs) (when the service is running)

**Annotation:** Points to the formal contract of the service. AI tools can consume OpenAPI specs to understand endpoints, request/response schemas, and generate typed clients.

## **Configuration**

This service is configured using environment variables. The following variables are required:

**Annotation:** A clear, tabular format for configuration is highly machine-readable. It serves as the definitive reference for all required environment variables.

## **Contributing**

Contributions are welcome\! Please follow the guidelines below.

1. **Create a new branch** for your feature or bugfix.  
2. **Add a new component:** To add a new feature, create a new directory under `/src/components`. This directory **must** contain the following files and the components should be in plural form, following the pattern of existing components:  
   * `[componentName]s.routes.ts`  
   * `[componentName]s.controller.ts`  
   * `[componentName]s.service.ts`  
   * `[componentName]s.test.ts`  
3. **Write tests** for your changes. Ensure all tests pass by running `npm test`.  
4. **Ensure code style** is consistent by running the linter. The pre-commit hook will handle this automatically.  
5. **Submit a pull request** to the `main` branch.

**Annotation:** Provides explicit, procedural instructions for contribution. The instructions for adding a new component are a direct, actionable prompt for an AI assistant tasked with creating a new feature.

## **License**

This project is licensed under the MIT License. See the(./LICENSE) file for details.

---

## **Section 7: Prisma Development Workflow and Best Practices**

This section provides comprehensive guidance on working with Prisma in the context of the AI-friendly microservice template, including development workflows, testing strategies, and production deployment considerations.

### **7.1 Prisma Development Workflow**

#### **7.1.1 Initial Setup**
```bash
# Install Prisma CLI and client
npm install prisma @prisma/client
npm install --save-dev prisma

# Initialize Prisma (creates prisma/ directory and schema.prisma)
npx prisma init

# Generate Prisma Client after schema changes
npx prisma generate
```

#### **7.1.2 Schema Development**
```bash
# Start Prisma Studio for visual database management
npx prisma studio

# Format the schema file
npx prisma format

# Validate the schema
npx prisma validate
```

#### **7.1.3 Database Migrations**
```bash
# Create and apply a new migration
npx prisma migrate dev --name descriptive_name

# Apply pending migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View migration history
npx prisma migrate status
```

### **7.2 Testing with Prisma**

#### **7.2.1 Test Database Setup**
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Use test database URL
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  
  // Clean database before tests
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

#### **7.2.2 Component Testing with Prisma**
```typescript
// src/components/users/users.test.ts
import prisma from '../../config/prisma';
import { createUser, findUserById } from './users.service';

describe('User Service', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'John',
      lastName: 'Doe'
    };

    const user = await createUser(userData);
    
    expect(user.email).toBe(userData.email);
    expect(user.firstName).toBe(userData.firstName);
  });
});
```

### **7.3 Production Deployment Considerations**

#### **7.3.1 Migration Strategy**
```dockerfile
# Dockerfile
FROM node:lts-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:lts-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Apply migrations on startup
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

#### **7.3.2 Environment Configuration**
```env
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
NODE_ENV="production"
```

### **7.4 AI-Friendly Prisma Patterns**

#### **7.4.1 Consistent Service Patterns**
```typescript
// Standard CRUD operations pattern
export class UserService {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    return await prisma.user.delete({ where: { id } });
  }

  async findMany(params: Prisma.UserFindManyArgs): Promise<User[]> {
    return await prisma.user.findMany(params);
  }
}
```

#### **7.4.2 Type-Safe Query Building**
```typescript
// Leverage Prisma's type system for complex queries
export const findUsersWithOrders = async (): Promise<User[]> => {
  return await prisma.user.findMany({
    include: {
      orders: {
        where: {
          status: 'CONFIRMED'
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    },
    where: {
      email: {
        contains: '@example.com'
      }
    }
  });
};
```

### **7.5 Schema Evolution Best Practices**

#### **7.5.1 Backward-Compatible Changes**
```prisma
// Add optional fields to avoid breaking existing data
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  // New optional field
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### **7.5.2 Migration Naming Conventions**
```bash
# Use descriptive names for migrations
npx prisma migrate dev --name add_user_phone_field
npx prisma migrate dev --name create_order_status_enum
npx prisma migrate dev --name add_user_order_relationship
```

## **Section 8: Recommendations for Organizational Adoption and Extension**

This project template provides a robust foundation for developing individual microservices. However, its true value is realized when adopted as a standard across an organization. This final section provides strategic recommendations for rolling out the template and discusses advanced topics that arise when moving from a single service to a complete, interconnected microservice ecosystem.

### **7.1 Adoption Strategy**

To ensure consistent and effective use of this template across development teams, a deliberate adoption strategy is recommended:

* **Centralized Template Repository:** The template should be maintained in its own dedicated Git repository. This repository becomes the single source of truth. It should be versioned using semantic versioning, allowing teams to adopt updates at their own pace and providing a clear history of changes.  
* **Scaffolding with a CLI Tool:** To streamline the creation of new microservices, the organization should invest in building a simple command-line interface (CLI) tool. Using a tool like **Yeoman**, this CLI can prompt developers for basic information (e.g., service name, description) and then scaffold a new project by cloning the template repository and customizing the necessary files. This automates setup and guarantees that every new service starts from the exact same, approved foundation.  
* **Developer Education:** The introduction of a new standard requires education. The organization should conduct workshops and create internal documentation (leveraging this report) to train developers on the template's architecture, the rationale behind its design choices, and the expected development workflow. This ensures that the principles of the template are understood and not just blindly followed.

### **7.2 Advanced Topics for a Multi-Service Ecosystem**

A single microservice is only one node in a larger, distributed system. As an organization builds out its microservice landscape, more complex challenges related to inter-service communication, discovery, and API management will arise. While a full implementation of these patterns is beyond the scope of a single-service template, it is crucial to understand them.

* **Inter-Service Communication:** Services in a microservice architecture must communicate with each other. There are two primary communication paradigms :  
  * **Synchronous Communication (Request-Response):** This is when a service makes a request to another service and waits for a response.  
    * **REST/HTTP:** A simple and ubiquitous choice, ideal for queries and commands where an immediate response is expected.  
    * **gRPC:** A high-performance, binary protocol based on Remote Procedure Calls (RPC). It is an excellent choice for internal, service-to-service communication where performance is critical. It uses Protocol Buffers for defining service contracts, which enables strong typing and efficient serialization.  
  * **Asynchronous Communication (Event-Driven):** This is when a service sends a message or event without waiting for an immediate response. This pattern promotes loose coupling and improves system resilience.  
    * **Message Brokers (e.g., RabbitMQ, Kafka):** A service can publish an event to a message broker. Other interested services can subscribe to these events and react accordingly. This **Publish-Subscribe** pattern is ideal for notifying multiple services of a state change (e.g., a `UserCreated` event) without the publishing service needing to know who its consumers are.  
* **Service Discovery:** In a dynamic, containerized environment, service instances are ephemeral, and their IP addresses change frequently. Hardcoding URLs is therefore not a viable option. Services need a way to find each other dynamically. This is the role of **service discovery**.  
  * **Service Registry (e.g., Consul, etcd):** When a service instance starts, it registers its location (IP and port) with a central service registry. When another service wants to communicate with it, it queries the registry to get a list of healthy, available instances.  
  * **Platform-Based Discovery:** Modern container orchestrators like Kubernetes provide built-in service discovery mechanisms (e.g., via DNS), which is often the preferred approach when deploying on such platforms.  
* **API Gateway:** As the number of microservices grows, exposing each one directly to external clients becomes unmanageable and insecure. An **API Gateway** is a pattern where a single, dedicated service acts as the entry point for all external requests. The gateway is responsible for:  
  * **Routing:** Directing incoming requests to the appropriate internal microservice.  
  * **Cross-Cutting Concerns:** Handling concerns like authentication, authorization, rate limiting, and SSL termination in a centralized location, which simplifies the internal services.  
  * **API Composition:** Aggregating data from multiple internal services to fulfill a single client request.

By understanding these advanced patterns, an organization can effectively scale its use of this microservice template, moving from building individual, well-architected services to creating a cohesive, resilient, and scalable distributed system.

