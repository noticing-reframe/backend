import { SessionRepository } from '../../domain/session/session.repository.js';
import type { Session } from '../../domain/session/session.interface.js';

export class SessionService {
  private repository: SessionRepository;

  constructor(repository?: SessionRepository) {
    this.repository = repository || new SessionRepository();
  }

  async createSession(userId: string, worryText: string): Promise<Session> {
    return this.repository.create({ userId, worryText });
  }

  async getSessionById(id: string): Promise<Session | null> {
    return this.repository.findById(id);
  }

  async getSessionsByUserId(userId: string): Promise<Session[]> {
    return this.repository.findByUserId(userId);
  }
}
