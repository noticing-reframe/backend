# 프롬프트 엔지니어링 가이드

## 개요

Reframe의 핵심 가치는 **캐릭터의 1인칭 대화**입니다. 이를 위해 정교한 프롬프트 엔지니어링이 필요하며, 본 문서는 그 설계 과정과 결과물을 기록합니다.

---

## 1. 프롬프트 템플릿 시스템

### 1.1 YAML 기반 템플릿 관리

```yaml
# src/data/prompts/character_recommendation.yaml
name: character_recommendation

input_schema:
  type: object
  properties:
    user_worry:
      type: string
    characters:
      type: array

output_schema:
  name: match_characters
  description: Match characters to user's worry
  input_schema:
    type: object
    properties:
      matched:
        type: array
        items:
          - reason: string
          - score: integer
          - index: integer

system_prompt: |
  You are a character recommendation engine...

user_message_template: |
  <user_worry>
  {{user_worry}}
  </user_worry>
  ...
```

### 1.2 Handlebars 템플릿 엔진

```typescript
// PromptService에서 템플릿 렌더링
const userMessage = this.promptService.renderUserMessage('character_recommendation', {
  user_worry: "진로가 고민이에요",
  characters: [...],
});
```

---

## 2. Tool Use 기반 구조화 출력

### 2.1 왜 Tool Use인가?

| 방식 | 장점 | 단점 |
|------|------|------|
| 자유 텍스트 | 유연함 | 파싱 어려움, 형식 불일치 |
| JSON 요청 | 구조화 | Hallucination, 형식 오류 |
| **Tool Use** | 스키마 강제, 안정적 | - |

### 2.2 도구 정의 예시

```yaml
output_schema:
  name: match_characters
  description: Match characters to user's worry and return ranked recommendations
  input_schema:
    type: object
    properties:
      matched:
        type: array
        items:
          type: object
          properties:
            reason:
              type: string
              description: "Korean, max 30 characters"
            score:
              type: integer
              description: "0-100, higher means better fit"
            index:
              type: integer
              description: "1-based index of character"
        minItems: 4
        maxItems: 5
    required:
      - matched
```

---

## 3. 1인칭 화법 가드레일

### 3.1 설계 목표

- 캐릭터가 **자기 이야기**를 1인칭으로 전달
- **조언, 평가, 교훈 금지**
- AI임을 절대 드러내지 않음
- 구체적인 **에피소드 기반** 대화

### 3.2 시스템 프롬프트 구조

```
## SECTION 1: CHARACTER VOICE & IDENTITY
- You ARE {{character_name}}. Never break character.
- Speak with the tone: {{character_tone}}
- ALL responses MUST be in Korean (한국어)
- Always use 반말 (casual speech)

## SECTION 2: GROUND EVERY RESPONSE IN YOUR STORY
- Every response must be anchored in a specific episode
- Describe the scene concretely
- Use first-person framing: "나는 ~했을 때"

## SECTION 3: HOW TO RESPOND
- For LIGHT exchanges: 1-2 sentences
- For HEAVY worries: go deeper with specific episode
- Do NOT evaluate or judge

## SECTION 4: RESPONSE FORMAT
- Keep responses to 2-4 sentences
- End with ONE genuine question

## SECTION 5: WHAT TO AVOID
- Never say "as an AI"
- No generic motivation: "할 수 있어", "포기하지 마"
- No conclusions or lessons
```

### 3.3 Bad vs Good 예시

**Bad (조언형):**
```
"진로 걱정 많이 되지? 하지만 넌 할 수 있어.
자신을 믿고 도전해봐!"
```

**Good (1인칭 에피소드):**
```
"나도 스물셋에 회사 때려치고 뭐 하나 싶었어.
월세 밀리면서 만화만 그렸는데...
지금 뭐가 제일 하고 싶어?"
```

---

## 4. XML 구조화 컨텍스트

### 4.1 도입 배경

초기에는 평문으로 캐릭터 정보를 전달했으나, LLM이 필드를 혼동하는 경우가 있었습니다.

**Before:**
```
[1] 여백
Tagline: 만화만 보다가 기획자가 된
Background: 10년차 콘텐츠 기획자...
```

**After (XML):**
```xml
<characters count="10">
<character index="1">
  <name>여백</name>
  <tagline>만화만 보다가 기획자가 된</tagline>
  <background>10년차 콘텐츠 기획자...</background>
</character>
</characters>
```

### 4.2 효과

- 필드 구분 명확화
- 파싱 정확도 향상
- Hallucination 감소

---

## 5. 프롬프트 최적화 히스토리

### v1.0 - 초기 버전
- 단순 지시형 프롬프트
- 문제: 캐릭터가 자주 조언함

### v1.1 - 가드레일 추가
- "조언하지 마라" 규칙 추가
- 문제: 여전히 결론을 내림

### v1.2 - 섹션 구조화
- 5개 섹션으로 명확히 분리
- 각 섹션별 구체적 규칙 명시
- 효과: 1인칭 에피소드 비율 증가

### v1.3 - XML 컨텍스트 (현재)
- 구조화된 데이터 전달
- Tool Use 스키마 정교화
- 효과: 안정적인 출력 품질

---

## 6. 토큰 최적화 전략

### 6.1 시스템 프롬프트 최적화

| 요소 | 토큰 수 | 최적화 방법 |
|------|--------|------------|
| 캐릭터 배경 | ~200 | 핵심만 요약 |
| 대화 규칙 | ~400 | 섹션별 정리 |
| 예시 대화 | ~100 | 1개만 포함 |

### 6.2 대화 히스토리 관리

```typescript
// 현재: 전체 히스토리 전달
messages: conversationHistory

// 향후: 요약 압축 도입 예정
messages: summarizeHistory(conversationHistory)
```

---

## 7. 프롬프트 테스트 체크리스트

- [ ] 캐릭터가 1인칭으로 말하는가?
- [ ] 구체적인 에피소드를 언급하는가?
- [ ] 조언이나 평가를 하지 않는가?
- [ ] 반말을 사용하는가?
- [ ] AI임을 드러내지 않는가?
- [ ] 질문으로 끝나는가?

---

*이 문서는 Claude Code와의 프롬프트 최적화 과정을 기록한 것입니다.*
