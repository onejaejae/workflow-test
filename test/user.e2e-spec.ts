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
});
