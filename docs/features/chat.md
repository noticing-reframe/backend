# Chat (채팅)

## 개요

캐릭터와의 1인칭 대화. 스트리밍 방식으로 실시간 응답 제공.

## 데이터 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  personId: "luna_001"                                           │
│  userWorry: "취업 준비하는데 뭘 해야 할지 모르겠어요"           │
│  messages: [{ role: "user", text: "..." }]                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      POST /api/chat                              │
│                     ChatController                               │
│                                                                  │
│  SSE Response Headers:                                          │
│  Content-Type: text/event-stream                                │
│  Cache-Control: no-cache                                        │
│  Connection: keep-alive                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ChatAppService                               │
│                                                                  │
│  1. personService.findById(personId)                            │
│  2. background_story 텍스트 변환                                │
│  3. character_conversation 프롬프트 렌더링                      │
│  4. claudeService.createStreamCompletion()                      │
│  5. 청크 단위로 SSE 전송                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SSE Stream                                   │
│                                                                  │
│  data: {"text":"나도"}                                          │
│  data: {"text":" 처음엔"}                                       │
│  data: {"text":" 그랬어."}                                      │
│  data: [DONE]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 시스템 프롬프트 구성

`character_conversation.yaml` 사용.

### 템플릿 변수

| 변수 | 출처 | 설명 |
|------|------|------|
| `character_name` | persons.json | 캐릭터 이름 |
| `character_tagline` | persons.json | 한 줄 소개 |
| `character_background` | persons.json | 캐릭터 배경 |
| `character_tone` | persons.json | 말투/톤 설명 |
| `dialogue_example` | persons.json | 대화 예시 |
| `background_story` | persons.json | 배경 스토리 (RAG 없이 전체 전송) |
| `user_worry` | 프론트엔드 | 유저 고민 |

### 렌더링 코드

```typescript
const backgroundStoryText = person.background_story
  .map((item) => item.text)
  .join('\n');

const systemPrompt = promptService.renderSystemPrompt('character_conversation', {
  character_name: person.character_name,
  character_tagline: person.character_tagline,
  character_background: person.character_background,
  character_tone: person.character_tone,
  dialogue_example: person.dialogue_example,
  background_story: backgroundStoryText,
  user_worry: userWorry,
});
```

## Claude API 호출

```typescript
await claudeService.createStreamCompletion({
  messages,           // 대화 히스토리 (프론트에서 전달)
  system: systemPrompt,
  maxTokens: 1024,
  temperature: 0.8,
  onChunk: (text) => {
    // SSE로 청크 전송
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  },
});
```

## 대화 히스토리 관리

- **Stateless**: 백엔드는 대화 히스토리를 저장하지 않음
- **프론트엔드 책임**: 매 요청 시 전체 대화 히스토리 전송
- **Claude API**: 매 요청마다 `system + messages` 전체 전송 (Stateless API)

```
턴 1: system + [user: "고민"]
턴 2: system + [user: "고민", assistant: "응답1", user: "질문2"]
턴 3: system + [user: "고민", ..., user: "질문3"]
```

## 캐릭터 보호

- `source_persona` (실제 인물명)는 프롬프트에 **노출하지 않음**
- 시스템 프롬프트에 "do not mention the name of any real public figure" 명시
- 캐릭터는 자신의 `character_background`로만 대화

## 관련 파일

| 파일 | 역할 |
|------|------|
| `chat.controller.ts` | SSE 엔드포인트 |
| `chat.service.ts` | 스트리밍 채팅 로직 |
| `claude.service.ts` | Claude API 스트리밍 호출 |
| `character_conversation.yaml` | 대화 프롬프트 |
| `conversation.service.ts` | 메시지 포맷 변환 |
