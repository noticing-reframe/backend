import { Injectable, Inject } from '@nestjs/common';
import { ClaudeService } from '../../infrastructure/claude/claude.service';
import { PromptService } from '../../infrastructure/prompt/prompt.service';
import { PersonService } from '../../domain/person/person.service';
import { ConversationService } from '../../domain/conversation/conversation.service';
import type { ChatMessage } from '../../entity/conversation/message.entity';

@Injectable()
export class ChatAppService {
  constructor(
    @Inject(ClaudeService) private readonly claudeService: ClaudeService,
    @Inject(PromptService) private readonly promptService: PromptService,
    @Inject(PersonService) private readonly personService: PersonService,
    @Inject(ConversationService) private readonly conversationService: ConversationService
  ) {}

  async streamChat(
    personId: string,
    userWorry: string,
    chatMessages: ChatMessage[],
    onChunk: (text: string) => void
  ): Promise<void> {
    const person = this.personService.findById(personId);
    if (!person) {
      throw new Error('Person not found');
    }

    // background_story를 문자열로 변환
    const backgroundStoryText = person.background_story
      .map((item) => item.text)
      .join('\n');

    // 시스템 프롬프트 렌더링 (userWorry는 컨텍스트로만 사용)
    const systemPrompt = this.promptService.renderSystemPrompt('character_conversation', {
      character_name: person.character_name,
      character_tagline: person.character_tagline,
      character_background: person.character_background,
      character_tone: person.character_tone,
      dialogue_example: person.dialogue_example,
      background_story: backgroundStoryText,
      user_worry: userWorry,
    });

    // 프론트에서 보낸 메시지 그대로 사용
    const messages = this.conversationService.toClaudeMessages(chatMessages);

    await this.claudeService.createStreamCompletion({
      messages,
      system: systemPrompt,
      maxTokens: 1024,
      temperature: 0.8,
      onChunk,
    });
  }
}
