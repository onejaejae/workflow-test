import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserStore } from './store/user.store';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userStore: UserStore;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UserStore,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userStore = module.get<UserStore>(UserStore);
    jwtService = module.get<JwtService>(JwtService);
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

  describe('login', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    describe('when valid credentials provided', () => {
      it('should return access token', async () => {
        // Arrange
        await service.signup(signupDto);

        // Act
        const result = await service.login(loginDto);

        // Assert
        expect(result).toHaveProperty('accessToken');
        expect(result.accessToken).toBe('mock-jwt-token');
      });

      it('should call jwtService.sign with correct payload', async () => {
        // Arrange
        await service.signup(signupDto);
        mockJwtService.sign.mockClear();

        // Act
        await service.login(loginDto);

        // Assert
        expect(mockJwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            email: signupDto.email,
            sub: expect.any(String),
          }),
        );
      });
    });

    describe('when user not found', () => {
      it('should throw UnauthorizedException', async () => {
        // Act & Assert
        await expect(service.login(loginDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should have correct error code', async () => {
        // Act & Assert
        try {
          await service.login(loginDto);
        } catch (error) {
          expect(error.response.code).toBe('AUTH_USER_NOT_FOUND');
        }
      });
    });

    describe('when password is invalid', () => {
      it('should throw UnauthorizedException', async () => {
        // Arrange
        await service.signup(signupDto);
        const invalidLoginDto: LoginDto = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        // Act & Assert
        await expect(service.login(invalidLoginDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should have correct error code', async () => {
        // Arrange
        await service.signup(signupDto);
        const invalidLoginDto: LoginDto = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        // Act & Assert
        try {
          await service.login(invalidLoginDto);
        } catch (error) {
          expect(error.response.code).toBe('AUTH_INVALID_PASSWORD');
        }
      });
    });
  });
});
