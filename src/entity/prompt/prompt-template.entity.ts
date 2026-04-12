export interface PromptTemplate {
  name: string;
  input_schema: object;
  output_schema: ToolDefinition | null;
  system_prompt: string;
  user_message_template?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: object;
}

export interface TemplateVariables {
  [key: string]: string | number | object[] | undefined;
}

// Match characters tool output
export interface MatchedCharacter {
  reason: string;
  score: number;
  index: number;
}

export interface MatchCharactersResult {
  matched: MatchedCharacter[];
}

// Generate character detail tool output
export interface GenerateCharacterDetailResult {
  conversation_hint: string[];
}
