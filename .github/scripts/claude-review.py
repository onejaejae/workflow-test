#!/usr/bin/env python3
"""
Claude API를 사용한 코드 리뷰 스크립트
"""

import os
import anthropic


def read_diff() -> str:
    """diff.txt 파일에서 PR diff를 읽어옴"""
    with open("diff.txt", "r", encoding="utf-8") as f:
        return f.read()


def review_code(diff: str, pr_title: str) -> str:
    """Claude API를 호출하여 코드 리뷰 수행"""
    client = anthropic.Anthropic()

    prompt = f"""당신은 시니어 소프트웨어 엔지니어입니다. 다음 Pull Request의 코드 변경사항을 리뷰해주세요.

## PR 제목
{pr_title}

## 코드 변경사항 (diff)
```diff
{diff}
```

## 리뷰 가이드라인
다음 관점에서 리뷰해주세요:
1. **코드 품질**: 가독성, 네이밍, 중복 코드
2. **버그 가능성**: 잠재적 버그, 엣지 케이스
3. **보안**: 보안 취약점, 입력 검증
4. **성능**: 성능 이슈, 불필요한 연산
5. **베스트 프랙티스**: 디자인 패턴, 코드 컨벤션

## 응답 형식
마크다운 형식으로 작성해주세요:
- 이모지를 사용하여 이슈 심각도 표시 (🔴 Critical, 🟡 Warning, 🟢 Suggestion)
- 구체적인 개선 방안 제시
- 잘된 부분도 언급

리뷰를 시작해주세요."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text


def write_review(review: str) -> None:
    """리뷰 결과를 review.md 파일로 저장"""
    output = f"""## 🤖 Claude Code Review

{review}

---
*이 리뷰는 Claude AI에 의해 자동 생성되었습니다.*
"""
    with open("review.md", "w", encoding="utf-8") as f:
        f.write(output)


def main():
    # 환경 변수 확인
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY is not set")
        exit(1)

    pr_title = os.getenv("PR_TITLE", "Untitled PR")

    # diff 읽기
    diff = read_diff()
    if not diff.strip():
        print("No diff found")
        with open("review.md", "w") as f:
            f.write("변경사항이 없습니다.")
        return

    # diff가 너무 크면 잘라내기 (토큰 제한)
    max_diff_length = 50000
    if len(diff) > max_diff_length:
        diff = diff[:max_diff_length] + "\n\n... (diff truncated due to size)"

    # 코드 리뷰 수행
    print("Reviewing code with Claude...")
    review = review_code(diff, pr_title)

    # 결과 저장
    write_review(review)
    print("Review completed and saved to review.md")


if __name__ == "__main__":
    main()
