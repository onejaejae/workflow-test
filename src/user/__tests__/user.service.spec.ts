import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user.service';
import { UserStore, User } from '../../auth/store/user.store';
import * as bcrypt from 'bcrypt';

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

  describe('getUsers', () => {
    describe('when users exist', () => {
      beforeEach(() => {
        for (let i = 1; i <= 15; i++) {
          userStore.save({
            id: `user-${i}`,
            email: `user${i}@example.com`,
            password: 'hashed-password',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
          });
        }
      });

      it('should return paginated users with default values', () => {
        const result = service.getUsers(1, 10);

        expect(result.items).toHaveLength(10);
        expect(result.total).toBe(15);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(2);
      });

      it('should return second page correctly', () => {
        const result = service.getUsers(2, 10);

        expect(result.items).toHaveLength(5);
        expect(result.page).toBe(2);
      });

      it('should not include password in response', () => {
        const result = service.getUsers(1, 10);

        result.items.forEach((item) => {
          expect(item).not.toHaveProperty('password');
        });
      });

      it('should return user data correctly', () => {
        const result = service.getUsers(1, 10);

        expect(result.items[0]).toEqual({
          id: expect.any(String),
          email: expect.stringContaining('@example.com'),
          createdAt: expect.any(Date),
        });
      });
    });

    describe('when no users exist', () => {
      it('should return empty items with zero total', () => {
        const result = service.getUsers(1, 10);

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.totalPages).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should return empty items for page beyond total', () => {
        userStore.save(mockUser);
        const result = service.getUsers(100, 10);

        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(1);
        expect(result.page).toBe(100);
      });
    });
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

  describe('updateMe', () => {
    describe('when user exists', () => {
      beforeEach(() => {
        userStore.save(mockUser);
      });

      it('should update email only', async () => {
        // Act
        const result = await service.updateMe(mockUser.id, {
          email: 'new@example.com',
        });

        // Assert
        expect(result.email).toBe('new@example.com');
        expect(result.id).toBe(mockUser.id);
        expect(result).not.toHaveProperty('password');
      });

      it('should update password only', async () => {
        // Act
        const result = await service.updateMe(mockUser.id, {
          password: 'newpassword123',
        });

        // Assert
        expect(result.email).toBe(mockUser.email);

        const updatedUser = userStore.findById(mockUser.id);
        const isPasswordUpdated = await bcrypt.compare(
          'newpassword123',
          updatedUser!.password,
        );
        expect(isPasswordUpdated).toBe(true);
      });

      it('should update both email and password', async () => {
        // Act
        const result = await service.updateMe(mockUser.id, {
          email: 'new@example.com',
          password: 'newpassword123',
        });

        // Assert
        expect(result.email).toBe('new@example.com');

        const updatedUser = userStore.findById(mockUser.id);
        const isPasswordUpdated = await bcrypt.compare(
          'newpassword123',
          updatedUser!.password,
        );
        expect(isPasswordUpdated).toBe(true);
      });

      it('should allow updating to same email', async () => {
        // Act
        const result = await service.updateMe(mockUser.id, {
          email: mockUser.email,
        });

        // Assert
        expect(result.email).toBe(mockUser.email);
      });
    });

    describe('when user does not exist', () => {
      it('should throw NotFoundException', async () => {
        // Act & Assert
        await expect(
          service.updateMe('non-existent-id', { email: 'new@example.com' }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should have correct error code', async () => {
        // Act & Assert
        try {
          await service.updateMe('non-existent-id', { email: 'new@example.com' });
        } catch (error) {
          expect(error.response.code).toBe('USER_NOT_FOUND');
          expect(error.response.message).toBe('User not found');
        }
      });
    });

    describe('when email already exists', () => {
      const anotherUser: User = {
        id: 'another-user-id',
        email: 'existing@example.com',
        password: 'hashed-password',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      beforeEach(() => {
        userStore.save(mockUser);
        userStore.save(anotherUser);
      });

      it('should throw ConflictException', async () => {
        // Act & Assert
        await expect(
          service.updateMe(mockUser.id, { email: 'existing@example.com' }),
        ).rejects.toThrow(ConflictException);
      });

      it('should have correct error code', async () => {
        // Act & Assert
        try {
          await service.updateMe(mockUser.id, { email: 'existing@example.com' });
        } catch (error) {
          expect(error.response.code).toBe('USER_EMAIL_ALREADY_EXISTS');
          expect(error.response.message).toBe('Email already exists');
        }
      });
    });
  });
});
