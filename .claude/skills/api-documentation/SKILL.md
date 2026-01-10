---
name: api-documentation
description: API 문서화 시 Notion과 Postman에 명세를 추가합니다. 스크립트로 Deterministic 결과를 보장합니다. 키워드: 문서화, API 명세, Notion, Postman, Phase 5
---

# API Documentation

API 구현 후 Notion과 Postman에 문서화하는 스킬입니다.

---

## 빠른 시작

### Notion

```bash
./scripts/notion/add.sh \
  --name "API명" \
  --method POST \
  --endpoint "/api/v1/..." \
  --tag "Tag"
```

### Postman

```bash
./scripts/postman/add.sh \
  --name "API명" \
  --method POST \
  --endpoint "/api/v1/..."
```

---

## 상세 가이드

- Notion 옵션 및 시나리오: [notion-guide.md](notion-guide.md)
- Postman 옵션 및 예시: [postman-guide.md](postman-guide.md)

---

## 환경 설정

```bash
cd .claude/skills/api-documentation/scripts
cp env.sh.example env.sh
vi env.sh  # API 키 입력
```

---

## 완료 조건

Phase 5 완료 기준:
- [ ] Notion 스크립트 실행 성공
- [ ] Postman 스크립트 실행 성공
- [ ] docs 페이지 연결 확인
