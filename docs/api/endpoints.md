# API Endpoints

## Base URL

```
http://localhost:4000
```

## 인증

LLM 호출 엔드포인트는 `X-LLM-API-Key` 헤더 필수.

```typescript
headers: {
  'Content-Type': 'application/json',
  'X-LLM-API-Key': process.env.LLM_API_KEY
}
```

---

## Health Check

### `GET /health`

서버 상태 확인.

**Response:**
```json
{
  "status": "ok"
}
```

---

## 캐릭터 매칭

### `POST /api/persons/match`

유저 고민을 받아 Claude AI로 4-5명의 캐릭터를 매칭하고, 각 캐릭터별 `conversation_hint`를 생성.

**Headers:**
```
X-LLM-API-Key: {LLM_API_KEY}
```

**Request Body:**
```json
{
  "worryText": "취업 준비하는데 뭘 해야 할지 모르겠어요"
}
```

**Response:**
```json
[
  {
    "character_id": "luna_001",
    "character_name": "루나",
    "character_tagline": "7전 8기 N잡러, 루나",
    "character_background": "...",
    "reason": "진로를 고민하는 당신에게, 여러 직업을 경험하며 자신만의 길을 찾은 루나의 이야기가 도움이 될 거예요.",
    "conversation_hint": "나도 처음엔 뭘 해야 할지 전혀 몰랐거든. 그냥 눈앞에 보이는 거 하나씩 해봤어. 그 얘기 해볼까?",
    "profile_image": 1
  },
  // ... 3-4명 더
]
```

**처리 플로우:**
1. `character_recommendation` 프롬프트로 Claude tool_use 호출 → 4-5명 선택 + `reason` 생성
2. 각 캐릭터별로 `character_generation` 프롬프트로 `conversation_hint` 생성
3. 결과 병합하여 반환

---

## 채팅

### `POST /api/chat`

캐릭터와 스트리밍 채팅. SSE(Server-Sent Events) 방식.

**Headers:**
```
X-LLM-API-Key: {LLM_API_KEY}
```

**Request Body:**
```json
{
  "personId": "luna_001",
  "userWorry": "취업 준비하는데 뭘 해야 할지 모르겠어요",
  "messages": [
    { "role": "user", "text": "취업 준비하는데 뭘 해야 할지 모르겠어요" }
  ]
}
```

**Response (SSE Stream):**
```
data: {"text":"나도"}

data: {"text":" 처음엔"}

data: {"text":" 그랬어."}

data: [DONE]
```

**처리 플로우:**
1. `personId`로 캐릭터 정보 조회 (persons.json)
2. `character_conversation` 프롬프트 렌더링 (system prompt)
3. Claude streaming API 호출
4. 청크 단위로 SSE 전송

**프론트엔드 처리:**
```typescript
const reader = res.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // data: {"text":"..."} 파싱
}
```

---

## 에러 응답

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Invalid LLM API Key"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Person not found"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```
