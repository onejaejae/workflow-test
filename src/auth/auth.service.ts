import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserStore, User } from './store/user.store';

export interface SignupResponse {
  id: string;
  email: string;
  createdAt: Date;
}

export interface LoginResponse {
  accessToken: string;
}

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly userStore: UserStore,
    private readonly jwtService: JwtService,
  ) {}

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

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = this.userStore.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_PASSWORD',
        message: 'Invalid password',
      });
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
