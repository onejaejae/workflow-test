# Notion 문서화 가이드

API 명세를 Notion Database에 추가하는 상세 가이드입니다.

---

## 스크립트 위치

```bash
.claude/skills/api-documentation/scripts/notion/add.sh
```

## 기본 사용법

```bash
./scripts/notion/add.sh \
  --name "API 이름" \
  --method POST \
  --endpoint "/api/v1/..." \
  --tag "Tag"
```

## 옵션 상세

### 필수 옵션

| 옵션 | 설명 |
|------|------|
| `--name` | API 이름 (자동으로 "API" suffix 추가) |
| `--method` | HTTP 메서드 (GET, POST, PUT, PATCH, DELETE) |
| `--endpoint` | API 경로 |
| `--tag` | 카테고리 |

### Docs 옵션

| 옵션 | 설명 |
|------|------|
| `--create-docs` | docs 페이지 자동 생성 |
| `--docs-id` | 기존 docs 페이지 연결 |
| `--docs-title` | docs 페이지 제목 (기본: [RE-AI] {name}) |

### 필수 콘텐츠 옵션 (문서 품질 보장)

| 옵션 | 설명 |
|------|------|
| `--request-body` | **필수** - Request Body JSON 또는 설명 (DTO에서 추출) |
| `--response` | **필수** - Response 예시 (반복 가능), 형식: `상태코드:JSON` |
| `--status` | 구현 상태 (기본: 구현완료) |
| `--no-suffix` | "API" suffix 비활성화 |

---

## 사용 시나리오

### 시나리오 1: 동적 Response Schema (권장)

실제 API 응답을 포함하여 문서화:

```bash
./scripts/notion/add.sh \
  --name "내 정보 조회" \
  --method GET \
  --endpoint "/api/v1/users/me" \
  --tag "User" \
  --create-docs \
  --request-body '없음 (GET 요청)' \
  --response '200:{"success":true,"data":{"id":"uuid","email":"user@example.com","createdAt":"2024-01-01T00:00:00.000Z"}}' \
  --response '401:{"success":false,"error":{"code":"AUTH_UNAUTHORIZED","message":"Unauthorized"}}'
```

### 시나리오 2: POST API with Request Body

```bash
./scripts/notion/add.sh \
  --name "회원가입" \
  --method POST \
  --endpoint "/api/v1/auth/signup" \
  --tag "Auth" \
  --create-docs \
  --request-body '{"email":"user@example.com","password":"password123"}' \
  --response '201:{"success":true,"data":{"id":"uuid","email":"user@example.com","createdAt":"2024-01-01T00:00:00.000Z"}}' \
  --response '400:{"success":false,"error":{"code":"VALIDATION_ERROR","message":"Invalid email format"}}' \
  --response '409:{"success":false,"error":{"code":"AUTH_EMAIL_ALREADY_EXISTS","message":"Email already exists"}}'
```

### 시나리오 3: CRUD API (기존 docs 페이지 공유)

```bash
# 첫 번째 API (docs 페이지 생성)
./scripts/notion/add.sh \
  --name "사용자 목록 조회" \
  --method GET \
  --endpoint "/api/v1/users" \
  --tag "User" \
  --create-docs \
  --docs-title "[RE-AI] 사용자 CRUD 구현"

# 나머지 API (기존 docs 페이지 연결)
./scripts/notion/add.sh \
  --name "사용자 상세 조회" \
  --method GET \
  --endpoint "/api/v1/users/:id" \
  --tag "User" \
  --docs-id "위에서-생성된-docs-page-id"
```

### 시나리오 4: API suffix 불필요 (헬스체크 등)

```bash
./scripts/notion/add.sh \
  --name "헬스체크" \
  --method GET \
  --endpoint "/health" \
  --tag "System" \
  --no-suffix
```

---

## 필수 옵션 안내

⚠️ `--request-body`와 `--response` 옵션은 **필수**입니다.

이 옵션들이 없으면 문서가 불완전하게 생성됩니다:
- Request Body: placeholder 텍스트만 표시
- Response Schema: placeholder 텍스트만 표시

### 정보 추출 방법

| 옵션 | 추출 위치 |
|------|----------|
| `--request-body` | 구현된 DTO 클래스에서 필드 구조 추출 |
| `--response` (성공) | Service의 Response 타입에서 추출 |
| `--response` (에러) | Controller/Service의 예외 처리에서 에러 코드 추출 |

---

## 워크플로우 통합

Phase 5 (문서화)에서 Claude가 자동으로:

1. 구현된 코드 분석 (Service의 Response 타입)
2. E2E 테스트에서 예시 응답 추출
3. `--request-body`, `--response` 옵션 동적 생성
4. 스크립트 실행

**예시:**
```bash
# Claude가 user.service.ts와 user.e2e-spec.ts를 분석하여 생성
./scripts/notion/add.sh \
  --name "내 정보 조회" \
  --method GET \
  --endpoint "/api/v1/users/me" \
  --tag "User" \
  --create-docs \
  --response '200:{"success":true,"data":{"id":"uuid","email":"user@example.com","createdAt":"..."}}' \
  --response '401:{"success":false,"error":{"code":"AUTH_UNAUTHORIZED","message":"..."}}'
```

---

## 환경 설정

```bash
cd .claude/skills/api-documentation/scripts
cp env.sh.example env.sh
vi env.sh
```

```bash
# env.sh
export NOTION_API_KEY="secret_xxxxx"
export NOTION_DATABASE_ID="database-id"
export NOTION_TASKS_DATABASE_ID="tasks-db-id"  # --create-docs 시 필수
export NOTION_EPIC_ID="epic-id"                # 선택
```

## Notion Integration 연결

1. https://www.notion.so/my-integrations 에서 Integration 생성
2. API Database 페이지에서 Integration 연결 (Share → Invite)
3. Database ID는 페이지 URL에서 추출

---

## Response 형식 규칙

`--response` 옵션 형식: `상태코드:JSON`

| 상태코드 | 표시 텍스트 |
|----------|------------|
| 200 | 200 성공 |
| 201 | 201 Created |
| 400 | 400 Bad Request |
| 401 | 401 Unauthorized |
| 403 | 403 Forbidden |
| 404 | 404 Not Found |
| 409 | 409 Conflict |
| 500 | 500 Internal Server Error |
