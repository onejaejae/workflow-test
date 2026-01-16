import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Title must be at most 100 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Content must be at most 10000 characters' })
  content?: string;
}
