export interface Session {
  id: string;
  user_id: string;
  worry_text: string;
  created_at: string;
}

export interface CreateSessionInput {
  userId: string;
  worryText: string;
}
