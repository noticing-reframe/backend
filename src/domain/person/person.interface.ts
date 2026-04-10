export interface Person {
  id: string;
  name: string;
  type: '위인' | '일반인' | '가상인물';
  type_color: string;
  emoji: string;
  one_liner: string;
  key_insight?: string;
  reason?: string;
  system_prompt: string;
  background_story: string;
}

export interface PersonMatch {
  id: string;
  name: string;
  type: '위인' | '일반인' | '가상인물';
  type_color: string;
  emoji: string;
  one_liner: string;
  reason: string;
}
