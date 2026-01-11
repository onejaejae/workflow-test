import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from '../user.service';
import { UserStore, User } from '../../auth/store/user.store';

describe('UserService', () => {
  let service: UserService;
  let userStore: UserStore;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, UserStore],
    }).compile();

    service = module.get<UserService>(UserService);
    userStore = module.get<UserStore>(UserStore);
  });

  afterEach(() => {
    userStore.clear();
  });

  describe('getMe', () => {
    describe('when user exists', () => {
      it('should return user data without password', () => {
        // Arrange
        userStore.save(mockUser);

        // Act
        const result = service.getMe(mockUser.id);

        // Assert
        expect(result).toEqual({
          id: mockUser.id,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
        });
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('when user does not exist', () => {
      it('should throw NotFoundException', () => {
        // Act & Assert
        expect(() => service.getMe('non-existent-id')).toThrow(
          NotFoundException,
        );
      });

      it('should have correct error code', () => {
        // Act & Assert
        try {
          service.getMe('non-existent-id');
        } catch (error) {
          expect(error.response.code).toBe('USER_NOT_FOUND');
          expect(error.response.message).toBe('User not found');
        }
      });
    });
  });
});
