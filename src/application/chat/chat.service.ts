import { ClaudeModule } from '../../infrastructure/claude/claude.module.js';
import { PersonRepository } from '../../domain/person/person.repository.js';
import type { Message } from '../../infrastructure/claude/interface/claude.interface.js';

interface ChatMessage {
  role: 'user' | 'person';
  text: string;
}

export class ChatService {
  private claudeModule: ClaudeModule;
  private personRepository: PersonRepository;

  constructor() {
    this.claudeModule = ClaudeModule.getInstance();
    this.personRepository = new PersonRepository();
  }

  async streamChat(
    personId: string,
    chatMessages: ChatMessage[],
    onChunk: (text: string) => void
  ): Promise<void> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new Error('Person not found');
    }

    // ChatMessage를 Claude Message 형식으로 변환
    const messages: Message[] = chatMessages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const systemPrompt = `${person.system_prompt}

배경 정보:
${person.background_story}

중요 지침:
- 반드시 1인칭으로 대화하세요. ("나는...", "내가...")
- 사용자의 고민에 공감하고, 자신의 경험을 바탕으로 조언해주세요.
- 너무 길지 않게, 2-4문단 정도로 응답하세요.
- 자연스럽고 따뜻한 어조를 유지하세요.
- 학문적이거나 딱딱한 어조는 피하세요.`;

    await this.claudeModule.client.createStreamCompletion({
      messages,
      system: systemPrompt,
      maxTokens: 1024,
      temperature: 0.8,
      onChunk,
    });
  }
}
