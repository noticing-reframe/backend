import { Injectable, OnModuleInit } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type {
  CompletionRequest,
  CompletionResponse,
  StreamCompletionRequest,
  ToolCompletionRequest,
  ToolCompletionResponse,
} from '../../entity/claude/completion.entity';

const DEFAULT_MODEL = 'claude-3-haiku-20240307';
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.8;

@Injectable()
export class ClaudeService implements OnModuleInit {
  private client!: Anthropic;

  onModuleInit() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    this.client = new Anthropic({ apiKey });
    console.log('Claude 모듈 초기화 완료');
  }

  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: request.temperature ?? DEFAULT_TEMPERATURE,
      system: request.system,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === 'text');
    const content = textContent && 'text' in textContent ? textContent.text : '';

    return {
      content,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async createToolCompletion(request: ToolCompletionRequest): Promise<ToolCompletionResponse> {
    const response = await this.client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: request.temperature ?? 0.3,
      system: request.system,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      tools: request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema as Anthropic.Tool.InputSchema,
      })),
      tool_choice: request.toolChoice ?? { type: 'auto' },
    });

    const toolUseBlock = response.content.find((c) => c.type === 'tool_use');
    const textContent = response.content.find((c) => c.type === 'text');
    const content = textContent && 'text' in textContent ? textContent.text : '';

    return {
      toolUse: toolUseBlock && toolUseBlock.type === 'tool_use' ? {
        type: 'tool_use',
        id: toolUseBlock.id,
        name: toolUseBlock.name,
        input: toolUseBlock.input as Record<string, unknown>,
      } : null,
      content,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async createStreamCompletion(request: StreamCompletionRequest): Promise<void> {
    const stream = this.client.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: request.temperature ?? DEFAULT_TEMPERATURE,
      system: request.system,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        request.onChunk(event.delta.text);
      }
    }
  }
}
