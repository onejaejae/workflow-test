import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserStore } from './store/user.store';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserStore],
  exports: [AuthService],
})
export class AuthModule {}
