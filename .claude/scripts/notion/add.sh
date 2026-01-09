#!/bin/bash
#
# Notion API 명세 추가 스크립트
# Usage: ./add.sh --name "API 이름" --method "POST" --endpoint "/api/v1/users" --tag "Users"
#
# Features:
#   - 자동으로 "API" suffix 추가 (--no-suffix로 비활성화)
#   - docs 페이지 생성 및 연결 (--create-docs 또는 --docs-id)
#

set -e

# 스크립트 디렉토리
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../env.sh" 2>/dev/null || true

# 기본값
DATABASE_ID="${NOTION_DATABASE_ID:-2c7d87e517f480d88516e88afd3c2875}"
TASKS_DATABASE_ID="${NOTION_TASKS_DATABASE_ID:-a04b41f4f46e49d285cf04ce952db946}"
EPIC_ID="${NOTION_EPIC_ID:-}"
NOTION_API_KEY="${NOTION_API_KEY:-}"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 도움말
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Notion 데이터베이스에 API 명세를 추가합니다."
    echo ""
    echo "Options:"
    echo "  --name        API 이름/설명 (필수, 자동으로 'API' suffix 추가)"
    echo "  --method      HTTP 메서드: GET, POST, PUT, PATCH, DELETE (필수)"
    echo "  --endpoint    API 엔드포인트 경로 (필수)"
    echo "  --tag         태그/카테고리 (필수)"
    echo "  --status      구현 여부 (기본값: 구현완료)"
    echo "  --no-suffix   'API' suffix 자동 추가 비활성화"
    echo ""
    echo "Docs Options:"
    echo "  --create-docs   태스크 Database에 docs 페이지 생성 및 연결"
    echo "  --docs-id       기존 docs 페이지 ID로 연결 (page mention)"
    echo "  --docs-title    docs 페이지 제목 (기본값: [RE-AI] {name})"
    echo "  --help          도움말 표시"
    echo ""
    echo "Environment Variables:"
    echo "  NOTION_TASKS_DATABASE_ID  태스크 Database ID (--create-docs 시 필수)"
    echo "  NOTION_EPIC_ID            연결할 에픽 ID (선택)"
    echo ""
    echo "Examples:"
    echo "  # 기본 사용 (API suffix 자동 추가)"
    echo "  $0 --name \"회원가입\" --method POST --endpoint \"/api/v1/auth/signup\" --tag Auth"
    echo ""
    echo "  # 태스크 페이지 자동 생성 및 연결"
    echo "  $0 --name \"회원가입\" --method POST --endpoint \"/api/v1/auth/signup\" --tag Auth \\"
    echo "     --create-docs --docs-title \"[RE-AI] 회원가입 API 구현\""
    echo ""
    echo "  # 기존 docs 페이지 연결 (CRUD API 공유 시)"
    echo "  $0 --name \"연구지원 수정\" --method PATCH --endpoint \"/api/researches/{id}\" --tag Research \\"
    echo "     --docs-id \"2dfd87e5-17f4-8021-9e23-cc6b0ed72c1c\""
}

# 인자 파싱
NAME=""
METHOD=""
ENDPOINT=""
TAG=""
STATUS="구현완료"
NO_SUFFIX=false
CREATE_DOCS=false
DOCS_ID=""
DOCS_TITLE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --name)
            NAME="$2"
            shift 2
            ;;
        --method)
            METHOD="$2"
            shift 2
            ;;
        --endpoint)
            ENDPOINT="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --status)
            STATUS="$2"
            shift 2
            ;;
        --no-suffix)
            NO_SUFFIX=true
            shift
            ;;
        --create-docs)
            CREATE_DOCS=true
            shift
            ;;
        --docs-id)
            DOCS_ID="$2"
            shift 2
            ;;
        --docs-title)
            DOCS_TITLE="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# API suffix 자동 추가
if [[ "$NO_SUFFIX" != true && ! "$NAME" =~ API$ ]]; then
    NAME="${NAME} API"
fi

# docs 제목 기본값
if [[ -z "$DOCS_TITLE" ]]; then
    DOCS_TITLE="[RE-AI] ${NAME}"
fi

# --create-docs 시 TASKS_DATABASE_ID 확인
if [[ "$CREATE_DOCS" == true && -z "$TASKS_DATABASE_ID" ]]; then
    echo -e "${RED}Error: NOTION_TASKS_DATABASE_ID가 설정되지 않았습니다.${NC}"
    echo "env.sh 파일에 NOTION_TASKS_DATABASE_ID를 설정하세요."
    exit 1
fi

# 필수 인자 확인
if [[ -z "$NAME" || -z "$METHOD" || -z "$ENDPOINT" || -z "$TAG" ]]; then
    echo -e "${RED}Error: --name, --method, --endpoint, --tag는 필수입니다.${NC}"
    show_help
    exit 1
fi

# API Key 확인
if [[ -z "$NOTION_API_KEY" ]]; then
    echo -e "${RED}Error: NOTION_API_KEY가 설정되지 않았습니다.${NC}"
    echo "env.sh 파일을 생성하거나 환경변수를 설정하세요."
    exit 1
fi

# docs 페이지 생성 함수 (태스크 Database에 row 추가)
create_docs_page() {
    local title="$1"
    local name="$2"
    local method="$3"
    local endpoint="$4"
    local tasks_db_id="$5"

    echo -e "${YELLOW}태스크 Database에 docs 페이지 생성 중: ${title}${NC}" >&2

    # 에픽 relation 설정
    local epic_relation=""
    if [[ -n "$EPIC_ID" ]]; then
        epic_relation='"에픽": {"relation": [{"id": "'"${EPIC_ID}"'"}]},'
    fi

    # 태스크 row 생성 payload
    local task_payload=$(cat <<TASKEOF
{
  "parent": {
    "database_id": "${tasks_db_id}"
  },
  "properties": {
    "": {
      "title": [
        {
          "text": {
            "content": "${title}"
          }
        }
      ]
    },
    "상태": {
      "status": {
        "name": "TODO"
      }
    },
    "작업 분야": {
      "select": {
        "name": "Backend"
      }
    },
    "작업 유형": {
      "multi_select": [
        {"name": "신규 기능"}
      ]
    },
    ${epic_relation}
    "DoD": {
      "rich_text": [
        {
          "text": {
            "content": "${name} 구현 완료"
          }
        }
      ]
    }
  }
}
TASKEOF
)

    # 태스크 row 생성
    local task_response=$(curl -s -X POST "https://api.notion.com/v1/pages" \
      -H "Authorization: Bearer ${NOTION_API_KEY}" \
      -H "Notion-Version: 2022-06-28" \
      -H "Content-Type: application/json" \
      -d "${task_payload}")

    local task_id=$(echo "$task_response" | jq -r '.id // empty')

    if [[ -z "$task_id" ]]; then
        echo -e "${RED}❌ 태스크 생성 실패${NC}" >&2
        echo "$task_response" | jq . >&2
        return 1
    fi

    # 태스크 페이지에 API Spec 템플릿 블록 추가
    local blocks_payload=$(cat <<BLOCKSEOF
{
  "children": [
    {
      "type": "heading_2",
      "heading_2": {
        "rich_text": [{"type": "text", "text": {"content": "배경"}}]
      }
    },
    {
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{"type": "text", "text": {"content": "${name}의 구현 배경을 작성하세요."}}]
      }
    },
    {
      "type": "heading_2",
      "heading_2": {
        "rich_text": [{"type": "text", "text": {"content": "작업내용"}}]
      }
    },
    {
      "type": "numbered_list_item",
      "numbered_list_item": {
        "rich_text": [{"type": "text", "text": {"content": "작업 항목을 추가하세요"}}]
      }
    },
    {
      "type": "heading_2",
      "heading_2": {
        "rich_text": [{"type": "text", "text": {"content": "API Spec"}}]
      }
    },
    {
      "type": "heading_3",
      "heading_3": {
        "rich_text": [{"type": "text", "text": {"content": "[${method}] ${endpoint}"}}]
      }
    },
    {
      "type": "bulleted_list_item",
      "bulleted_list_item": {
        "rich_text": [{"type": "text", "text": {"content": "인증: Bearer Token"}}]
      }
    },
    {
      "type": "bulleted_list_item",
      "bulleted_list_item": {
        "rich_text": [{"type": "text", "text": {"content": "Content-Type: application/json"}}]
      }
    },
    {
      "type": "heading_3",
      "heading_3": {
        "rich_text": [{"type": "text", "text": {"content": "요청예시"}}]
      }
    },
    {
      "type": "code",
      "code": {
        "rich_text": [{"type": "text", "text": {"content": "curl -X '${method}' 'http://localhost:8000${endpoint}' \\\\\n  -H 'Authorization: Bearer {jwt_token}' \\\\\n  -H 'Content-Type: application/json'"}}],
        "language": "bash"
      }
    },
    {
      "type": "heading_3",
      "heading_3": {
        "rich_text": [{"type": "text", "text": {"content": "응답 형식"}}]
      }
    },
    {
      "type": "code",
      "code": {
        "rich_text": [{"type": "text", "text": {"content": "{\n  \"success\": true,\n  \"data\": {}\n}"}}],
        "language": "json"
      }
    }
  ]
}
BLOCKSEOF
)

    # 블록 추가
    curl -s -X PATCH "https://api.notion.com/v1/blocks/${task_id}/children" \
      -H "Authorization: Bearer ${NOTION_API_KEY}" \
      -H "Notion-Version: 2022-06-28" \
      -H "Content-Type: application/json" \
      -d "${blocks_payload}" > /dev/null

    echo "$task_id"
}

# docs 페이지 ID 결정
DOCS_PAGE_ID=""
if [[ "$CREATE_DOCS" == true ]]; then
    DOCS_PAGE_ID=$(create_docs_page "$DOCS_TITLE" "$NAME" "$METHOD" "$ENDPOINT" "$TASKS_DATABASE_ID")
    if [[ -z "$DOCS_PAGE_ID" ]]; then
        exit 1
    fi
    echo -e "${GREEN}✅ 태스크 페이지 생성 완료: ${DOCS_PAGE_ID}${NC}"
elif [[ -n "$DOCS_ID" ]]; then
    DOCS_PAGE_ID="$DOCS_ID"
fi

# Notion API 호출
echo -e "${YELLOW}Notion에 API 명세 추가 중...${NC}"

# docs 속성 생성 (page mention 또는 빈 값)
if [[ -n "$DOCS_PAGE_ID" ]]; then
    DOCS_PROPERTY=$(cat <<DOCSEOF
"docs": {
      "rich_text": [
        {
          "type": "mention",
          "mention": {
            "type": "page",
            "page": {
              "id": "${DOCS_PAGE_ID}"
            }
          }
        }
      ]
    }
DOCSEOF
)
else
    DOCS_PROPERTY=$(cat <<DOCSEOF
"docs": {
      "rich_text": []
    }
DOCSEOF
)
fi

PAYLOAD=$(cat <<EOF
{
  "parent": {
    "database_id": "${DATABASE_ID}"
  },
  "properties": {
    "설명": {
      "title": [
        {
          "text": {
            "content": "${NAME}"
          }
        }
      ]
    },
    "Method": {
      "multi_select": [
        {
          "name": "${METHOD}"
        }
      ]
    },
    "Endpoint": {
      "rich_text": [
        {
          "text": {
            "content": "${ENDPOINT}"
          }
        }
      ]
    },
    "Tag": {
      "multi_select": [
        {
          "name": "${TAG}"
        }
      ]
    },
    "구현 여부": {
      "rich_text": [
        {
          "text": {
            "content": "${STATUS}"
          }
        }
      ]
    },
    ${DOCS_PROPERTY}
  }
}
EOF
)

RESPONSE=$(curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer ${NOTION_API_KEY}" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

# 결과 확인
if echo "$RESPONSE" | grep -q '"object":"page"'; then
    PAGE_ID=$(echo "$RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✅ Notion에 API 명세가 추가되었습니다!${NC}"
    echo ""
    echo "  이름: ${NAME}"
    echo "  Method: ${METHOD}"
    echo "  Endpoint: ${ENDPOINT}"
    echo "  Tag: ${TAG}"
    echo "  Page ID: ${PAGE_ID}"
    if [[ -n "$DOCS_PAGE_ID" ]]; then
        echo "  Docs Page ID: ${DOCS_PAGE_ID}"
    fi
else
    echo -e "${RED}❌ 오류 발생:${NC}"
    echo "$RESPONSE" | jq .
    exit 1
fi
