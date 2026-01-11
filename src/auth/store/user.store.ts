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
