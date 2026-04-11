export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: object;
}

export interface CompletionRequest {
  messages: Message[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export type ToolChoice =
  | { type: 'auto' }
  | { type: 'any' }
  | { type: 'tool'; name: string };

export interface ToolCompletionRequest extends CompletionRequest {
  tools: Tool[];
  toolChoice?: ToolChoice;
}

export interface StreamCompletionRequest extends CompletionRequest {
  onChunk: (text: string) => void;
}

export interface CompletionResponse {
  content: string;
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolCompletionResponse {
  toolUse: ToolUseBlock | null;
  content: string;
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
