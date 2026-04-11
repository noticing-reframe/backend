import { Injectable } from '@nestjs/common';
import type { ChatMessage, ClaudeMessage } from '../../entity/conversation/message.entity';

@Injectable()
export class ConversationService {
  toClaudeMessages(messages: ChatMessage[]): ClaudeMessage[] {
    return messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));
  }

  addMessage(messages: ChatMessage[], role: 'user' | 'person', text: string): ChatMessage[] {
    return [...messages, { role, text }];
  }
}
