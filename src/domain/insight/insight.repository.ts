import type { Insight, CreateInsightInput } from './insight.interface.js';

export class InsightRepository {
  private insights: Map<string, Insight> = new Map();

  async create(input: CreateInsightInput): Promise<Insight> {
    const insight: Insight = {
      id: 'insight_' + Math.random().toString(36).slice(2, 11),
      session_id: input.sessionId,
      person_id: input.personId,
      user_id: input.userId,
      worry_summary: input.worrySummary,
      insight_text: input.insightText,
      person_name: input.personName,
      person_avatar: input.personAvatar,
      person_color: input.personColor,
      created_at: new Date().toISOString(),
    };
    this.insights.set(insight.id, insight);
    return insight;
  }

  async findByUserId(userId: string): Promise<Insight[]> {
    return Array.from(this.insights.values())
      .filter((i) => i.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}
