import { ClaudeClient } from './component/claude.client.js';

export class ClaudeModule {
  private static instance: ClaudeModule;
  public readonly client: ClaudeClient;

  private constructor(apiKey?: string) {
    this.client = new ClaudeClient(apiKey);
  }

  static initialize(apiKey?: string): ClaudeModule {
    if (!ClaudeModule.instance) {
      ClaudeModule.instance = new ClaudeModule(apiKey);
    }
    return ClaudeModule.instance;
  }

  static getInstance(): ClaudeModule {
    if (!ClaudeModule.instance) {
      throw new Error('ClaudeModule not initialized. Call initialize() first.');
    }
    return ClaudeModule.instance;
  }
}
