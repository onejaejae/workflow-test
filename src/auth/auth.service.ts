import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SignupDto } from './dto/signup.dto';
import { UserStore, User } from './store/user.store';

export interface SignupResponse {
  id: string;
  email: string;
  createdAt: Date;
}

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(private readonly userStore: UserStore) {}

  async signup(dto: SignupDto): Promise<SignupResponse> {
    const existingUser = this.userStore.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException({
        code: 'AUTH_EMAIL_ALREADY_EXISTS',
        message: 'Email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user: User = {
      id: uuidv4(),
      email: dto.email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    this.userStore.save(user);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
