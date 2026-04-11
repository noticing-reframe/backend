# Backend Architecture Overview

## 기술 스택

| 항목 | 기술 |
|------|------|
| Runtime | Node.js |
| Framework | NestJS |
| Language | TypeScript (ESM) |
| AI | Claude API (Anthropic) |
| Data | JSON 파일 (persons.json) |

## 레이어 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Controllers + AppServices - 유스케이스 조합)           │
├─────────────────────────────────────────────────────────┤
│                      Domain Layer                        │
│  (Services + Repositories - 비즈니스 로직)              │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                    │
│  (Claude, Prompt - 순수 기술 클라이언트)                │
├─────────────────────────────────────────────────────────┤
│                      Entity Layer                        │
│  (타입 정의 - 모든 레이어에서 사용)                      │
└─────────────────────────────────────────────────────────┘
```

## 의존성 규칙

```
application → domain → infrastructure
     ↓           ↓           ↓
              entity (공통)
```

- `infrastructure`: 외부 API 클라이언트 (Claude, Prompt) - 비즈니스 로직 없음
- `domain`: 비즈니스 모듈 (Person, Conversation)
- `application`: 유스케이스 조합 (PersonApp, ChatApp)
- `entity`: 타입 정의 (모든 레이어에서 import 가능)

## 폴더 구조

```
src/
├── main.ts                           # NestJS 부트스트랩
├── app.module.ts                     # 루트 모듈
│
├── entity/                           # 타입 정의
│   ├── person/
│   │   └── person.entity.ts          # Person, PersonMatch 인터페이스
│   ├── conversation/
│   │   └── message.entity.ts         # ChatMessage 인터페이스
│   └── prompt/
│       └── prompt-template.entity.ts # 프롬프트 관련 타입
│
├── infrastructure/                   # 기술 클라이언트
│   ├── claude/
│   │   ├── claude.module.ts
│   │   └── claude.service.ts         # Claude API 호출
│   └── prompt/
│       ├── prompt.module.ts
│       └── prompt.service.ts         # YAML 프롬프트 로딩/렌더링
│
├── domain/                           # 비즈니스 모듈
│   ├── person/
│   │   ├── person.module.ts
│   │   └── person.service.ts         # 인물 조회
│   └── conversation/
│       ├── conversation.module.ts
│       └── conversation.service.ts   # 메시지 변환
│
├── application/                      # 유스케이스
│   ├── person/
│   │   ├── person.module.ts
│   │   ├── person.controller.ts      # /api/persons/*
│   │   └── person.service.ts         # 매칭 + 상세 생성
│   └── chat/
│       ├── chat.module.ts
│       ├── chat.controller.ts        # /api/chat
│       └── chat.service.ts           # 스트리밍 채팅
│
└── data/
    ├── persons.json                  # 캐릭터 데이터 (10명)
    └── prompts/
        ├── character_recommendation.yaml
        ├── character_generation.yaml
        └── character_conversation.yaml
```

## NestJS 모듈 구성

```typescript
// app.module.ts
@Module({
  imports: [
    ClaudeModule,
    PromptModule,
    PersonDomainModule,
    ConversationModule,
    PersonModule,
    ChatModule,
  ],
})
export class AppModule {}
```

## ESM 설정

- `"type": "module"` in package.json
- 모든 import에 `.js` 확장자 불필요 (bundler moduleResolution)
- NestJS DI는 `@Inject()` 데코레이터 필수
