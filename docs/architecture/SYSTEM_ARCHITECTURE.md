# Reframe 시스템 아키텍처

## 개요

Reframe은 레이어드 아키텍처를 기반으로 설계된 AI 챗봇 백엔드입니다. 각 레이어는 명확한 책임을 가지며, 의존성은 항상 상위에서 하위로 흐릅니다.

---

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                      클라이언트 (Next.js)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Person    │  │    Chat     │  │   Session   │         │
│  │ Controller  │  │ Controller  │  │ Controller  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │   Person    │  │    Chat     │  │   Session   │         │
│  │  Service    │  │   Service   │  │   Service   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Person    │  │   Session   │  │   Insight   │         │
│  │   Service   │  │   Service   │  │   Service   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │   Person    │  │   Session   │  │   Insight   │         │
│  │ Repository  │  │ Repository  │  │ Repository  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │    Claude Service   │  │   Prompt Service    │          │
│  │   (Anthropic API)   │  │  (Template Engine)  │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   Anthropic API     │  │   JSON/YAML Data    │          │
│  │   (Claude Models)   │  │   (Local Storage)   │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 레이어 설명

### 1. Application Layer

**역할**: HTTP 요청 처리 및 유스케이스 오케스트레이션

```typescript
// PersonAppService 예시
async matchPersonsToWorry(worryText: string): Promise<PersonMatch[]> {
  // 1. 캐릭터 추천 (LLM 호출)
  const matchedCharacters = await this.recommendCharacters(worryText, allPersons);

  // 2. 각 캐릭터별 대화 힌트 생성 (병렬 LLM 호출)
  const results = await Promise.all(
    matchedCharacters.map(async (char) => {
      const hint = await this.generateCharacterDetail(worryText, char);
      return { ...char, conversation_hint: hint };
    })
  );

  return results;
}
```

### 2. Domain Layer

**역할**: 비즈니스 로직 및 데이터 접근

```typescript
// PersonService
findAll(): Person[] {
  return this.personRepository.findAll();
}

findById(id: string): Person | null {
  return this.personRepository.findById(id);
}
```

### 3. Infrastructure Layer

**역할**: 외부 서비스 연동 (순수 기술 클라이언트)

```typescript
// ClaudeService
async createToolCompletion(request: ToolCompletionRequest) {
  return this.client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: request.maxTokens,
    system: request.system,
    messages: request.messages,
    tools: request.tools,
    tool_choice: request.toolChoice,
  });
}
```

---

## 데이터 흐름

### 캐릭터 매칭 플로우

```
1. POST /api/persons/match { worry: "진로가 고민이에요" }
   │
2. PersonAppService.matchPersonsToWorry()
   │
3. PromptService.renderUserMessage('character_recommendation', {...})
   │
4. ClaudeService.createToolCompletion()
   │  └─ Tool Use: match_characters
   │
5. [병렬] ClaudeService.createToolCompletion() x 4-5
   │  └─ Tool Use: generate_character_detail
   │
6. 점수 기반 정렬 후 응답
```

### 실시간 채팅 플로우 (SSE)

```
1. POST /api/chat { session_id, message: "나도 그런 적 있어요" }
   │
2. ChatService.chat()
   │
3. PromptService.getSystemPrompt('character_conversation')
   │  └─ {{character_name}}, {{character_background}} 등 치환
   │
4. ClaudeService.createStreamCompletion()
   │  └─ SSE 스트리밍
   │
5. 클라이언트에 청크 단위 전송
```

---

## 모듈 의존성

```
Application
    ├── Domain (PersonService, SessionService)
    └── Infrastructure (ClaudeService, PromptService)

Domain
    └── Infrastructure (데이터 접근만)

Infrastructure
    └── External (Anthropic API, File System)
```

**원칙:**
- 상위 레이어만 하위 레이어를 참조
- 동일 레이어 간 직접 참조 금지
- Infrastructure는 비즈니스 로직 없음

---

## 확장성 고려사항

### 현재 구조의 장점

1. **테스트 용이성**: 각 레이어를 독립적으로 테스트 가능
2. **교체 용이성**: Infrastructure 교체 시 상위 레이어 변경 불필요
3. **명확한 책임**: 각 레이어의 역할이 분명

### 향후 확장 방향

- [ ] 데이터베이스 연동 (현재 JSON 파일 기반)
- [ ] Redis 캐싱 (캐릭터 컨텍스트)
- [ ] 대화 히스토리 영구 저장
- [ ] 멀티 모델 지원 (OpenAI, etc.)

---

*이 문서는 Claude Code와의 아키텍처 설계 논의를 바탕으로 작성되었습니다.*
