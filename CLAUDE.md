# Backend - Claude Code 협업 가이드

## 프로젝트 개요
- **프로젝트명**: Reframe
- **역할**: 실제 인물 기반 가상 캐릭터와 1인칭 대화하는 AI 챗봇 서비스의 백엔드
- **기술 스택**: Node.js, TypeScript, Express
- **아키텍처**: 레이어드 아키텍처

## 핵심 비즈니스 컨셉
- **실제 인물 기반 가상 캐릭터**: 실제 인물의 핵심 속성·철학·경험 패턴을 학습한 가상 캐릭터
- **1인칭 대화**: 캐릭터가 자기 이야기를 1인칭으로 대화 ("나는 그때…", "내가 제일 무서웠던 건…")
- **면책**: 캐릭터 카드에 "이 캐릭터는 실제 인물 OO의 철학·인터뷰 데이터를 학습하여 구성되었습니다" 명시

## 폴더 구조

```
src/
├── index.ts                              # Express 서버 엔트리포인트
├── infrastructure/                       # 순수 기술 클라이언트 (비즈니스 로직 없음)
│   └── claude/
│       ├── interface/
│       │   └── claude.interface.ts       # API 인터페이스
│       ├── component/
│       │   └── claude.client.ts          # Claude API 호출 + 스트리밍
│       └── claude.module.ts              # 싱글톤 모듈
├── domain/                               # 비즈니스 모듈 (컴포넌트 단위)
│   ├── person/
│   │   ├── person.interface.ts           # Person 타입
│   │   └── person.repository.ts          # 인물 저장소 + 샘플 데이터
│   ├── session/
│   │   ├── session.interface.ts          # Session 타입
│   │   └── session.repository.ts         # 세션 저장소
│   └── insight/
│       ├── insight.interface.ts          # Insight 타입
│       └── insight.repository.ts         # 인사이트 저장소
└── application/                          # 유스케이스 (domain 조합)
    ├── person/
    │   ├── person.controller.ts
    │   └── person.service.ts
    ├── session/
    │   ├── session.controller.ts
    │   └── session.service.ts
    ├── match/
    │   ├── match.controller.ts
    │   └── match.service.ts
    ├── chat/
    │   ├── chat.controller.ts
    │   └── chat.service.ts
    └── insight/
        ├── insight.controller.ts
        └── insight.service.ts
```

## 레이어 의존성 규칙
```
application → domain → infrastructure
```
- `infrastructure`: 순수 기술 클라이언트 (Claude API 등) - 비즈니스 로직 없음
- `domain`: 비즈니스 모듈, infrastructure를 사용하여 구현
- `application`: domain을 조합하여 유스케이스 구현 (controller + service)

## infrastructure 모듈 구조
```
infrastructure/{모듈명}/
├── interface/
│   └── {모듈명}.interface.ts    # 인터페이스 정의
├── component/
│   └── {모듈명}.client.ts       # 기술 클라이언트
└── {모듈명}.module.ts           # 싱글톤 모듈
```

## 코딩 컨벤션
- **클래스 기반**: 모든 모듈은 클래스로 작성
- **파일 네이밍**:
  - `xxx.controller.ts` - 컨트롤러
  - `xxx.service.ts` - 서비스
  - `xxx.client.ts` - 기술 클라이언트
  - `xxx.interface.ts` - 인터페이스
  - `xxx.module.ts` - 모듈
  - `xxx.entity.ts` - 엔티티
  - `xxx.repository.ts` - 리포지토리

## 주요 명령어
```bash
npm run dev      # 개발 서버 (tsx watch)
npm run build    # TypeScript 빌드
npm run start    # 프로덕션 실행
npm run test     # 테스트 (vitest)
```

## 환경 변수
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=4000
```

## API 엔드포인트
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /health | 헬스 체크 |
| GET | /api/persons | 전체 인물 조회 |
| GET | /api/persons/:id | 인물 상세 조회 |
| POST | /api/sessions | 세션 생성 |
| POST | /api/match | 인물 매칭 (Claude AI) |
| POST | /api/chat | 스트리밍 채팅 (SSE) |
| POST | /api/insights | 인사이트 저장 |
| GET | /api/insights/user/:userId | 유저 인사이트 조회 |

## 현재 개발 상태
- [x] 프로젝트 초기 설정
- [x] 폴더 구조 구성
- [x] Express 서버 설정
- [x] Claude API 모듈 (+ 스트리밍)
- [x] domain 비즈니스 모듈 구현 (person, session, insight)
- [x] 핵심 기능 구현 (매칭, 채팅, 인사이트)
- [ ] 데이터베이스 연동
- [ ] 인물 데이터 확장

## AI 협업 문서화

```
docs/
├── ai-sessions/   # AI와의 세션별 대화 기록
├── prompts/       # 재사용 가능한 프롬프트 모음
└── decisions/     # AI 협업으로 내린 기술 결정 (ADR)
```

**커밋할 때마다 docs 업데이트 필수**
