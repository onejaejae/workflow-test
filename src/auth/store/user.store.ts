import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

@Injectable()
export class UserStore {
  private users: Map<string, User> = new Map();

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  findAll(page: number, limit: number): { items: User[]; total: number } {
    const allUsers = Array.from(this.users.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = allUsers.length;
    const startIndex = (page - 1) * limit;
    const items = allUsers.slice(startIndex, startIndex + limit);

    return { items, total };
  }

  save(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): User | undefined {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }

    const updatedUser: User = {
      ...user,
      ...data,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  clear(): void {
    this.users.clear();
  }
}
