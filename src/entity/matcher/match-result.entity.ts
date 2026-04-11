export interface MatchResult {
  index: number;
  similarity: number;
  matchedTerms: string[];
}

export interface DocumentInput {
  text: string;
  attributes: string[];
}
