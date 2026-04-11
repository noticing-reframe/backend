import { Controller, Post, Body, Res, Headers, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import { ChatAppService } from './chat.service';
import type { ChatMessage } from '../../entity/conversation/message.entity';

interface ChatRequest {
  personId: string;
  userWorry: string;
  messages: ChatMessage[];
}

@Controller('chat')
export class ChatController {
  constructor(@Inject(ChatAppService) private readonly chatAppService: ChatAppService) {}

  @Post()
  async streamChat(
    @Headers('x-llm-api-key') llmApiKey: string,
    @Body() body: ChatRequest,
    @Res() res: Response
  ): Promise<void> {
    // LLM API Key 검증
    const serverLlmApiKey = process.env.LLM_API_KEY;
    if (!serverLlmApiKey || llmApiKey !== serverLlmApiKey) {
      throw new HttpException('Invalid LLM API Key', HttpStatus.UNAUTHORIZED);
    }

    const { personId, userWorry, messages } = body;

    if (!personId || !userWorry || !messages) {
      throw new HttpException(
        'personId, userWorry, and messages are required',
        HttpStatus.BAD_REQUEST
      );
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      await this.chatAppService.streamChat(personId, userWorry, messages, (chunk) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      });

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
        return;
      }

      if (errorMessage === 'Person not found') {
        throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
