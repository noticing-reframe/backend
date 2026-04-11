export interface ChatMessage {
  role: 'user' | 'person';
  text: string;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}
