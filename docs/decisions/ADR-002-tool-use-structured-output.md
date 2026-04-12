# ADR-002: Tool Use 기반 구조화된 출력 채택

## 상태
승인됨 (Accepted)

## 컨텍스트
캐릭터 매칭 시스템에서 LLM의 출력을 구조화된 형태로 받아야 합니다.
필요한 출력 형식:
```json
{
  "matched": [
    { "reason": "...", "score": 85, "index": 3 },
    ...
  ]
}
```

## 결정
Claude API의 **Tool Use (Function Calling)** 기능을 사용하여 구조화된 출력을 받습니다.

## 대안 검토

### 1. 자유 텍스트 파싱
```
"3번 캐릭터가 적합합니다. 이유는..."
```
- 장점: 구현 단순
- 단점: 파싱 어려움, 형식 불일치

### 2. JSON 출력 요청
```
"다음 JSON 형식으로 응답하세요: {...}"
```
- 장점: 구조화 가능
- 단점: JSON 깨짐 발생, Hallucination

### 3. Tool Use (선택)
```yaml
tools:
  - name: match_characters
    input_schema:
      matched: array
```
- 장점: 스키마 강제, 안정적 출력, 타입 안전성
- 단점: 약간의 추가 토큰 사용

## 구현

```typescript
const response = await this.claudeService.createToolCompletion({
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }],
  tools: [toolDef],
  toolChoice: { type: 'tool', name: 'match_characters' },
});

// 구조화된 출력 직접 사용
const result = response.toolUse.input as MatchCharactersResult;
```

## 결과

### 긍정적
- 100% 스키마 준수 출력
- 파싱 로직 불필요
- TypeScript 타입과 완벽한 연동

### 부정적
- Tool 정의에 추가 토큰 사용 (~50 tokens)
- toolChoice 강제 시 약간의 유연성 감소

## AI 협업 노트
- Claude Code가 Tool Use 구현 코드 전체 생성
- 스키마 정의 시 최적의 필드 타입 제안
- minItems/maxItems 제약으로 출력 개수 제어

---

*작성일: 2025-04-05*
*작성자: AI 협업 개발팀*
