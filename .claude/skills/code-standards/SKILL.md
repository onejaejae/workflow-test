---
name: code-standards
description: 코드 구현 및 테스트 작성 시 표준을 제공합니다. 파일 구조, 네이밍 컨벤션, 테스트 패턴(Happy/Edge/Error), 커밋 컨벤션을 참조합니다. 키워드: 코드 구현, 테스트 작성, Service, 커밋
---

# Code Standards

코드 구현 및 테스트 작성 시 참조하는 표준입니다.

---

## 파일 구조

```
src/{domain}/
├── {domain}.module.ts
├── {domain}.controller.ts
├── {domain}.service.ts
├── dto/
│   ├── create-{domain}.dto.ts
│   └── update-{domain}.dto.ts
├── entities/
│   └── {domain}.entity.ts
├── guards/
├── decorators/
└── __tests__/
    └── {domain}.service.spec.ts
```

## 네이밍 컨벤션

| 유형 | 컨벤션 | 예시 |
|------|--------|------|
| 파일명 | kebab-case | `token-blacklist.store.ts` |
| 클래스 | PascalCase | `TokenBlacklistStore` |
| 메서드/변수 | camelCase | `findUserById` |
| 상수 | UPPER_SNAKE | `MAX_RETRY_COUNT` |

---

## 테스트 패턴

### 테스트 케이스 분류

| 유형 | 설명 | 예시 |
|------|------|------|
| Happy Path | 정상 동작 | 유효한 데이터로 생성 성공 |
| Edge Cases | 경계값 | 빈 문자열, 최대 길이 |
| Error Cases | 예상 실패 | 존재하지 않는 ID, 중복 이메일 |

### 테스트 구조 (AAA 패턴)

```typescript
describe('AuthService', () => {
  describe('login', () => {
    // Happy path
    it('should return tokens when credentials valid', async () => {
      // Arrange
      const dto = { email: 'test@test.com', password: 'password' };
      mockUserStore.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.login(dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBeDefined();
    });

    // Error case
    it('should throw UnauthorizedException when user not found', async () => {
      mockUserStore.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### 모킹 패턴

```typescript
beforeEach(async () => {
  mockUserStore = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: UserStore, useValue: mockUserStore },
    ],
  }).compile();

  service = module.get<AuthService>(AuthService);
});

afterEach(() => {
  jest.clearAllMocks();
});
```

---

## 커밋 컨벤션

### 형식

```
<type>(<scope>): <subject>
```

### Type

| Type | 설명 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| test | 테스트 추가/수정 |
| refactor | 리팩토링 |
| docs | 문서 |
| chore | 빌드/설정 |

### 규칙

- 명령형 현재 시제 (add, fix, update)
- 첫 글자 소문자
- 마침표 없음
- 50자 이내

### 예시

```
feat(auth): add logout endpoint
fix(user): resolve null pointer exception
test(auth): add login service tests
```

---

## Quick Reference

### 테스트 케이스 필수 항목

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should ... when ... (Happy Path)', () => {});
    it('should throw ... when ... (Error Case)', () => {});
  });
});
```

### 커밋 메시지 템플릿

```
feat(scope): add new feature
fix(scope): fix bug description
test(scope): add tests for feature
```

### 체크리스트

- [ ] 파일 구조가 도메인별로 정리되었는가?
- [ ] 네이밍이 컨벤션을 따르는가? (kebab-case 파일, PascalCase 클래스)
- [ ] 테스트가 Happy/Edge/Error 케이스를 커버하는가?
- [ ] 커밋 메시지가 `type(scope): subject` 형식인가?
