import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { UserStore } from '../src/auth/store/user.store';
import { TokenBlacklistStore } from '../src/auth/store/token-blacklist.store';

describe('User (e2e)', () => {
  let app: INestApplication;
  let userStore: UserStore;
  let tokenBlacklistStore: TokenBlacklistStore;

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    userStore = moduleFixture.get<UserStore>(UserStore);
    tokenBlacklistStore = moduleFixture.get<TokenBlacklistStore>(TokenBlacklistStore);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    userStore.clear();
    tokenBlacklistStore.clear();
  });

  describe('GET /api/v1/users', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(testUser);

      accessToken = loginResponse.body.data.accessToken;
    });

    describe('Happy path', () => {
      it('should return 200 with paginated users', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            items: expect.any(Array),
            total: expect.any(Number),
            page: 1,
            limit: 10,
            totalPages: expect.any(Number),
          },
        });
      });

      it('should return users with correct structure', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data.items.length).toBeGreaterThan(0);
        expect(response.body.data.items[0]).toEqual({
          id: expect.any(String),
          email: expect.any(String),
          createdAt: expect.any(String),
        });
      });

      it('should not include password in response', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        response.body.data.items.forEach((item: any) => {
          expect(item).not.toHaveProperty('password');
        });
      });

      it('should respect page and limit query params', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users?page=1&limit=5')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(5);
      });
    });

    describe('Error cases', () => {
      it('should return 401 when no token provided', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: expect.any(String),
          },
        });
      });

      it('should return 401 when invalid token provided', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AUTH_UNAUTHORIZED');
      });

      it('should return 400 when page is invalid', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users?page=0')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when limit exceeds max', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users?limit=101')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('GET /api/v1/users/me', () => {
    describe('Happy path', () => {
      it('should return 200 with user data when authenticated', async () => {
        // Arrange: signup and login
        await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send(testUser);

        const loginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(testUser);

        const accessToken = loginResponse.body.data.accessToken;

        // Act
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        // Assert
        expect(response.body).toEqual({
          success: true,
          data: expect.objectContaining({
            id: expect.any(String),
            email: testUser.email,
            createdAt: expect.any(String),
          }),
        });
      });

      it('should not return password in response', async () => {
        // Arrange
        await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send(testUser);

        const loginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(testUser);

        const accessToken = loginResponse.body.data.accessToken;

        // Act
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        // Assert
        expect(response.body.data).not.toHaveProperty('password');
      });
    });

    describe('Error cases', () => {
      it('should return 401 when no token provided', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me')
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: expect.any(String),
          },
        });
      });

      it('should return 401 when invalid token provided', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AUTH_UNAUTHORIZED');
      });

      it('should return 401 when token is blacklisted (logged out)', async () => {
        // Arrange: signup, login, then logout
        await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send(testUser);

        const loginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(testUser);

        const accessToken = loginResponse.body.data.accessToken;

        // Logout
        await request(app.getHttpServer())
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        // Act: try to access with logged out token
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AUTH_UNAUTHORIZED');
      });
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(testUser);

      accessToken = loginResponse.body.data.accessToken;
    });

    describe('Happy path', () => {
      it('should update email only', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'new@example.com' })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: expect.objectContaining({
            id: expect.any(String),
            email: 'new@example.com',
            createdAt: expect.any(String),
          }),
        });
      });

      it('should update password only', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ password: 'newpassword123' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(testUser.email);

        // Verify new password works
        const loginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: testUser.email, password: 'newpassword123' })
          .expect(200);

        expect(loginResponse.body.success).toBe(true);
      });

      it('should update both email and password', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'new@example.com', password: 'newpassword123' })
          .expect(200);

        expect(response.body.data.email).toBe('new@example.com');

        // Verify new credentials work
        const loginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'new@example.com', password: 'newpassword123' })
          .expect(200);

        expect(loginResponse.body.success).toBe(true);
      });

      it('should not return password in response', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'new@example.com' })
          .expect(200);

        expect(response.body.data).not.toHaveProperty('password');
      });
    });

    describe('Error cases', () => {
      it('should return 401 when no token provided', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .send({ email: 'new@example.com' })
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: expect.any(String),
          },
        });
      });

      it('should return 409 when email already exists', async () => {
        // Create another user
        const anotherUser = {
          email: 'existing@example.com',
          password: 'password123',
        };
        await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send(anotherUser);

        // Try to update to existing email
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'existing@example.com' })
          .expect(409);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'USER_EMAIL_ALREADY_EXISTS',
            message: 'Email already exists',
          },
        });
      });

      it('should return 400 when email format is invalid', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'invalid-email' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when password is too short', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ password: 'short' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });
});
