import { Controller, Post, Body, Headers, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { PersonAppService } from './person.service';

@Controller('persons')
export class PersonController {
  constructor(@Inject(PersonAppService) private readonly personAppService: PersonAppService) {}

  @Post('match')
  async matchPersons(
    @Headers('x-llm-api-key') llmApiKey: string,
    @Body() body: { worryText: string }
  ) {
    // LLM API Key 검증
    const serverLlmApiKey = process.env.LLM_API_KEY;
    if (!serverLlmApiKey || llmApiKey !== serverLlmApiKey) {
      throw new HttpException('Invalid LLM API Key', HttpStatus.UNAUTHORIZED);
    }

    const { worryText } = body;

    if (!worryText || typeof worryText !== 'string') {
      throw new HttpException('worryText is required', HttpStatus.BAD_REQUEST);
    }

    return this.personAppService.matchPersonsToWorry(worryText);
  }
}
