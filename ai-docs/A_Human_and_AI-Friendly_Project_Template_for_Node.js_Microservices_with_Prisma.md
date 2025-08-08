# **A Human- and AI-Friendly Project Template for Node.js Microservices with Prisma**

## **1\. Introduction**

In modern software development, particularly in the realm of microservices, a well-defined and consistent project structure is paramount. It's the bedrock upon which scalable, maintainable, and robust applications are built. A logical structure not only enhances developer productivity but is also crucial for the effectiveness of AI-powered development tools.

This document presents a project template for Node.js/Express.js microservices that is optimized for **Prisma**. The architecture combines a component-driven approach with Prisma's declarative data modeling, resulting in a system that is intuitive for human developers and easily parsable by AI agents. The core principles remain **modularity**, **separation of concerns**, and **scalability**.

## **2\. The Core Philosophy: Components \+ a Single Source of Truth**

This template is built on two key ideas:

1. **Component-Driven Architecture**: Each business feature is encapsulated in its own self-contained "component" directory.  
2. **A Single Source of Truth for Data**: Prisma's schema.prisma file acts as the unambiguous, central definition for all data models and database relations.

This combination is powerful. The schema.prisma provides a clear blueprint that AI tools excel at understanding, while the component structure keeps the business logic neatly organized.

## **3\. The Project Structure with Prisma**

A clear and predictable folder structure is the first step. The inclusion of the prisma directory at the root is a key change.

/  
|-- prisma/  
|   |-- schema.prisma  
|   |-- migrations/  
|-- .dockerignore  
|-- .env  
|-- .env.example  
|-- .gitignore  
|-- docker-compose.yml  
|-- Dockerfile  
|-- package.json  
|-- README.md  
|-- src/  
|   |-- components/  
|   |   |-- users/  
|   |   |   |-- index.ts  
|   |   |   |-- users.controller.ts  
|   |   |   |-- users.routes.ts  
|   |   |   |-- users.service.ts  
|   |   |   |-- users.test.ts  
|   |   |   |-- users.validation.ts  
|   |-- common/  
|   |   |-- middlewares/  
|   |   |-- utils/  
|   |-- config/  
|   |   |-- prisma.ts  
|   |   |-- logger.js  
|   |-- app.js  
|   |-- server.js  
|-- tests/  
|   |-- fixtures/  
|   |-- setup.js

## **4\. Breakdown of the Structure**

### **4.1. Root Directory & The prisma Folder**

* **prisma/schema.prisma**: This is the most important new file. It is the **single source of truth** for your database schema. You define all your models, fields, and relations here in a simple, declarative language.  
* **prisma/migrations/**: Prisma automatically generates SQL migration files here when you run the prisma migrate dev command. You should commit this folder to version control.  
* **Other Root Files**: package.json should now include prisma as a dev dependency and @prisma/client as a regular dependency. Other files (Dockerfile, .env, etc.) remain standard.

### **4.2. src/components/ \- Leaner Business Logic**

The component folders are now leaner because the data model definition has been moved to the central schema.prisma file.

* **users.model.ts (Removed)**: This file is no longer needed. Prisma automatically generates TypeScript types from your schema.prisma file, which you can import and use directly in your services and controllers.  
* **users.service.ts**: This is where the core business logic resides. You will import the **Prisma Client** instance here and use it to perform all database operations (create, read, update, delete). All queries will be fully type-safe based on your schema.  
* **Other Component Files**: The roles of .routes.ts, .controller.ts, .validation.ts, and .test.ts remain the same.

### **4.3. src/config/ \- Centralized Clients**

* **prisma.ts**: This new file is responsible for instantiating and exporting a single instance of the Prisma Client. This ensures you don't create multiple connections to the database. It's a best practice to have one shared instance for the entire application.  
* **logger.js**: Its role remains the same, handling application logging.

### **4.4. src/common/ & tests/**

The roles of these directories remain unchanged. common holds reusable code like error-handling middleware, while tests holds global test setup and fixtures.

## **5\. Conclusion**

Integrating Prisma into this component-driven architecture creates a highly efficient and robust development experience. The schema.prisma file provides a clear, machine-readable contract that enhances collaboration between human developers and AI tools. This structure not only makes the codebase easier to reason about and test but also leverages the full power of Prisma's type safety and developer-friendly tooling, setting a solid foundation for any modern microservice.