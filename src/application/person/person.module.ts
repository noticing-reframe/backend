import { Module } from '@nestjs/common';
import { PersonController } from './person.controller';
import { PersonAppService } from './person.service';
import { PersonModule as PersonDomainModule } from '../../domain/person/person.module';
import { ClaudeModule } from '../../infrastructure/claude/claude.module';
import { PromptModule } from '../../infrastructure/prompt/prompt.module';

@Module({
  imports: [PersonDomainModule, ClaudeModule, PromptModule],
  controllers: [PersonController],
  providers: [PersonAppService],
})
export class PersonModule {}
