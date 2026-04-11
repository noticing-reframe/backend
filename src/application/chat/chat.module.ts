import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatAppService } from './chat.service';
import { ClaudeModule } from '../../infrastructure/claude/claude.module';
import { PromptModule } from '../../infrastructure/prompt/prompt.module';
import { PersonModule } from '../../domain/person/person.module';
import { ConversationModule } from '../../domain/conversation/conversation.module';

@Module({
  imports: [ClaudeModule, PromptModule, PersonModule, ConversationModule],
  controllers: [ChatController],
  providers: [ChatAppService],
})
export class ChatModule {}
