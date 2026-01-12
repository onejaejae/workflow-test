import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { UserStore } from '../src/auth/store/user.store';
import { PostStore } from '../src/post/store/post.store';

describe('Post (e2e)', () => {
  let app: INestApplication;
  let userStore: UserStore;
  let postStore: PostStore;
  let accessToken: string;

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
    postStore = moduleFixture.get<PostStore>(PostStore);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    userStore.clear();
    postStore.clear();

    // Create user and get access token
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(testUser);

    accessToken = loginResponse.body.data.accessToken;
  });

  describe('POST /api/v1/posts', () => {
    const validPayload = {
      title: 'Test Post Title',
      content: 'Test post content',
    };

    describe('Happy path', () => {
      it('should return 201 with created post data', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validPayload)
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: expect.objectContaining({
            id: expect.any(String),
            title: validPayload.title,
            content: validPayload.content,
            authorId: expect.any(String),
            createdAt: expect.any(String),
          }),
        });
      });

      it('should save the post to the store', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validPayload)
          .expect(201);

        const savedPost = postStore.findById(response.body.data.id);
        expect(savedPost).toBeDefined();
        expect(savedPost!.title).toBe(validPayload.title);
      });
    });

    describe('Authentication errors', () => {
      it('should return 401 when no token provided', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .send(validPayload)
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should return 401 when invalid token provided', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', 'Bearer invalid-token')
          .send(validPayload)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 when title is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'Test content' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when content is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Test Title' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when title is empty', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: '', content: 'Test content' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when title exceeds max length', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'a'.repeat(101), content: 'Test content' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 400 when content exceeds max length', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Test Title', content: 'a'.repeat(10001) })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });
});
