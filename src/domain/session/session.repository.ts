import type { Session, CreateSessionInput } from './session.interface.js';

export class SessionRepository {
  private sessions: Map<string, Session> = new Map();

  async create(input: CreateSessionInput): Promise<Session> {
    const session: Session = {
      id: 'session_' + Math.random().toString(36).slice(2, 11),
      user_id: input.userId,
      worry_text: input.worryText,
      created_at: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findById(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter((s) => s.user_id === userId);
  }
}
