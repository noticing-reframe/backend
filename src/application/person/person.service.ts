import { Injectable, Inject } from '@nestjs/common';
import { PersonService } from '../../domain/person/person.service';
import { ClaudeService } from '../../infrastructure/claude/claude.service';
import { PromptService } from '../../infrastructure/prompt/prompt.service';
import type { Person, PersonMatch } from '../../entity/person/person.entity';
import type { MatchCharactersResult, GenerateCharacterDetailResult } from '../../entity/prompt/prompt-template.entity';

@Injectable()
export class PersonAppService {
  constructor(
    @Inject(PersonService) private readonly personService: PersonService,
    @Inject(ClaudeService) private readonly claudeService: ClaudeService,
    @Inject(PromptService) private readonly promptService: PromptService
  ) {}

  getAllPersons(): Person[] {
    return this.personService.findAll();
  }

  getPersonById(id: string): Person | null {
    return this.personService.findById(id);
  }

  async matchPersonsToWorry(worryText: string): Promise<PersonMatch[]> {
    const allPersons = this.personService.findAll();

    // Step 1: Use Claude AI to recommend 4-5 characters
    const matchedCharacters = await this.recommendCharacters(worryText, allPersons);

    // Step 2: For each matched character, generate conversation_hint
    const results = await Promise.all(
      matchedCharacters.map(async ({ index, reason, score }) => {
        const person = allPersons[index - 1]; // Convert 1-based to 0-based index
        const conversationHint = await this.generateCharacterDetail(worryText, reason, person);

        return {
          character_id: person.character_id,
          character_name: person.character_name,
          character_tagline: person.character_tagline,
          character_background: person.character_background,
          reason,
          conversation_hint: conversationHint,
          profile_image: person.profile_image,
          tags: person.tags || [person.character_category],
        };
      })
    );

    return results;
  }

  private async recommendCharacters(
    worryText: string,
    persons: Person[]
  ): Promise<{ index: number; reason: string; score: number }[]> {
    const toolDef = this.promptService.getToolDefinition('character_recommendation');
    if (!toolDef) throw new Error('Tool definition not found');

    const systemPrompt = this.promptService.getSystemPrompt('character_recommendation');

    const characters = persons.map((p) => ({
      character_name: p.character_name,
      character_tagline: p.character_tagline,
      character_background: p.character_background,
    }));

    const userMessage = this.promptService.renderUserMessage('character_recommendation', {
      user_worry: worryText,
      characters,
    });

    const response = await this.claudeService.createToolCompletion({
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      tools: [toolDef],
      toolChoice: { type: 'tool', name: toolDef.name },
      maxTokens: 1024,
    });

    if (!response.toolUse || response.toolUse.name !== 'match_characters') {
      throw new Error('Expected match_characters tool use');
    }

    const result = response.toolUse.input as unknown as MatchCharactersResult;
    // Sort by score descending
    return result.matched.sort((a, b) => b.score - a.score);
  }

  private async generateCharacterDetail(
    worryText: string,
    matchReason: string,
    person: Person
  ): Promise<string[]> {
    const toolDef = this.promptService.getToolDefinition('character_generation');
    if (!toolDef) throw new Error('Tool definition not found');

    const systemPrompt = this.promptService.getSystemPrompt('character_generation');

    const userMessage = this.promptService.renderUserMessage('character_generation', {
      user_worry: worryText,
      match_reason: matchReason,
      character_name: person.character_name,
      character_tagline: person.character_tagline,
      character_background: person.character_background,
      character_tone: person.character_tone,
    });

    const response = await this.claudeService.createToolCompletion({
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      tools: [toolDef],
      toolChoice: { type: 'tool', name: toolDef.name },
      maxTokens: 512,
    });

    if (!response.toolUse || response.toolUse.name !== 'generate_character_detail') {
      throw new Error('Expected generate_character_detail tool use');
    }

    const result = response.toolUse.input as unknown as GenerateCharacterDetailResult;
    return result.conversation_hint;
  }
}
