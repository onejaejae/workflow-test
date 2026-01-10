import { TokenBlacklistStore } from './token-blacklist.store';

describe('TokenBlacklistStore', () => {
  let store: TokenBlacklistStore;

  beforeEach(() => {
    store = new TokenBlacklistStore();
  });

  afterEach(() => {
    store.clear();
  });

  describe('add', () => {
    it('should add token to blacklist', () => {
      // Arrange
      const token = 'test-token';
      const expiresAt = new Date(Date.now() + 3600000);

      // Act
      store.add(token, expiresAt);

      // Assert
      expect(store.isBlacklisted(token)).toBe(true);
    });
  });

  describe('isBlacklisted', () => {
    it('should return false for non-blacklisted token', () => {
      // Act & Assert
      expect(store.isBlacklisted('unknown-token')).toBe(false);
    });

    it('should return true for blacklisted token', () => {
      // Arrange
      const token = 'test-token';
      const expiresAt = new Date(Date.now() + 3600000);
      store.add(token, expiresAt);

      // Act & Assert
      expect(store.isBlacklisted(token)).toBe(true);
    });

    it('should return false for expired blacklisted token', () => {
      // Arrange
      const token = 'expired-token';
      const expiresAt = new Date(Date.now() - 1000);
      store.add(token, expiresAt);

      // Act & Assert
      expect(store.isBlacklisted(token)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all tokens from blacklist', () => {
      // Arrange
      store.add('token1', new Date(Date.now() + 3600000));
      store.add('token2', new Date(Date.now() + 3600000));

      // Act
      store.clear();

      // Assert
      expect(store.isBlacklisted('token1')).toBe(false);
      expect(store.isBlacklisted('token2')).toBe(false);
    });
  });
});
