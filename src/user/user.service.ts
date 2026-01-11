import { Injectable, NotFoundException } from '@nestjs/common';
import { UserStore, User } from '../auth/store/user.store';

export interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class UserService {
  constructor(private readonly userStore: UserStore) {}

  getMe(userId: string): UserResponse {
    const user = this.userStore.findById(userId);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
