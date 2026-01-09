import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, SignupResponse } from './auth.service';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto): Promise<SignupResponse> {
    return this.authService.signup(dto);
  }
}
