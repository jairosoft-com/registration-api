import logger from '../../common/utils/logger';

// In-memory storage for mock registrations
const registrations = new Map<string, any>();
const emailIndex = new Map<string, string>(); // email -> registrationId

export class MockRegistrationRepository {
  async findOne(query: any): Promise<any | null> {
    // Handle findOne by email
    if (query.email) {
      const email = query.email.toLowerCase();
      const registrationId = emailIndex.get(email);
      if (registrationId) {
        return registrations.get(registrationId);
      }
    }

    // Handle findOne by id
    if (query.id) {
      return registrations.get(query.id) || null;
    }

    return null;
  }

  async save(registration: any): Promise<any> {
    // Generate ID if not present
    if (!registration.id) {
      registration.id = `reg_${Date.now()}${Math.random().toString(36).substring(2, 11)}`;
    }

    // Store in memory
    const savedReg = {
      ...registration,
      _id: registration.id,
      createdAt: registration.createdAt || new Date(),
      updatedAt: registration.updatedAt || new Date(),
      save: async function () {
        registrations.set(this.id, this);
        if (this.email) {
          emailIndex.set(this.email.toLowerCase(), this.id);
        }
        return this;
      },
    };

    registrations.set(savedReg.id, savedReg);
    if (savedReg.email) {
      emailIndex.set(savedReg.email.toLowerCase(), savedReg.id);
    }

    logger.debug({ id: savedReg.id }, 'Mock registration saved');
    return savedReg;
  }

  async create(data: any): Promise<any> {
    return this.save(data);
  }
}

// Create a mock model that mimics Mongoose model
export const MockRegistrationModel = {
  findOne: async function (query: any) {
    const repo = new MockRegistrationRepository();
    return repo.findOne(query);
  },

  create: async function (data: any) {
    const repo = new MockRegistrationRepository();
    return repo.create(data);
  },

  // Constructor function for creating new instances
  new: function (data: any) {
    const instance = {
      ...data,
      id: data.id || `reg_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      save: async function () {
        const repo = new MockRegistrationRepository();
        const saved = await repo.save(this);
        Object.assign(this, saved);
        return this;
      },
    };
    return instance;
  },
};

// Export constructor that returns instances with save method
export function createMockRegistrationModel(data: any) {
  return MockRegistrationModel.new(data);
}
