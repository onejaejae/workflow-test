import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { UserService, UserResponse } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser('userId') userId: string): UserResponse {
    return this.userService.getMe(userId);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.userService.updateMe(userId, dto);
  }
}
