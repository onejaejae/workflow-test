import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { PostStore } from '../store/post.store';

describe('PostService', () => {
  let service: PostService;
  let postStore: PostStore;

  const mockAuthorId = 'test-user-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService, PostStore],
    }).compile();

    service = module.get<PostService>(PostService);
    postStore = module.get<PostStore>(PostStore);
  });

  afterEach(() => {
    postStore.clear();
  });

  describe('create', () => {
    const createPostDto = {
      title: 'Test Post Title',
      content: 'Test post content',
    };

    it('should create a post successfully', () => {
      // Act
      const result = service.create(createPostDto, mockAuthorId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(createPostDto.title);
      expect(result.content).toBe(createPostDto.content);
      expect(result.authorId).toBe(mockAuthorId);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should save the post to the store', () => {
      // Act
      const result = service.create(createPostDto, mockAuthorId);

      // Assert
      const savedPost = postStore.findById(result.id);
      expect(savedPost).toBeDefined();
      expect(savedPost!.title).toBe(createPostDto.title);
      expect(savedPost!.content).toBe(createPostDto.content);
      expect(savedPost!.authorId).toBe(mockAuthorId);
    });

    it('should generate unique ids for each post', () => {
      // Act
      const result1 = service.create(createPostDto, mockAuthorId);
      const result2 = service.create(createPostDto, mockAuthorId);

      // Assert
      expect(result1.id).not.toBe(result2.id);
    });

    it('should set createdAt to current time', () => {
      // Arrange
      const before = new Date();

      // Act
      const result = service.create(createPostDto, mockAuthorId);

      // Assert
      const after = new Date();
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
