import { Injectable } from '@nestjs/common';

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

@Injectable()
export class PostStore {
  private posts: Map<string, Post> = new Map();

  findById(id: string): Post | undefined {
    return this.posts.get(id);
  }

  findAll(): Post[] {
    return Array.from(this.posts.values());
  }

  save(post: Post): Post {
    this.posts.set(post.id, post);
    return post;
  }

  delete(id: string): boolean {
    return this.posts.delete(id);
  }

  clear(): void {
    this.posts.clear();
  }
}
