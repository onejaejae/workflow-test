import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @MaxLength(100, { message: 'Title must be at most 100 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MaxLength(10000, { message: 'Content must be at most 10000 characters' })
  content?: string;
}
