export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: Message[];
  maxTokens: number;
  system?: string;
  temperature?: number;
  model?: string;
}

export interface CompletionResponse {
  content: string;
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface StreamCompletionRequest {
  messages: Message[];
  maxTokens: number;
  system?: string;
  temperature?: number;
  model?: string;
  onChunk: (text: string) => void;
}
