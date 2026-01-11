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

| 옵션 | 필수 | 설명 |
|------|------|------|
| `--name` | O | API 이름 (자동으로 "API" suffix 추가) |
| `--method` | O | HTTP 메서드 |
| `--endpoint` | O | API 경로 |
| `--tag` | O | 카테고리 |
| `--status` | X | 구현 상태 (기본: 구현완료) |
| `--no-suffix` | X | "API" suffix 비활성화 |
| `--create-docs` | X | docs 페이지 자동 생성 |
| `--docs-id` | X | 기존 docs 페이지 연결 |
| `--docs-title` | X | docs 페이지 제목 |

---

## 사용 시나리오

### 시나리오 1: 새 기능 구현 (docs 페이지 생성)

```bash
./scripts/notion/add.sh \
  --name "로그아웃" \
  --method POST \
  --endpoint "/api/v1/auth/logout" \
  --tag "Auth" \
  --create-docs \
  --docs-title "[RE-AI] 로그아웃 API 구현"
```

### 시나리오 2: CRUD API (기존 docs 페이지 공유)

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

### 시나리오 3: API suffix 불필요 (헬스체크 등)

```bash
./scripts/notion/add.sh \
  --name "헬스체크" \
  --method GET \
  --endpoint "/health" \
  --tag "System" \
  --no-suffix
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
export NOTION_TASKS_DATABASE_ID="tasks-db-id"  # 선택
```

## Notion Integration 연결

1. https://www.notion.so/my-integrations 에서 Integration 생성
2. API Database 페이지에서 Integration 연결 (Share → Invite)
3. Database ID는 페이지 URL에서 추출
