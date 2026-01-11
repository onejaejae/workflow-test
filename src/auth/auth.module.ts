import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserStore } from './store/user.store';
import { TokenBlacklistStore } from './store/token-blacklist.store';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserStore, TokenBlacklistStore, JwtStrategy],
  exports: [AuthService, JwtStrategy, UserStore],
})
export class AuthModule {}
