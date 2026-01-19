import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
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

  describe('delete', () => {
    const createPostDto = {
      title: 'Test Post Title',
      content: 'Test post content',
    };

    it('should delete a post successfully', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);

      // Act
      service.delete(createdPost.id, mockAuthorId);

      // Assert
      const deletedPost = postStore.findById(createdPost.id);
      expect(deletedPost).toBeUndefined();
    });

    it('should throw NotFoundException when post does not exist', () => {
      // Act & Assert
      expect(() => service.delete('non-existent-id', mockAuthorId)).toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not the author', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);
      const anotherUserId = 'another-user-id';

      // Act & Assert
      expect(() => service.delete(createdPost.id, anotherUserId)).toThrow(
        ForbiddenException,
      );
    });

    it('should not delete the post when user is not the author', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);
      const anotherUserId = 'another-user-id';

      // Act
      try {
        service.delete(createdPost.id, anotherUserId);
      } catch {
        // Expected to throw
      }

      // Assert - post should still exist
      const existingPost = postStore.findById(createdPost.id);
      expect(existingPost).toBeDefined();
    });
  });

  describe('update', () => {
    const createPostDto = {
      title: 'Original Title',
      content: 'Original content',
    };

    it('should update a post successfully', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);
      const updateDto = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      // Act
      const result = service.update(createdPost.id, updateDto, mockAuthorId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(createdPost.id);
      expect(result.title).toBe(updateDto.title);
      expect(result.content).toBe(updateDto.content);
      expect(result.authorId).toBe(mockAuthorId);
      expect(result.createdAt).toEqual(createdPost.createdAt);
    });

    it('should update only title when content is not provided', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);
      const updateDto = { title: 'Updated Title' };

      // Act
      const result = service.update(createdPost.id, updateDto, mockAuthorId);

      // Assert
      expect(result.title).toBe(updateDto.title);
      expect(result.content).toBe(createPostDto.content);
    });

    it('should update only content when title is not provided', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);
      const updateDto = { content: 'Updated content' };

      // Act
      const result = service.update(createdPost.id, updateDto, mockAuthorId);

      // Assert
      expect(result.title).toBe(createPostDto.title);
      expect(result.content).toBe(updateDto.content);
    });

    it('should save the updated post to the store', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);
      const updateDto = { title: 'Updated Title' };

      // Act
      service.update(createdPost.id, updateDto, mockAuthorId);

      // Assert
      const savedPost = postStore.findById(createdPost.id);
      expect(savedPost).toBeDefined();
      expect(savedPost!.title).toBe(updateDto.title);
    });

    it('should throw NotFoundException when post does not exist', () => {
      // Act & Assert
      expect(() =>
        service.update('non-existent-id', { title: 'Updated' }, mockAuthorId),
      ).toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the author', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);
      const anotherUserId = 'another-user-id';

      // Act & Assert
      expect(() =>
        service.update(createdPost.id, { title: 'Updated' }, anotherUserId),
      ).toThrow(ForbiddenException);
    });

    it('should not update the post when user is not the author', () => {
      // Arrange
      const createdPost = service.create(createPostDto, mockAuthorId);
      const anotherUserId = 'another-user-id';

      // Act
      try {
        service.update(createdPost.id, { title: 'Updated' }, anotherUserId);
      } catch {
        // Expected to throw
      }

      // Assert - post should remain unchanged
      const existingPost = postStore.findById(createdPost.id);
      expect(existingPost).toBeDefined();
      expect(existingPost!.title).toBe(createPostDto.title);
    });
  });
});
