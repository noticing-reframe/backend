import Anthropic from '@anthropic-ai/sdk';
import type { CompletionRequest, CompletionResponse, StreamCompletionRequest } from '../interface/claude.interface.js';

export class ClaudeClient {
  private client: Anthropic;
  private defaultModel = 'claude-sonnet-4-20250514';

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const { messages, system, maxTokens, temperature, model = this.defaultModel } = request;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return {
      content: content.text,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async createStreamCompletion(request: StreamCompletionRequest): Promise<void> {
    const { messages, system, maxTokens, temperature, model = this.defaultModel, onChunk } = request;

    const stream = await this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        onChunk(event.delta.text);
      }
    }
  }
}
