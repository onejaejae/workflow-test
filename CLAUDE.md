# Project Workflow Template

## Overview
Claude Code를 활용한 A-Z 개발 워크플로우 자동화 템플릿입니다.

## Workflow Commands

| Command | Description |
|---------|-------------|
| `/workflow [task]` | 통합 개발 파이프라인 (분석 → 계획 → 개발 → 문서화 → 리뷰) |

## Development Conventions

### API Conventions
- RESTful API 설계 원칙 준수
- Response 형식: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- HTTP 상태 코드 준수 (200, 201, 400, 401, 403, 404, 500)
- 에러 코드 형식: `{DOMAIN}_{ERROR_TYPE}` (예: `USER_NOT_FOUND`)

### Commit Conventions (Conventional Commits)

**형식**: `<type>(<scope>): <subject>`

| Type | Description |
|------|-------------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 코드 스타일 (포맷팅) |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정 변경 |

**규칙**:
- 명령형 현재 시제 (add, fix, update)
- 첫 글자 소문자, 마침표 없음
- 50자 이내

**예시**:
```
feat(auth): add JWT refresh token
fix(user): resolve profile update bug
docs(api): update swagger documentation
```

### Branch Strategy

**기본 브랜치**:
- `main` - 프로덕션 브랜치 (배포용)
- `develop` - 개발 브랜치 (기능 통합)

**개발 플로우**:
1. develop 브랜치 최신화
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. feature 브랜치 생성
   ```bash
   git checkout -b feature/기능명
   ```
3. 작업 완료 후 develop으로 PR 생성
   ```bash
   git push -u origin feature/기능명
   gh pr create --base develop
   ```

**브랜치 접두사**:
- `feature/` - 새 기능
- `fix/` - 버그 수정
- `docs/` - 문서 작업
- `refactor/` - 리팩토링

### Testing
- 단위 테스트 필수
- 테스트 커버리지 목표: 80%
- 테스트 케이스: Happy path + Edge cases + Error cases

## Project Structure
```
.claude/
├── commands/           # Slash commands
├── agents/             # Subagents (code-reviewer)
├── skills/             # Skills (api-conventions, code-standards, api-documentation)
├── scripts/            # API 문서화 스크립트 (Notion, Postman)
└── settings.json       # Hooks & permissions

.github/workflows/      # GitHub Actions
docs/                   # Project documentation
```

## Code Review Process

### 1. PR 전 자체 리뷰 (Local)
- `/workflow` 실행 시 Phase 5에서 code-reviewer가 자동 리뷰
- Critical 이슈 없을 때까지 수정 후 재리뷰

### 2. PR 후 자동 리뷰 (CI)
- GitHub Action이 자동으로 코드 리뷰
- 인라인 코멘트로 피드백 제공

## Documentation Settings

### Notion API 명세
| 설정 | 값 |
|------|-----|
| Database ID | `2c7d87e517f480d88516e88afd3c2875` |
| Integration | `dp-api` |
| API Key | 환경변수 `NOTION_API_KEY` 사용 |

**스키마:**
- 설명 (title) - API 이름 (자동으로 "API" suffix 추가)
- Method (multi_select) - HTTP 메서드
- Endpoint (rich_text) - API 경로
- Tag (multi_select) - 카테고리
- 구현 여부 (rich_text) - 상태
- docs (rich_text) - 문서 페이지 (page mention)

### Postman Collection
| 설정 | 값 |
|------|-----|
| Collection ID | `410bece5-689a-4fa5-babc-aa39887a59a8` |
| Collection Name | `enzo-test` |
| API Key | 환경변수 `POSTMAN_API_KEY` 사용 |

### 스크립트 사용
```bash
# 설정
cd .claude/scripts && cp env.sh.example env.sh && vi env.sh

# Notion에 추가 (API suffix 자동 추가, 태스크 페이지 생성)
./notion/add.sh --name "회원가입" --method POST --endpoint "/api/v1/auth/signup" --tag Auth \
  --create-docs --docs-title "[RE-AI] 회원가입 API 구현"

# 기존 docs 페이지 연결 (CRUD API 공유 시)
./notion/add.sh --name "연구지원 수정" --method PATCH --endpoint "/api/researches/{id}" --tag Research \
  --docs-id "기존-docs-페이지-id"

# API suffix 비활성화 (헬스체크 등 "API" 접미사가 불필요한 경우)
./notion/add.sh --name "헬스체크" --method GET --endpoint "/health" --tag System --no-suffix

# Postman에 추가 (with response examples)
./postman/add.sh --name "API명" --method POST --endpoint "/api/v1/..." \
  --body '{"field":"value"}' \
  --example "성공:201:{\"success\":true,\"data\":{...}}" \
  --example "에러:400:{\"success\":false,\"error\":{...}}"
```

## Important Notes
- 민감 정보 (.env, credentials) 커밋 금지
- force push 금지
