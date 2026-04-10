export interface Insight {
  id: string;
  session_id: string;
  person_id: string;
  user_id: string;
  worry_summary: string;
  insight_text: string;
  person_name: string;
  person_avatar: string;
  person_color: string;
  created_at: string;
}

export interface CreateInsightInput {
  sessionId: string;
  personId: string;
  userId: string;
  worrySummary: string;
  insightText: string;
  personName: string;
  personAvatar: string;
  personColor: string;
}
