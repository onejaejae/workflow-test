import {
  Controller,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  PostService,
  CreatePostResponse,
  UpdatePostResponse,
} from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreatePostDto,
    @CurrentUser('userId') userId: string,
  ): CreatePostResponse {
    return this.postService.create(dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  delete(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): void {
    this.postService.delete(id, userId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser('userId') userId: string,
  ): UpdatePostResponse {
    return this.postService.update(id, dto, userId);
  }
}
