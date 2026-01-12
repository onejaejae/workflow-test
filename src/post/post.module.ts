import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostStore } from './store/post.store';

@Module({
  imports: [AuthModule],
  controllers: [PostController],
  providers: [PostService, PostStore],
  exports: [PostService, PostStore],
})
export class PostModule {}
