import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserStore } from '../auth/store/user.store';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

export interface UserListResponse {
  items: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UserService {
  constructor(private readonly userStore: UserStore) {}

  getUsers(page: number, limit: number): UserListResponse {
    const { items, total } = this.userStore.findAll(page, limit);

    return {
      items: items.map((user) => ({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

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

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserResponse> {
    const user = this.userStore.findById(userId);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = this.userStore.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException({
          code: 'USER_EMAIL_ALREADY_EXISTS',
          message: 'Email already exists',
        });
      }
    }

    const updateData: { email?: string; password?: string } = {};

    if (dto.email) {
      updateData.email = dto.email;
    }

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = this.userStore.update(userId, updateData);

    return {
      id: updatedUser!.id,
      email: updatedUser!.email,
      createdAt: updatedUser!.createdAt,
    };
  }
}
