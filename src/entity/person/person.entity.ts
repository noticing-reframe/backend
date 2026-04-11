export interface BackgroundStoryItem {
  text: string;
  link?: string;
}

export interface Person {
  character_id: string;
  character_name: string;
  character_tagline: string;
  character_background: string;
  character_tone: string;
  dialogue_example: string;
  character_category: string;
  student_attribute: string;
  source_persona: string;
  reason: string;
  background_story: BackgroundStoryItem[];
  profile_image: number;
  tags?: string[];
}

export interface PersonMatch {
  character_id: string;
  character_name: string;
  character_tagline: string;
  character_background: string;
  reason: string;
  conversation_hint: string;
  profile_image: number;
  tags: string[];
}
