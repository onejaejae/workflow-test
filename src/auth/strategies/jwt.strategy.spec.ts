import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UserStore, User } from '../store/user.store';
import { TokenBlacklistStore } from '../store/token-blacklist.store';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userStore: UserStore;
  let tokenBlacklistStore: TokenBlacklistStore;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy, UserStore, TokenBlacklistStore],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userStore = module.get<UserStore>(UserStore);
    tokenBlacklistStore = module.get<TokenBlacklistStore>(TokenBlacklistStore);
  });

  afterEach(() => {
    userStore.clear();
    tokenBlacklistStore.clear();
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: 'user-123',
      email: 'test@example.com',
    };

    const createMockRequest = (token: string) => ({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    describe('when token is valid and user exists', () => {
      it('should return user payload', async () => {
        // Arrange
        userStore.save(mockUser);
        const mockRequest = createMockRequest('valid-token');

        // Act
        const result = await strategy.validate(mockRequest as any, payload);

        // Assert
        expect(result).toEqual({
          userId: payload.sub,
          email: payload.email,
        });
      });
    });

    describe('when token is blacklisted', () => {
      it('should throw UnauthorizedException', async () => {
        // Arrange
        userStore.save(mockUser);
        tokenBlacklistStore.add('blacklisted-token', new Date(Date.now() + 3600000));
        const mockRequest = createMockRequest('blacklisted-token');

        // Act & Assert
        await expect(strategy.validate(mockRequest as any, payload)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should have correct error code', async () => {
        // Arrange
        userStore.save(mockUser);
        tokenBlacklistStore.add('blacklisted-token', new Date(Date.now() + 3600000));
        const mockRequest = createMockRequest('blacklisted-token');

        // Act & Assert
        try {
          await strategy.validate(mockRequest as any, payload);
        } catch (error) {
          expect(error.response.code).toBe('AUTH_TOKEN_REVOKED');
        }
      });
    });

    describe('when user not found', () => {
      it('should throw UnauthorizedException', async () => {
        // Arrange
        const mockRequest = createMockRequest('valid-token');

        // Act & Assert
        await expect(strategy.validate(mockRequest as any, payload)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should have correct error code', async () => {
        // Arrange
        const mockRequest = createMockRequest('valid-token');

        // Act & Assert
        try {
          await strategy.validate(mockRequest as any, payload);
        } catch (error) {
          expect(error.response.code).toBe('AUTH_USER_NOT_FOUND');
        }
      });
    });
  });
});
