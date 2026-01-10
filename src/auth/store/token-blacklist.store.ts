import { Injectable } from '@nestjs/common';

interface BlacklistedToken {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class TokenBlacklistStore {
  private blacklist: Map<string, BlacklistedToken> = new Map();

  add(token: string, expiresAt: Date): void {
    this.blacklist.set(token, { token, expiresAt });
  }

  isBlacklisted(token: string): boolean {
    const entry = this.blacklist.get(token);
    if (!entry) {
      return false;
    }

    if (new Date() > entry.expiresAt) {
      this.blacklist.delete(token);
      return false;
    }

    return true;
  }

  clear(): void {
    this.blacklist.clear();
  }
}
