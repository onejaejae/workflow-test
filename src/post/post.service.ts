import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostStore, Post } from './store/post.store';

export interface CreatePostResponse {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

export interface UpdatePostResponse {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

@Injectable()
export class PostService {
  constructor(private readonly postStore: PostStore) {}

  create(dto: CreatePostDto, authorId: string): CreatePostResponse {
    const post: Post = {
      id: uuidv4(),
      title: dto.title,
      content: dto.content,
      authorId,
      createdAt: new Date(),
    };

    this.postStore.save(post);

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      createdAt: post.createdAt,
    };
  }

  delete(id: string, userId: string): void {
    const post = this.postStore.findById(id);

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
      });
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException({
        code: 'POST_DELETE_FORBIDDEN',
        message: 'You can only delete your own posts',
      });
    }

    this.postStore.delete(id);
  }

  update(id: string, dto: UpdatePostDto, userId: string): UpdatePostResponse {
    const post = this.postStore.findById(id);

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
      });
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException({
        code: 'POST_UPDATE_FORBIDDEN',
        message: 'You can only update your own posts',
      });
    }

    const updatedPost: Post = {
      ...post,
      title: dto.title !== undefined ? dto.title : post.title,
      content: dto.content !== undefined ? dto.content : post.content,
    };

    this.postStore.save(updatedPost);

    return {
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      authorId: updatedPost.authorId,
      createdAt: updatedPost.createdAt,
    };
  }
}
