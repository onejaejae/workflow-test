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

## Phase 0: Task 분석

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

### Docs 페이지 초안 생성

api-documentation skill (draft 모드)로 docs 페이지 초안을 생성합니다.

**중요:** 스크립트 실행 결과에서 다음 ID를 저장하세요:
- `task_id`: Task ID (예: DPT-10309) - **Phase 2 브랜치 생성 및 Phase 6 PR 생성 시 사용**
- `docs_page_id`: docs 페이지 ID - Phase 5에서 사용
- `api_row_id`: API Database row ID - Phase 5에서 사용

### 사용자 확인 요청

분석 결과와 docs 페이지 생성 결과를 보여준 후 다음을 출력하세요:

> **Phase 0 완료**
>
> 위 분석이 맞습니까? 수정이 필요하면 말씀해주세요.
> 계속 진행하려면 "진행"이라고 입력하세요.

사용자가 "진행"이라고 하면 Phase 1로 넘어가세요.

---

## Phase 1: Plan 수립

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

> **Phase 1 완료**
>
> 위 계획으로 진행할까요?
> 계속 진행하려면 "진행"이라고 입력하세요.

사용자가 "진행"이라고 하면 Phase 2로 넘어가세요.

---

## Phase 2: 브랜치 준비

### 수행 작업

develop 브랜치를 최신화하고 Phase 0에서 획득한 `task_id`를 사용하여 feature 브랜치를 생성합니다.

### 브랜치명 컨벤션

```
[task_id].[type]_[기능명]

타입: feat, fix, docs, refactor, test, chore 등 (커밋 타입과 동일)

예시:
- DPT-10296.feat_공지사항-수정API-첨부파일기능추가
- DPT-10297.fix_로그인-토큰-만료-버그수정
- DPT-10298.docs_API-문서-업데이트
```

### 명령어

```bash
# 1. develop 최신화
git checkout develop
git pull origin develop

# 2. feature 브랜치 생성 (task_id 사용)
git checkout -b [task_id].[type]_[기능명]
```

### 사용자 확인 요청

브랜치 생성 전 사용자에게 브랜치 타입을 확인하세요.

브랜치 생성 후 다음을 출력하세요:

> **Phase 2 완료**
>
> 브랜치가 준비되었습니다: `[task_id].[type]_[기능명]`
> 계속 진행하려면 "진행"이라고 입력하세요.

사용자가 "진행"이라고 하면 Phase 3으로 넘어가세요.

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
> 리뷰를 진행하려면 "진행"이라고 입력하세요.

---

## Phase 4: 리뷰 & PR

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

| Category   | Count |
| ---------- | ----- |
| Critical   | [N]   |
| Warning    | [N]   |
| Suggestion | [N]   |

## Issues

(Critical/Warning/Suggestion 이슈 목록)

## Verdict

**[APPROVED / CHANGES_REQUESTED]**
```

### 사용자 확인 요청

**APPROVED인 경우:**

> **Phase 4 완료 - 리뷰 통과!**
>
> 문서화를 진행하려면 "진행"이라고 입력하세요.
> PR을 바로 생성하려면 "PR"이라고 입력하세요.

**CHANGES_REQUESTED인 경우:**

> **수정 필요**
>
> Critical 이슈를 수정한 후 다시 리뷰를 진행하세요.

---

## Phase 5: 문서화

### 수행 작업

api-documentation skill (finalize 모드)로 구현된 API를 Notion과 Postman에 문서화합니다.

### 실행 절차

1. 구현된 코드 분석 (DTO, Service, Controller)
2. Phase 0에서 저장한 `docs_page_id`와 `api_row_id`로 finalize 모드 실행
3. Request Body, Response Schema 업데이트 + API row 상태 "구현완료"로 변경
4. Postman에 추가: `postman-guide.md` 참조

### 완료 조건

- [ ] Notion 스크립트 실행 성공 (docs 페이지 연결 확인)
- [ ] Postman 스크립트 실행 성공

### 결과 보고

```
📝 문서화 결과
- Notion: ✅ 성공 / ❌ 실패 (사유)
- Postman: ✅ 성공 / ❌ 실패 (사유)
```

### 사용자 확인 요청

**성공 시:**

> **Phase 5 완료**
>
> API 문서화가 완료되었습니다.
> PR을 생성하려면 "진행"이라고 입력하세요.

**실패 시:**

> **Phase 5 미완료**
>
> - 환경 설정 확인: `.claude/skills/api-documentation/scripts/env.sh`
> - 재시도하려면 "재시도"
> - 건너뛰려면 "스킵" (권장하지 않음)

---

## Phase 6: PR 생성

### 수행 작업

리뷰와 문서화가 완료된 후 PR을 생성합니다.

### 명령어

```bash
git push -u origin [브랜치명]
gh pr create --base develop --title "[제목]" --body "[본문]"
```

### PR 본문 템플릿

Phase 0에서 저장한 `task_id`를 티켓 링크에 포함합니다.

```markdown
# 🔗 티켓 링크
[Task ID]

## Summary
- [구현한 기능 한 줄 요약]

## Changes
- [주요 변경사항 1]
- [주요 변경사항 2]

## Test
- [x] 단위 테스트 작성 완료
- [x] 모든 테스트 통과

## Checklist
- [x] api-conventions 준수
- [x] code-standards 준수
- [x] 문서화 완료 (Notion/Postman)
```

### 사용자 확인 요청

> **Phase 6 완료 - PR 생성!**
>
> PR URL: [생성된 PR URL]

---

## 워크플로우 완료

모든 Phase 완료 후:

> **워크플로우 완료!**
>
> ### 요약
>
> - Task: [요약]
> - 커밋: [N]개
> - PR: [URL] (생성된 경우)
>
> ### 다음 단계
>
> - GitHub Actions 자동 코드 리뷰 대기
> - 리뷰어 피드백 반영
> - 머지

---

## 주의사항

- 각 Phase는 사용자 확인 후 다음으로 진행
- 문제 발생 시 언제든 "중단"하고 수동 진행 가능
- 참조 Skills: api-conventions, code-standards, api-documentation
- 참조 Agent: code-reviewer (Phase 4)
