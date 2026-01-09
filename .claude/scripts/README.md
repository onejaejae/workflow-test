# API 문서화 스크립트

개발된 API를 Notion과 Postman에 자동으로 등록하는 스크립트입니다.

## 설정

### 1. 환경 변수 설정

```bash
cd .claude/scripts
cp env.sh.example env.sh
# env.sh 파일에 실제 API 키 입력
```

### 2. 필요한 값

| 환경변수 | 설명 | 획득 방법 |
|---------|------|----------|
| `NOTION_API_KEY` | Notion Integration API 키 | [Notion Integrations](https://www.notion.so/my-integrations) |
| `NOTION_DATABASE_ID` | API 명세 데이터베이스 ID | 데이터베이스 URL에서 추출 |
| `POSTMAN_API_KEY` | Postman API 키 | [Postman Settings](https://go.postman.co/settings/me/api-keys) |
| `POSTMAN_COLLECTION_ID` | Collection ID | Collection URL에서 추출 |

## 사용법

### Notion에 API 명세 추가

```bash
# 기본 사용 (API suffix 자동 추가)
./notion/add.sh \
  --name "회원가입" \
  --method POST \
  --endpoint "/api/v1/auth/signup" \
  --tag Auth
# 결과: 설명="회원가입 API"

# docs 페이지 자동 생성
./notion/add.sh \
  --name "회원가입" \
  --method POST \
  --endpoint "/api/v1/auth/signup" \
  --tag Auth \
  --create-docs \
  --docs-parent "부모페이지ID" \
  --docs-title "[RE-AI] 회원가입 API 구현"

# 기존 docs 페이지 연결 (CRUD API 공유 시)
./notion/add.sh \
  --name "연구지원 수정" \
  --method PATCH \
  --endpoint "/api/researches/{id}" \
  --tag Research \
  --docs-id "2dfd87e5-17f4-8021-9e23-cc6b0ed72c1c"
```

**옵션:**
| 옵션 | 필수 | 설명 |
|------|-----|------|
| `--name` | ✅ | API 이름/설명 (자동으로 'API' suffix 추가) |
| `--method` | ✅ | HTTP 메서드 (GET, POST, PUT, PATCH, DELETE) |
| `--endpoint` | ✅ | API 경로 (/api/v1/...) |
| `--tag` | ✅ | 태그/카테고리 |
| `--status` | ❌ | 구현 상태 (기본값: 구현완료) |
| `--no-suffix` | ❌ | 'API' suffix 자동 추가 비활성화 |
| `--create-docs` | ❌ | docs 페이지 자동 생성 및 연결 (--docs-parent 필수) |
| `--docs-parent` | ❌ | docs 페이지의 부모 페이지 ID (--create-docs 시 필수) |
| `--docs-id` | ❌ | 기존 docs 페이지 ID로 연결 (page mention) |
| `--docs-title` | ❌ | docs 페이지 제목 (기본값: [RE-AI] {name}) |

### Postman Collection에 API 추가

```bash
./postman/add.sh \
  --name "사용자 생성 API" \
  --method POST \
  --endpoint "/api/v1/users" \
  --body '{"email":"user@example.com","password":"password123"}' \
  --example '성공:201:{"success":true,"data":{"id":"...","email":"..."}}' \
  --example '중복:409:{"success":false,"error":{"code":"...","message":"..."}}'
```

**옵션:**
| 옵션 | 필수 | 설명 |
|------|-----|------|
| `--name` | ✅ | API 이름/설명 |
| `--method` | ✅ | HTTP 메서드 |
| `--endpoint` | ✅ | API 경로 |
| `--body` | ❌ | Request Body JSON |
| `--example` | ❌ | Response Example (반복 가능, 형식: "이름:상태코드:JSON") |

### 한 번에 둘 다 추가

```bash
# Notion + Postman 동시 등록 예시 (docs 페이지 자동 생성 포함)
./notion/add.sh --name "회원가입" --method POST --endpoint "/api/v1/auth/signup" --tag Auth \
  --create-docs && \
./postman/add.sh --name "회원가입 API" --method POST --endpoint "/api/v1/auth/signup" \
  --body '{"email":"...","password":"..."}' \
  --example '성공:201:{"success":true,"data":{...}}'
```

## 파일 구조

```
.claude/scripts/
├── env.sh.example    # 환경변수 템플릿
├── env.sh            # 실제 환경변수 (gitignore)
├── README.md         # 이 문서
├── notion/
│   └── add.sh        # Notion API 명세 추가
└── postman/
    └── add.sh        # Postman Collection 추가
```

## 주의사항

1. **env.sh는 절대 커밋하지 마세요** - API 키가 포함되어 있습니다.
2. Notion Integration은 반드시 해당 데이터베이스에 연결되어 있어야 합니다.
3. 스크립트 실행 전 `jq`가 설치되어 있어야 합니다: `brew install jq`
