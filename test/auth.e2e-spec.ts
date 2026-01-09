import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { UserStore } from '../src/auth/store/user.store';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userStore: UserStore;

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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    userStore.clear();
  });

  describe('POST /api/v1/auth/signup', () => {
    const validPayload = {
      email: 'test@example.com',
      password: 'password123',
    };

    describe('Happy path', () => {
      it('should return 201 with user data', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send(validPayload)
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: expect.objectContaining({
            id: expect.any(String),
            email: validPayload.email,
            createdAt: expect.any(String),
          }),
        });
      });

      it('should not return password in response', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send(validPayload)
          .expect(201);

        expect(response.body.data).not.toHaveProperty('password');
      });
    });

    describe('Validation errors', () => {
      it('should return 400 when email is invalid', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({ email: 'invalid-email', password: 'password123' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when password is too short', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({ email: 'test@example.com', password: 'short' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when email is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({ password: 'password123' })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({ email: 'test@example.com' })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Duplicate email', () => {
      it('should return 409 when email already exists', async () => {
        // First signup
        await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send(validPayload)
          .expect(201);

        // Second signup with same email
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send(validPayload)
          .expect(409);

        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'AUTH_EMAIL_ALREADY_EXISTS',
            message: 'Email already exists',
          },
        });
      });
    });
  });
});
