# Claude Code로 개발 워크플로우 자동화하기

> **POC 발표** | 발표자: 조원재 | 소요시간: 10-15분

---

## 1. 문제 인식 (1분)

### 기존 개발 프로세스의 반복 작업

```
API 하나 구현하려면...

1. Git 브랜치 생성
2. 코드 작성
3. 테스트 작성 & 실행
4. 커밋 (컨벤션 맞추기)
5. Notion에 API 명세 추가     ← 자주 까먹음
6. Postman에 Request 추가    ← 자주 까먹음
7. PR 생성
8. 코드 리뷰 요청
```

### Pain Points

| 문제 | 영향 |
|------|------|
| **반복 작업** | 매번 동일한 Git 명령어, PR 템플릿 작성 |
| **문서화 누락** | API 구현 후 Notion/Postman 업데이트 잊어버림 |
| **일관성 부족** | 개발자마다 커밋 메시지, 브랜치명 형식 다름 |

---

## 2. Claude Code 핵심 개념 (3분)

### 2.1 Claude Code란?

Anthropic에서 만든 **AI 기반 CLI 개발 도구**입니다.

```
터미널에서 자연어로 개발 작업을 수행하는 AI 페어 프로그래머

- 코드 작성, 수정, 리팩토링
- Git 작업 (브랜치, 커밋, PR)
- 커스텀 워크플로우 정의 가능 ← POC 핵심
```

### 2.2 확장 기능: Command vs Subagent vs Skill

> **핵심**: Claude Code는 3가지 확장 기능으로 커스터마이징 가능

#### 비교 테이블

| 구분 | Custom Command | Custom Subagent | Skill |
|------|----------------|-----------------|-------|
| **실행 방식** | 명시적 (`/workflow`) | 암시적 (자동 선택) | 암시적 (자동 활성화) |
| **실행 위치** | 메인 컨텍스트 | 별도 컨텍스트 | 메인 컨텍스트 |
| **컨텍스트 로딩** | 전체 로드 | 전체 로드 | 단계적 로드 |
| **결과** | Non-deterministic | Non-deterministic | Deterministic 가능 |
| **용도** | 워크플로우 정의 | 독립적 분석 작업 | 컨벤션, 규칙 주입 |

#### 레스토랑 비유로 이해하기

```
┌─────────────────────────────────────────────────────────────────┐
│                        레스토랑 비유                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Command = 레시피 카드                                          │
│  ─────────────────                                              │
│  "오늘의 스페셜 메뉴 만들어줘" → 레시피대로 요리                  │
│  명시적으로 호출, 메인 주방에서 실행                              │
│                                                                  │
│  Subagent = 외부 전문 셰프                                       │
│  ─────────────────────                                          │
│  "이 요리 품질 검수해줘" → 별도 주방에서 검토 후 결과만 전달       │
│  독립적 관점, 메인 주방 오염 없음                                 │
│                                                                  │
│  Skill = 매뉴얼 + 로봇 팔                                        │
│  ────────────────────                                           │
│  "계란 삶기" → 항상 같은 시간, 같은 온도                          │
│  자동 활성화, 일관된 결과 보장                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. POC: /workflow 자동화 (5분)

### 3.1 확장 기능 활용 구조

> **3가지 확장 기능을 모두 활용한 POC**

```
┌─────────────────────────────────────────────────────────────────┐
│                    /workflow 아키텍처                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Custom Command: /workflow                                       │
│  ─────────────────────────                                      │
│  → 6 Phase 파이프라인 정의                                       │
│  → 명시적 호출로 전체 워크플로우 시작                             │
│                                                                  │
│  Custom Subagent: code-reviewer                                  │
│  ───────────────────────────                                    │
│  → Phase 4에서 독립적 코드 리뷰                                  │
│  → 별도 컨텍스트에서 객관적 분석                                  │
│                                                                  │
│  Skills: api-conventions, code-standards, api-documentation      │
│  ──────────────────────────────────────────────────────────     │
│  → Phase 2-3: API 컨벤션, 코드/테스트 표준 자동 주입              │
│  → Phase 5: 문서화 스크립트 사용법 참조                           │
│                                                                  │
│  Scripts: notion/add.sh, postman/add.sh                          │
│  ───────────────────────────────────                            │
│  → Deterministic 문서화 (항상 같은 형식)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 각 개념의 활용과 선택 이유

| 개념 | 활용 방식 | 선택 이유 |
|------|----------|----------|
| **Custom Command** | `/workflow` - 6 Phase 파이프라인 | 명시적 호출 필요, 전체 워크플로우 정의에 적합 |
| **Custom Subagent** | `code-reviewer` - Phase 4 코드 리뷰 | 독립적 관점에서 분석, 메인 컨텍스트 오염 방지 |
| **CLAUDE.md** | 개발 컨벤션 주입 | 프로젝트 전역 규칙, 항상 참조되어야 함 |
| **Scripts** | Notion/Postman 자동화 | Deterministic 결과 필요 (항상 같은 형식으로 문서화) |

### 3.2 6 Phase 파이프라인

```
/workflow 로그아웃 API 구현
        │
        ├─ Phase 0: Task 분석 + Docs 페이지 초안 생성
        │     요약, 목표, 수용 기준 도출
        │     api-documentation skill (draft 모드)로 Notion docs 페이지 생성
        │     → task_id, docs_page_id, api_row_id 저장
        │
        ├─ Phase 1: Plan 수립
        │     Step 분해 (각 Step = 1 커밋)
        │
        ├─ Phase 2: 브랜치 준비
        │     git checkout -b [task_id].[type]_[기능명]
        │     예: DPT-10296.feat_로그아웃API
        │
        ├─ Phase 3: 개발
        │     코드 구현 + 테스트 + 커밋
        │
        ├─ Phase 4: 코드 리뷰 ← code-reviewer Subagent 활용
        │     독립적 관점에서 품질/보안/성능 검토
        │
        ├─ Phase 5: 문서화 ← Scripts 활용 (finalize 모드)
        │     Notion docs 페이지 업데이트 + API row 상태 변경
        │     Postman Request 자동 추가
        │
        └─ Phase 6: PR 생성
              gh pr create --base develop
              티켓 링크 (task_id) 포함
```

### 3.3 핵심 포인트: Skills & Subagent 활용

#### Phase 1, 3: Skills 활용 (api-conventions, code-standards)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Skills 자동 활성화                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  왜 Skills인가?                                                 │
│  ─────────────                                                  │
│  - 키워드 기반 자동 활성화 → 명시적 호출 불필요                   │
│  - Progressive Disclosure → 필요할 때만 상세 정보 로드           │
│  - 일관된 컨벤션 적용 → 개발자마다 다른 스타일 방지               │
│                                                                  │
│  작동 방식:                                                     │
│  ───────────                                                    │
│  1. Claude가 "API 구현", "엔드포인트" 키워드 감지                │
│     → api-conventions SKILL.md 자동 로드                        │
│  2. Claude가 "테스트 작성", "Service" 키워드 감지                │
│     → code-standards SKILL.md 자동 로드                         │
│  3. 필요 시 Level 3 참조 파일 추가 로드                          │
│                                                                  │
│  Phase 1 (Plan 수립) 적용:                                      │
│  ─────────────────────────                                      │
│  - URL 설계: /api/v1/{resource} 복수형 명사                     │
│  - HTTP 메서드: GET/POST/PATCH/DELETE 적절히 선택               │
│  - Response 형식: { success, data/error } 통일                  │
│                                                                  │
│  Phase 3 (개발) 적용:                                           │
│  ──────────────────                                             │
│  - 파일 구조: src/{domain}/ 도메인별 정리                       │
│  - 네이밍: kebab-case 파일, PascalCase 클래스                   │
│  - 테스트: Happy/Edge/Error 케이스 커버                         │
│  - 커밋: feat(scope): subject 형식                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Phase 4: Subagent 활용 (code-reviewer)

```
┌─────────────────────────────────────────────────────────────────┐
│                    code-reviewer Subagent                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  왜 Subagent인가?                                               │
│  ─────────────                                                  │
│  - 별도 컨텍스트에서 실행 → 객관적 리뷰 가능                      │
│  - 메인 대화 오염 없음 → 결과만 전달                              │
│  - 독립적 체크리스트 기반 분석                                   │
│                                                                  │
│  리뷰 체크리스트:                                                │
│  ✅ 코드 품질 (가독성, 네이밍, 중복)                             │
│  ✅ 보안 (입력 검증, 인증/인가)                                  │
│  ✅ 성능 (N+1 쿼리, 불필요한 연산)                               │
│  ✅ 테스트 (커버리지, 엣지케이스)                                │
│                                                                  │
│  결과: APPROVED / CHANGES_REQUESTED                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Phase 0, 5: api-documentation Skill + Scripts (Deterministic)

```
┌─────────────────────────────────────────────────────────────────┐
│                api-documentation Skill 구조                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Progressive Disclosure 적용:                                   │
│  ───────────────────────────                                    │
│  Level 2: SKILL.md (빠른 시작, 환경 설정)                        │
│  Level 3: notion-guide.md, postman-guide.md (상세 옵션)          │
│  Scripts: notion/add.sh, postman/add.sh (실행 파일)              │
│                                                                  │
│  작동 방식:                                                     │
│  ───────────                                                    │
│  Phase 0 (draft 모드):                                          │
│  - Task 분석 후 docs 페이지 초안 생성                            │
│  - task_id, docs_page_id, api_row_id 획득 및 저장                │
│                                                                  │
│  Phase 5 (finalize 모드):                                       │
│  - 구현 완료 후 docs 페이지 업데이트                             │
│  - API row 상태: "구현예정" → "구현완료" 변경                    │
│  - Postman에 Request 추가                                       │
│                                                                  │
│  왜 Scripts인가?                                                │
│  ─────────────                                                  │
│  - AI가 직접 API 호출 → Non-deterministic (형식 달라질 수 있음)  │
│  - Scripts 실행 → Deterministic (정해진 파라미터대로 실행)       │
│  - 결과: 항상 일관된 형식으로 문서화                             │
│                                                                  │
│  예시:                                                          │
│  ──────                                                         │
│  # Phase 0: Draft 모드                                          │
│  ./scripts/notion/add.sh --mode draft \                         │
│    --name "로그아웃" --method POST \                            │
│    --endpoint "/api/v1/auth/logout" --tag Auth \                │
│    --create-docs --background "..." --requirements "..."        │
│                                                                  │
│  # Phase 5: Finalize 모드                                       │
│  ./scripts/notion/add.sh --mode finalize \                      │
│    --docs-id "..." --api-row-id "..." \                         │
│    --request-body '{...}' --response '200:{...}'                │
│                                                                  │
│  ./scripts/postman/add.sh --name "로그아웃 API" --method POST \ │
│    --endpoint "/api/v1/auth/logout" \                           │
│    --example "성공:200:{...}"                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 프로젝트 구조

```
.claude/
├── commands/
│   └── workflow/
│       └── workflow.md           # Custom Command: 6 Phase 정의
├── agents/
│   └── code-reviewer/
│       └── AGENT.md              # Custom Subagent: 코드 리뷰
├── skills/
│   ├── api-conventions/
│   │   └── SKILL.md              # API 컨벤션 (Phase 2-3)
│   ├── code-standards/
│   │   └── SKILL.md              # 코드/테스트 표준 (Phase 2-3)
│   └── api-documentation/        # 문서화 스킬 (Phase 5)
│       ├── SKILL.md              # 핵심 가이드 (Level 2)
│       ├── notion-guide.md       # Notion 상세 (Level 3)
│       ├── postman-guide.md      # Postman 상세 (Level 3)
│       └── scripts/              # Deterministic 스크립트
│           ├── env.sh            # API 키 (gitignore)
│           ├── notion/add.sh     # Notion 자동화
│           └── postman/add.sh    # Postman 자동화
└── settings.local.json           # Claude Code 권한
```

---

## 4. 결과 & 다음 단계 (3분)

### 4.1 POC 결과 요약

| 항목 | 결과 |
|------|------|
| **구현 범위** | JWT 기반 로그아웃 API |
| **생성 파일** | 7개 (Store, Strategy, Guard, Decorator, Controller, Service, Tests) |
| **커밋** | 3개 (Conventional Commits 자동 적용) |
| **테스트** | 23개 전체 통과 |
| **문서화** | Notion ✅, Postman ✅ 자동 추가 |

### 4.2 장점

| 장점 | 설명 |
|------|------|
| **A-Z 자동화** | 브랜치 생성 → PR까지 단일 명령 |
| **문서화 강제** | API 구현 시 Notion/Postman 자동 추가 → 누락 방지 |
| **일관성 보장** | 커밋 메시지, 브랜치명, API 형식 컨벤션 자동 적용 |
| **투명한 진행** | Phase별 확인 → 원하지 않는 변경 방지 |

### 4.3 한계

| 한계 | 극복 방안 |
|------|----------|
| Claude Code 사용 필요 | 점진적 도입, 선택적 사용 |
| 초기 설정 비용 | 온보딩 가이드 제공 |
| Notion Linked DB 미지원 | 원본 Database ID 사용 |

### 4.4 팀 활용 방안 제안

**즉시 적용 가능:**
- 커밋 컨벤션 자동화 (CLAUDE.md)
- API 문서화 자동화 (Scripts)

**확장 가능:**
- Jira 티켓 연동
- Slack 알림
- 팀 공용 워크플로우 라이브러리

---

## 5. 데모 (발표 시)

```bash
$ claude
> /workflow 로그아웃 API 구현

Phase 0 완료
브랜치가 준비되었습니다: feature/auth-logout
계속 진행하려면 "진행"이라고 입력하세요.

> 진행
...
```

---

## 부록: 환경 설정

### 필요 도구

```bash
# Claude Code 설치
npm install -g @anthropic-ai/claude-code

# GitHub CLI
brew install gh && gh auth login

# jq (JSON 파싱)
brew install jq
```

### API 키 설정

```bash
cd .claude/skills/api-documentation/scripts
cp env.sh.example env.sh
# env.sh에 Notion/Postman API 키 입력
```

---

> **핵심 메시지**
>
> Claude Code의 확장 기능(Command, Subagent, Skill)을 활용하면
> 반복적인 개발 작업을 자동화할 수 있습니다.
> 실제로 만들어봤습니다.
