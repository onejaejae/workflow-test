---
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: [task-description]
description: 전체 개발 워크플로우를 단계별로 진행합니다. 각 Phase마다 사용자 확인을 받습니다.
---

# 통합 개발 워크플로우

전체 개발 파이프라인을 Phase별로 진행합니다. 각 Phase 완료 후 사용자 확인을 받고 다음 단계로 진행합니다.

## 입력된 Task
$ARGUMENTS

---

## Phase 0: 브랜치 준비

### 수행 작업
작업 시작 전 develop 브랜치를 최신화하고 feature 브랜치를 생성합니다.

### 명령어
```bash
# 1. develop 최신화
git checkout develop
git pull origin develop

# 2. feature 브랜치 생성
git checkout -b feature/[기능명]
```

### 사용자 확인 요청
> **Phase 0 완료**
>
> 브랜치가 준비되었습니다: `feature/[기능명]`
> 계속 진행하려면 "진행"이라고 입력하세요.

사용자가 "진행"이라고 하면 Phase 1로 넘어가세요.

---

## Phase 1: Task 분석

### 수행 작업
입력된 Task를 분석하여 다음 항목을 도출하세요:

1. **요약**: 한 줄 요약
2. **목표**: 달성해야 할 결과물
3. **범위**: 포함/제외 사항
4. **기술적 요구사항**: 필요한 기술, 의존성
5. **수용 기준 (Acceptance Criteria)**: 완료 조건 목록

### 출력 형식
```markdown
## Task 분석 결과

### 요약
[한 줄 요약]

### 목표
[달성해야 할 결과물]

### 범위
- 포함: [...]
- 제외: [...]

### 기술적 요구사항
- [요구사항 1]
- [요구사항 2]

### 수용 기준
- [ ] [조건 1]
- [ ] [조건 2]
```

### 사용자 확인 요청
분석 결과를 보여준 후 다음을 출력하세요:

> **Phase 1 완료**
>
> 위 분석이 맞습니까? 수정이 필요하면 말씀해주세요.
> 계속 진행하려면 "진행"이라고 입력하세요.

사용자가 "진행"이라고 하면 Phase 2로 넘어가세요.

---

## Phase 2: Plan 수립

### 수행 작업
Task 분석을 바탕으로 구현 계획을 수립하세요:

1. 기존 코드 분석 (관련 파일 파악)
2. 구현 단계 분해 (각 Step = 1 커밋)
3. 테스트 계획

api-conventions, code-standards skill을 참조하여 설계하세요.

### 출력 형식
```markdown
## 구현 계획

### Step 1: [작업명]
- **파일**: [생성/수정할 파일 경로]
- **내용**: [구현 내용]
- **테스트**: [테스트 케이스]
- **커밋**: `feat: [메시지]`

### Step 2: [작업명]
...

### Step N: 테스트 및 마무리
...
```

### 사용자 확인 요청
> **Phase 2 완료**
>
> 위 계획으로 진행할까요?
> 계속 진행하려면 "진행"이라고 입력하세요.

---

## Phase 3: 개발

### 수행 작업
Plan의 각 Step을 순서대로 구현합니다.

각 Step마다:
1. **코드 구현** - api-conventions, code-standards skill 적용
2. **테스트 작성** - code-standards skill의 테스트 패턴 적용
3. **테스트 실행** - `npm test` (가능한 경우)
4. **커밋** - CLAUDE.md의 Commit Conventions 적용

### Step 진행 보고
각 Step 완료 후:
```
✅ Step [N]/[Total] 완료: [작업명]
- 구현: ✅
- 테스트: ✅
- 커밋: [해시 또는 메시지]

다음 Step을 진행할까요? (진행/중단)
```

### 모든 Step 완료 후
> **Phase 3 완료**
>
> 모든 구현이 완료되었습니다.
> 문서화 및 리뷰를 진행하려면 "진행"이라고 입력하세요.

---

## Phase 4: 문서화

### 수행 작업
api-documentation skill을 참조하여 API 명세를 Notion과 Postman에 추가합니다.

### 스크립트 실행
```bash
# Notion에 API 명세 추가 (API suffix 자동, docs 페이지 생성)
.claude/scripts/notion/add.sh \
  --name "API 이름" \
  --method POST \
  --endpoint "/api/v1/..." \
  --tag "Tag" \
  --create-docs \
  --docs-parent "부모페이지ID" \
  --docs-title "[RE-AI] API 이름 구현"

# CRUD API 공유 시 기존 docs 페이지 연결
.claude/scripts/notion/add.sh \
  --name "리소스 수정" \
  --method PATCH \
  --endpoint "/api/v1/resources/{id}" \
  --tag "Tag" \
  --docs-id "기존-docs-페이지-id"

# API suffix 비활성화 (필요 시)
.claude/scripts/notion/add.sh \
  --name "헬스체크" \
  --method GET \
  --endpoint "/health" \
  --tag "System" \
  --no-suffix

# Postman Collection에 추가 (with response examples)
.claude/scripts/postman/add.sh \
  --name "API 이름" \
  --method POST \
  --endpoint "/api/v1/..." \
  --body '{"field":"value"}' \
  --example '성공:201:{"success":true,"data":{...}}' \
  --example '에러:400:{"success":false,"error":{...}}'
```

### 실행 및 완료 확인
1. 구현된 API 정보를 바탕으로 스크립트 파라미터 구성
2. Notion 스크립트 실행 및 **성공 여부 확인**
3. Postman 스크립트 실행 및 **성공 여부 확인**
4. 모두 성공 시에만 Phase 4 완료 처리

### 실행 결과 보고
각 스크립트 실행 후 결과를 보고하세요:
```
📝 문서화 결과
- Notion: ✅ 성공 / ❌ 실패 (사유)
- Postman: ✅ 성공 / ❌ 실패 (사유)
```

### 완료 조건
- Notion, Postman **모두 성공**해야 Phase 4 완료
- 하나라도 실패 시 재시도 또는 문제 해결 후 재실행

### 사용자 확인 요청 (모두 성공 시)
> **Phase 4 완료**
>
> API 문서화가 완료되었습니다.
> 리뷰를 진행하려면 "진행"이라고 입력하세요.

### 실패 시
> **Phase 4 미완료**
>
> 문서화가 완료되지 않았습니다.
> - 환경 설정 확인: `.claude/scripts/env.sh`
> - 재시도하려면 "재시도"
> - 건너뛰려면 "스킵" (권장하지 않음)

---

## Phase 5: 리뷰 & PR

### 수행 작업
code-reviewer agent의 관점으로 전체 변경사항을 리뷰합니다.

1. 전체 변경사항 분석 (`git diff`)
2. 코드 품질, 보안, 성능 검토
3. 리뷰 리포트 출력

### 리뷰 체크리스트
- [ ] 코드 품질 (가독성, 네이밍, 중복)
- [ ] 보안 (입력 검증, 인증/인가)
- [ ] 성능 (N+1 쿼리, 불필요한 연산)
- [ ] 테스트 (커버리지, 엣지케이스)

### 출력 형식
```markdown
# Code Review Report

## Summary
| Category | Count |
|----------|-------|
| Critical | [N] |
| Warning | [N] |
| Suggestion | [N] |

## Issues
(Critical/Warning/Suggestion 이슈 목록)

## Verdict
**[APPROVED / CHANGES_REQUESTED]**
```

### 사용자 확인 요청

**APPROVED인 경우:**
> **리뷰 통과!**
>
> PR을 생성할까요? (예/아니오)

"예"라고 하면 PR 생성 절차 안내:
```bash
git push -u origin [브랜치명]
gh pr create --base develop --title "[제목]" --body "[본문]"
```

**CHANGES_REQUESTED인 경우:**
> **수정 필요**
>
> Critical 이슈를 수정한 후 다시 `/workflow`를 실행하세요.

---

## 워크플로우 완료

모든 Phase 완료 후:

> **워크플로우 완료!**
>
> ### 요약
> - Task: [요약]
> - 커밋: [N]개
> - PR: [URL] (생성된 경우)
>
> ### 다음 단계
> - GitHub Actions 자동 코드 리뷰 대기
> - 리뷰어 피드백 반영
> - 머지

---

## 주의사항
- 각 Phase는 사용자 확인 후 다음으로 진행
- 문제 발생 시 언제든 "중단"하고 수동 진행 가능
- 참조 Skills: api-conventions, code-standards, api-documentation
- 참조 Agent: code-reviewer (Phase 5)
