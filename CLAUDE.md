# Reframe Backend - AI 협업 개발 가이드

## 프로젝트 개요

- **프로젝트명**: Reframe (리프레임)
- **핵심 컨셉**: 실제 인물 기반 가상 캐릭터("요정")와 1인칭 대화를 통해 사용자의 관점을 확장하는 AI 챗봇 서비스
- **기술 스택**: NestJS, TypeScript, Claude API (Anthropic)
- **아키텍처**: 레이어드 아키텍처 (Infrastructure → Domain → Application)

---

## AI 활용 전략

### 사용 도구 및 모델

| 용도 | 도구/모델 | 설명 |
|------|----------|------|
| 개발 보조 | Claude Code (CLI) | 코드 생성, 리팩토링, 디버깅 전 과정 |
| 대화 생성 | Claude API | 캐릭터 매칭, 대화 힌트 생성, 실시간 채팅 |
| 에디터 | Cursor | AI 기반 코드 편집 |
| 대화 품질 | claude-3-haiku | 빠른 응답과 비용 효율성 |

### 프롬프트 엔지니어링 전략

1. **캐릭터별 시스템 프롬프트 분리**
   - 각 캐릭터의 페르소나를 독립 모듈로 관리
   - `src/data/prompts/*.yaml` 형태로 프롬프트 템플릿화
   - Handlebars 문법으로 동적 변수 주입

2. **1인칭 화법 가드레일**
   - 시스템 프롬프트 상단에 필수 규칙 고정
   - "너는 {character_name}이다. 항상 1인칭으로 자기 이야기를 한다. 조언하지 않는다."
   - 캐릭터가 절대 AI임을 드러내지 않도록 강제

3. **XML 구조화된 컨텍스트 전달**
   - LLM에게 구조화된 데이터 전달 시 XML 태그 사용
   - 파싱 정확도 향상 및 hallucination 감소

4. **토큰 최적화**
   - 대화 히스토리는 Claude API messages 배열로 직접 전달
   - 캐릭터 컨텍스트는 시스템 프롬프트에 1회만 포함
   - 불필요한 반복 제거로 토큰 사용량 최소화

---

## 핵심 비즈니스 로직

### 캐릭터 매칭 시스템

```
사용자 고민 입력
    ↓
[1차 LLM 호출] 10명 중 4-5명 캐릭터 선정 + 매칭 이유 + 점수
    ↓
[2차 LLM 호출 x 4-5] 각 캐릭터별 conversation_hint 생성 (병렬 처리)
    ↓
점수 기반 정렬 후 반환
```

### 1인칭 대화 시스템

- **면책 조항**: "이 캐릭터는 실제 인물 OO의 철학·인터뷰 데이터를 학습하여 구성되었습니다"
- **대화 원칙**:
  - 캐릭터는 자신의 경험을 1인칭으로 이야기
  - 조언이나 평가 금지
  - 반말(casual speech) 사용
  - 구체적인 에피소드 기반 대화

---

## 폴더 구조

```
src/
├── app.ts                    # NestJS 앱 엔트리포인트
├── infrastructure/           # 순수 기술 클라이언트
│   ├── claude/              # Claude API 연동
│   │   └── claude.service.ts
│   └── prompt/              # 프롬프트 템플릿 관리
│       └── prompt.service.ts
├── domain/                   # 비즈니스 모듈
│   ├── person/              # 캐릭터 데이터 관리
│   └── session/             # 세션 관리
├── application/              # 유스케이스 (API 엔드포인트)
│   ├── person/              # 캐릭터 조회/매칭
│   ├── chat/                # 실시간 채팅 (SSE)
│   └── session/             # 세션 생성/관리
├── entity/                   # 타입 정의
└── data/
    ├── persons.json         # 캐릭터 데이터
    └── prompts/             # 프롬프트 템플릿 (YAML)
        ├── character_recommendation.yaml
        ├── character_generation.yaml
        └── character_conversation.yaml
```

---

## 프롬프트 템플릿 구조

### character_recommendation.yaml
- **목적**: 사용자 고민에 맞는 캐릭터 4-5명 선정
- **선정 기준**: 관점 다양성 (perspective diversity), 비슷한 경험보다 대비되는 배경 우선
- **출력**: reason(30자 이내), score(0-100), index

### character_generation.yaml
- **목적**: 선정된 캐릭터별 conversation_hint 생성
- **출력**: 2-3문장의 대화 힌트 (캐릭터가 사용자와 나누고 싶은 대화)

### character_conversation.yaml
- **목적**: 실시간 1인칭 대화 생성
- **특징**:
  - 시스템 프롬프트에 캐릭터 전체 컨텍스트 포함
  - 섹션별로 명확히 구분 (WHO YOU ARE, CHARACTER BACKGROUND, etc.)
  - 강력한 가드레일 (반말 강제, AI 언급 금지, 결론/교훈 금지)

---

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /health | 헬스 체크 |
| GET | /api/persons | 전체 캐릭터 조회 |
| GET | /api/persons/:id | 캐릭터 상세 조회 |
| POST | /api/persons/match | 고민 기반 캐릭터 매칭 (Claude AI) |
| POST | /api/sessions | 세션 생성 |
| POST | /api/chat | 스트리밍 채팅 (SSE) |

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (tsx watch)
npm run build    # TypeScript 빌드
npm run start    # 프로덕션 실행
npm run test     # 테스트 (vitest)
```

---

## 환경 변수

```env
ANTHROPIC_API_KEY=sk-ant-...
PORT=4000
```

---

## AI 협업 문서 구조

```
docs/
├── ai-sessions/      # AI와의 세션별 대화 기록
├── api/              # API 명세서
├── architecture/     # 아키텍처 설계 문서
├── decisions/        # 기술 결정 기록 (ADR)
├── features/         # 기능 명세서
└── prompts/          # 프롬프트 설계 문서
```

**모든 주요 개발 결정은 AI와의 협업을 통해 이루어졌으며, 해당 과정이 docs/에 기록되어 있습니다.**
