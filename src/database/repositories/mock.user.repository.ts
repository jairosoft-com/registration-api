import { UserPublicData } from '@components/users/users.types';

// In-memory storage for testing
const users = new Map<string, any>();

export const mockUserRepository = {
  async findByEmail(email: string): Promise<UserPublicData | null> {
    for (const user of users.values()) {
      if (user.email === email) {
        const { password, ...publicData } = user;
        return publicData;
      }
    }
    return null;
  },

  async findByEmailWithPassword(email: string): Promise<any | null> {
    for (const user of users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  },

  async create(userData: any): Promise<UserPublicData> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const user = {
      id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.set(id, user);
    const { password, ...publicData } = user;
    return publicData;
  },

  async findById(id: string): Promise<UserPublicData | null> {
    const user = users.get(id);
    if (!user) return null;
    const { password, ...publicData } = user;
    return publicData;
  },

  async updateById(id: string, updateData: Partial<any>): Promise<UserPublicData | null> {
    const user = users.get(id);
    if (!user) return null;

    Object.assign(user, updateData, { updatedAt: new Date() });
    users.set(id, user);

    const { password, ...publicData } = user;
    return publicData;
  },

  async deleteById(id: string): Promise<boolean> {
    return users.delete(id);
  },

  async findAll(
    limit: number = 10,
    skip: number = 0
  ): Promise<{ users: UserPublicData[]; total: number }> {
    const allUsers = Array.from(users.values());
    const paginatedUsers = allUsers.slice(skip, skip + limit);
    const publicUsers = paginatedUsers.map((user) => {
      const { password, ...publicData } = user;
      return publicData;
    });

    return {
      users: publicUsers,
      total: allUsers.length,
    };
  },
};
