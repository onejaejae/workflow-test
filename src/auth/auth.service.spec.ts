import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserStore } from './store/user.store';
import { SignupDto } from './dto/signup.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userStore: UserStore;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UserStore],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userStore = module.get<UserStore>(UserStore);
  });

  afterEach(() => {
    userStore.clear();
  });

  describe('signup', () => {
    const validDto: SignupDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    describe('when valid data provided', () => {
      it('should create user successfully', async () => {
        // Act
        const result = await service.signup(validDto);

        // Assert
        expect(result).toHaveProperty('id');
        expect(result.email).toBe(validDto.email);
        expect(result).toHaveProperty('createdAt');
        expect(result).not.toHaveProperty('password');
      });

      it('should hash password', async () => {
        // Act
        await service.signup(validDto);
        const savedUser = userStore.findByEmail(validDto.email);

        // Assert
        expect(savedUser).toBeDefined();
        expect(savedUser?.password).not.toBe(validDto.password);
        const isMatch = await bcrypt.compare(
          validDto.password,
          savedUser!.password,
        );
        expect(isMatch).toBe(true);
      });
    });

    describe('when email already exists', () => {
      it('should throw ConflictException', async () => {
        // Arrange
        await service.signup(validDto);

        // Act & Assert
        await expect(service.signup(validDto)).rejects.toThrow(
          ConflictException,
        );
      });

      it('should have correct error code', async () => {
        // Arrange
        await service.signup(validDto);

        // Act & Assert
        try {
          await service.signup(validDto);
        } catch (error) {
          expect(error.response.code).toBe('AUTH_EMAIL_ALREADY_EXISTS');
        }
      });
    });
  });
});
