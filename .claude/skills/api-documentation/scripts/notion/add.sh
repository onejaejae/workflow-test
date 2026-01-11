#!/bin/bash
#
# Notion API 명세 추가 스크립트
# Usage: ./add.sh --name "API 이름" --method "POST" --endpoint "/api/v1/users" --tag "Users"
#
# Features:
#   - 자동으로 "API" suffix 추가 (--no-suffix로 비활성화)
#   - docs 페이지 생성 및 연결 (--create-docs 또는 --docs-id)
#   - 동적 Request Body 및 Response Schema 지원
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

# HTTP 상태 텍스트 함수
get_status_text() {
    case $1 in
        200) echo "200 성공" ;;
        201) echo "201 Created" ;;
        400) echo "400 Bad Request" ;;
        401) echo "401 Unauthorized" ;;
        403) echo "403 Forbidden" ;;
        404) echo "404 Not Found" ;;
        409) echo "409 Conflict" ;;
        500) echo "500 Internal Server Error" ;;
        *) echo "$1" ;;
    esac
}

# 도움말
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Notion 데이터베이스에 API 명세를 추가합니다."
    echo ""
    echo "Options:"
    echo "  --name          API 이름/설명 (필수, 자동으로 'API' suffix 추가)"
    echo "  --method        HTTP 메서드: GET, POST, PUT, PATCH, DELETE (필수)"
    echo "  --endpoint      API 엔드포인트 경로 (필수)"
    echo "  --tag           태그/카테고리 (필수)"
    echo "  --status        구현 여부 (기본값: 구현완료)"
    echo "  --no-suffix     'API' suffix 자동 추가 비활성화"
    echo ""
    echo "Docs Options:"
    echo "  --create-docs   태스크 Database에 docs 페이지 생성 및 연결"
    echo "  --docs-id       기존 docs 페이지 ID로 연결 (page mention)"
    echo "  --docs-title    docs 페이지 제목 (기본값: [RE-AI] {name})"
    echo ""
    echo "Dynamic Content Options:"
    echo "  --request-body  Request Body JSON 또는 설명 (선택)"
    echo "  --response      Response 예시 (반복 가능)"
    echo "                  형식: \"상태코드:JSON\""
    echo "  --help          도움말 표시"
    echo ""
    echo "Environment Variables:"
    echo "  NOTION_TASKS_DATABASE_ID  태스크 Database ID (--create-docs 시 필수)"
    echo "  NOTION_EPIC_ID            연결할 에픽 ID (선택)"
    echo ""
    echo "Examples:"
    echo "  # 기본 사용 (정적 템플릿)"
    echo "  $0 --name \"회원가입\" --method POST --endpoint \"/api/v1/auth/signup\" --tag Auth"
    echo ""
    echo "  # 동적 Response Schema 포함"
    echo "  $0 --name \"내 정보 조회\" --method GET --endpoint \"/api/v1/users/me\" --tag User \\"
    echo "     --create-docs \\"
    echo "     --request-body '없음 (GET 요청)' \\"
    echo "     --response '200:{\"success\":true,\"data\":{\"id\":\"uuid\",\"email\":\"user@example.com\"}}' \\"
    echo "     --response '401:{\"success\":false,\"error\":{\"code\":\"AUTH_UNAUTHORIZED\",\"message\":\"Unauthorized\"}}'"
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
REQUEST_BODY=""
declare -a RESPONSES=()

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
        --request-body)
            REQUEST_BODY="$2"
            shift 2
            ;;
        --response)
            RESPONSES+=("$2")
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

# JSON 문자열 이스케이프 함수 (macOS/Linux 호환)
escape_json_string() {
    local input="$1"
    # JSON pretty print 시도, 실패하면 원본 사용
    local formatted=$(echo "$input" | jq '.' 2>/dev/null || echo "$input")
    # 줄바꿈과 특수문자 이스케이프 (macOS 호환)
    echo "$formatted" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//'
}

# Response 블록 생성 함수
generate_response_blocks() {
    local blocks=""

    if [[ ${#RESPONSES[@]} -gt 0 ]]; then
        # 동적 Response 블록 생성
        for response in "${RESPONSES[@]}"; do
            local status_code=$(echo "$response" | cut -d':' -f1)
            local response_body=$(echo "$response" | cut -d':' -f2-)
            local status_text=$(get_status_text "$status_code")

            # JSON pretty print
            local formatted_body=$(echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body")
            local escaped_body=$(escape_json_string "$formatted_body")

            blocks="${blocks}
    {\"type\": \"heading_3\", \"heading_3\": {\"rich_text\": [{\"type\": \"text\", \"text\": {\"content\": \"${status_text}\"}}]}},
    {\"type\": \"code\", \"code\": {\"rich_text\": [{\"type\": \"text\", \"text\": {\"content\": \"${escaped_body}\"}}], \"language\": \"json\"}},"
        done
    else
        # 기본 정적 템플릿
        blocks='
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "200 성공"}}]}},
    {"type": "code", "code": {"rich_text": [{"type": "text", "text": {"content": "{\n  \"success\": true,\n  \"data\": {}\n}"}}], "language": "json"}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "400 Bad Request"}}]}},
    {"type": "code", "code": {"rich_text": [{"type": "text", "text": {"content": "{\n  \"success\": false,\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"입력값이 올바르지 않습니다.\"\n  }\n}"}}], "language": "json"}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "401 Unauthorized"}}]}},
    {"type": "code", "code": {"rich_text": [{"type": "text", "text": {"content": "{\n  \"success\": false,\n  \"error\": {\n    \"code\": \"AUTH_UNAUTHORIZED\",\n    \"message\": \"인증이 필요합니다.\"\n  }\n}"}}], "language": "json"}},'
    fi

    # 마지막 쉼표 제거
    echo "$blocks" | sed '$ s/,$//'
}

# Request Body 블록 생성 함수 (macOS/Linux 호환)
generate_request_body_block() {
    local content=""

    if [[ -n "$REQUEST_BODY" ]]; then
        # JSON인지 확인
        if echo "$REQUEST_BODY" | jq '.' > /dev/null 2>&1; then
            # JSON이면 pretty print (macOS 호환)
            content=$(echo "$REQUEST_BODY" | jq '.' | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
        else
            # JSON이 아니면 그대로 사용 (예: "없음 (GET 요청)")
            content="$REQUEST_BODY"
        fi
    else
        content="// Request Body 예시를 작성하세요\n{\n  \n}"
    fi

    echo "$content"
}

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

    # 태스크 row 생성 payload (아이콘 포함)
    local task_payload=$(cat <<TASKEOF
{
  "parent": {
    "database_id": "${tasks_db_id}"
  },
  "icon": {
    "type": "external",
    "external": {
      "url": "https://www.notion.so/icons/checkmark-square_gray.svg"
    }
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

    # 동적 블록 생성
    local request_body_content=$(generate_request_body_block)
    local response_blocks=$(generate_response_blocks)

    # 태스크 페이지에 API Spec 블록 추가
    local blocks_payload=$(cat <<BLOCKSEOF
{
  "children": [
    {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "배경"}}]}},
    {"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": "${name}의 구현 배경을 작성하세요."}}]}},
    {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "작업내용"}}]}},
    {"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": "작업 항목을 추가하세요"}}]}},
    {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "${name}"}}]}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "Endpoint"}}]}},
    {"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": "${method} ${endpoint}"}}]}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "Path Parameters"}}]}},
    {"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": "없음 (필요시 추가)"}}]}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "Query Parameters"}}]}},
    {"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": "없음 (필요시 추가)"}}]}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "Request Body"}}]}},
    {"type": "code", "code": {"rich_text": [{"type": "text", "text": {"content": "${request_body_content}"}}], "language": "json"}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "요청 예시"}}]}},
    {"type": "code", "code": {"rich_text": [{"type": "text", "text": {"content": "curl -X '${method}' 'http://localhost:8000${endpoint}' \\\\\n  -H 'Authorization: Bearer {jwt_token}' \\\\\n  -H 'Content-Type: application/json' \\\\\n  -d '{}'"}}], "language": "bash"}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "Response Schema"}}]}},
    ${response_blocks}
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
    if [[ ${#RESPONSES[@]} -gt 0 ]]; then
        echo "  Responses: ${#RESPONSES[@]}개 (동적)"
    fi
else
    echo -e "${RED}❌ 오류 발생:${NC}"
    echo "$RESPONSE" | jq .
    exit 1
fi
