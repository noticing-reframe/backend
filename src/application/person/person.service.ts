import { PersonRepository } from '../../domain/person/person.repository.js';
import type { Person, PersonMatch } from '../../domain/person/person.interface.js';
import { ClaudeModule } from '../../infrastructure/claude/claude.module.js';

export class PersonService {
  private repository: PersonRepository;
  private claudeModule: ClaudeModule;

  constructor() {
    this.repository = new PersonRepository();
    this.claudeModule = ClaudeModule.getInstance();
  }

  async getAllPersons(): Promise<Person[]> {
    return this.repository.findAll();
  }

  async getPersonById(id: string): Promise<Person | null> {
    return this.repository.findById(id);
  }

  async matchPersonsToWorry(worryText: string): Promise<PersonMatch[]> {
    const allPersons = await this.repository.findAll();

    const prompt = `사용자의 고민을 읽고, 아래 인물 목록에서 이 고민에 가장 적합한 3명을 선택해주세요.

사용자 고민:
"${worryText}"

인물 목록:
${allPersons.map((p) => `- ${p.id}: ${p.name} (${p.type}) - ${p.one_liner}`).join('\n')}

각 인물에 대해 왜 이 사람이 이 고민에 도움이 될 수 있는지 이유를 작성해주세요.
반드시 아래 JSON 형식으로만 응답해주세요:

[
  {"id": "person_id", "reason": "이 사람을 추천하는 이유 (2-3문장)"},
  {"id": "person_id", "reason": "이 사람을 추천하는 이유 (2-3문장)"},
  {"id": "person_id", "reason": "이 사람을 추천하는 이유 (2-3문장)"}
]`;

    try {
      const response = await this.claudeModule.client.createCompletion({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 1024,
        temperature: 0.7,
      });

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const matches: Array<{ id: string; reason: string }> = JSON.parse(jsonMatch[0]);
      const matchedPersons: PersonMatch[] = [];

      for (const match of matches) {
        const person = await this.repository.findById(match.id);
        if (person) {
          matchedPersons.push({
            id: person.id,
            name: person.name,
            type: person.type,
            type_color: person.type_color,
            emoji: person.emoji,
            one_liner: person.one_liner,
            reason: match.reason,
          });
        }
      }

      return matchedPersons;
    } catch (error) {
      console.error('Match error:', error);
      // 폴백: 랜덤 3명 선택
      const shuffled = allPersons.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        type_color: p.type_color,
        emoji: p.emoji,
        one_liner: p.one_liner,
        reason: '당신의 고민에 새로운 시각을 제공해줄 수 있는 사람입니다.',
      }));
    }
  }
}
