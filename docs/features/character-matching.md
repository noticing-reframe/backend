# Character Matching (캐릭터 매칭)

## 개요

유저의 고민을 분석하여 10명의 캐릭터 중 4-5명을 Claude AI가 선택하고, 각 캐릭터가 왜 이 유저와 대화하면 좋을지 이유를 생성.

## 데이터 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  worryText: "취업 준비하는데 뭘 해야 할지 모르겠어요"           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POST /api/persons/match                        │
│                     PersonController                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PersonAppService                              │
│                                                                  │
│  1. personService.findAll() → 10명 캐릭터 로드                  │
│  2. recommendCharacters() → Claude tool_use로 4-5명 선택        │
│  3. generateCharacterDetail() → 각 캐릭터별 conversation_hint   │
│  4. 결과 병합하여 반환                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Response                                 │
│  PersonMatch[] (character_id, name, tagline, reason, hint 등)   │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: 캐릭터 추천 (recommendCharacters)

### 프롬프트

`character_recommendation.yaml`

### 입력 데이터

```typescript
{
  user_worry: "취업 준비하는데 뭘 해야 할지 모르겠어요",
  characters: [
    {
      character_name: "루나",
      character_tagline: "7전 8기 N잡러, 루나",
      character_background: "...",
      character_tone: "건조하고 무심한 톤...",
      dialogue_example: "뭘 좋아하는지 모르겠다고..."
    },
    // ... 9명 더
  ]
}
```

### Claude Tool Use

```typescript
const response = await claudeService.createToolCompletion({
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }],
  tools: [{
    name: 'match_characters',
    description: 'Match characters to the user\'s worry...',
    input_schema: { /* ... */ }
  }],
  toolChoice: { type: 'tool', name: 'match_characters' }
});
```

### 출력 (Tool Use Result)

```json
{
  "matched": [
    { "index": 1, "reason": "진로를 고민하는 당신에게..." },
    { "index": 3, "reason": "불확실한 미래가 두려울 때..." },
    { "index": 5, "reason": "..." },
    { "index": 7, "reason": "..." }
  ]
}
```

- `index`: 1-based (입력 배열 순서)
- `reason`: 한국어, 1-2문장, 캐릭터 선택 화면에 표시

---

## Step 2: 캐릭터 상세 생성 (generateCharacterDetail)

### 프롬프트

`character_generation.yaml`

### 입력 데이터

```typescript
{
  user_worry: "취업 준비하는데 뭘 해야 할지 모르겠어요",
  match_reason: "진로를 고민하는 당신에게...",  // Step 1에서 생성된 reason
  character_name: "루나",
  character_tagline: "7전 8기 N잡러, 루나",
  character_background: "...",
  character_tone: "건조하고 무심한 톤..."
}
```

### 출력 (Tool Use Result)

```json
{
  "conversation_hint": "나도 처음엔 뭘 해야 할지 전혀 몰랐거든. 그냥 눈앞에 보이는 거 하나씩 해봤어. 그 얘기 해볼까?"
}
```

- `conversation_hint`: 한국어, 2-3문장
- 캐릭터 상세 화면 "당신과 하고 싶은 대화" 섹션에 표시

---

## 최종 응답 구조

```typescript
interface PersonMatch {
  character_id: string;       // "luna_001"
  character_name: string;     // "루나"
  character_tagline: string;  // "7전 8기 N잡러, 루나"
  character_background: string;
  reason: string;             // LLM 생성 (Step 1)
  conversation_hint: string;  // LLM 생성 (Step 2)
  profile_image: number;      // 1
}
```

## 관련 파일

| 파일 | 역할 |
|------|------|
| `person.controller.ts` | HTTP 엔드포인트 |
| `person.service.ts` (application) | 매칭 + 상세 생성 로직 |
| `person.service.ts` (domain) | 캐릭터 데이터 조회 |
| `character_recommendation.yaml` | 추천 프롬프트 |
| `character_generation.yaml` | 상세 생성 프롬프트 |
| `persons.json` | 캐릭터 데이터 (10명) |
