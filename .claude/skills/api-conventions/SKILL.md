---
name: api-conventions
description: >
  RESTful API 설계 컨벤션. URL 설계, HTTP 메서드, 상태 코드, Response 형식, 에러 코드를 정의합니다.
  Use when designing API endpoints, implementing controllers, or reviewing API implementations.
---

# API Conventions

API 설계 시 참조하는 컨벤션입니다.

---

## URL 설계

```
/api/v1/{resource}        # 복수형 명사
/api/v1/{resource}/{id}   # 단일 리소스
```

## HTTP 메서드

| 메서드 | 용도 | 상태코드 |
|--------|------|----------|
| GET | 조회 | 200 |
| POST | 생성 | 201 |
| PATCH | 수정 | 200 |
| DELETE | 삭제 | 200 또는 204 |

## HTTP 상태 코드

| 코드 | 의미 |
|------|------|
| 200 | OK (조회/수정 성공) |
| 201 | Created (생성 성공) |
| 400 | Bad Request (유효성 검사 실패) |
| 401 | Unauthorized (인증 필요) |
| 403 | Forbidden (권한 없음) |
| 404 | Not Found (리소스 없음) |
| 409 | Conflict (중복) |
| 500 | Internal Server Error |

---

## Response 형식

### 성공

```json
{
  "success": true,
  "data": { ... }
}
```

### 에러

```json
{
  "success": false,
  "error": {
    "code": "DOMAIN_ERROR_TYPE",
    "message": "사용자에게 보여줄 메시지"
  }
}
```

## 에러 코드 형식

`{DOMAIN}_{ERROR_TYPE}`

예시:
- `AUTH_INVALID_CREDENTIALS` - 인증 실패
- `AUTH_TOKEN_EXPIRED` - 토큰 만료
- `USER_NOT_FOUND` - 사용자 없음
- `USER_ALREADY_EXISTS` - 이미 존재

---

## NestJS 구현 패턴

### Controller

```typescript
@Controller('auth')
export class AuthController {
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto): Promise<SignupResponse> {
    return this.authService.signup(dto);
  }
}
```

### Service Response

```typescript
// 성공
return { success: true, data: { id: user.id } };

// 에러
throw new UnauthorizedException({
  success: false,
  error: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
  },
});
```

### DTO (class-validator)

```typescript
export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

---

## Quick Reference

### Response 템플릿

```typescript
// 성공
{ success: true, data: { ... } }

// 에러
{ success: false, error: { code: "DOMAIN_ERROR", message: "..." } }
```

### 체크리스트

- [ ] URL이 복수형 명사인가? (`/users`, `/posts`)
- [ ] HTTP 메서드가 적절한가? (GET/POST/PATCH/DELETE)
- [ ] 상태 코드가 올바른가? (200/201/400/401/404)
- [ ] Response 형식이 `{ success, data/error }` 인가?
- [ ] 에러 코드가 `DOMAIN_ERROR_TYPE` 형식인가?
