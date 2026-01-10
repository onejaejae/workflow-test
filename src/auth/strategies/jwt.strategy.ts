import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UserStore } from '../store/user.store';
import { TokenBlacklistStore } from '../store/token-blacklist.store';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userStore: UserStore,
    private readonly tokenBlacklistStore: TokenBlacklistStore,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-key',
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    if (token && this.tokenBlacklistStore.isBlacklisted(token)) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_REVOKED',
        message: 'Token has been revoked',
      });
    }

    const user = this.userStore.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    return { userId: payload.sub, email: payload.email };
  }
}
