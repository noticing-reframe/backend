import { Router, Request, Response } from 'express';
import { SessionService } from './session.service.js';
import { SessionRepository } from '../../domain/session/session.repository.js';

// 싱글톤 리포지토리 (인메모리 상태 유지를 위해)
const sessionRepository = new SessionRepository();

export class SessionController {
  public router: Router;
  private service: SessionService;

  constructor() {
    this.router = Router();
    this.service = new SessionService(sessionRepository);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', this.createSession.bind(this));
    this.router.get('/user/:userId', this.getSessionsByUser.bind(this));
  }

  private async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { userId, worryText } = req.body;

      if (!userId || !worryText) {
        res.status(400).json({ error: 'userId and worryText are required' });
        return;
      }

      const session = await this.service.createSession(userId, worryText);
      res.status(201).json(session);
    } catch (error) {
      console.error('createSession error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getSessionsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const sessions = await this.service.getSessionsByUserId(userId);
      res.json(sessions);
    } catch (error) {
      console.error('getSessionsByUser error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// 세션 리포지토리 인스턴스 export (chat에서 사용)
export { sessionRepository };
