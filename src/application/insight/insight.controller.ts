import { Router, Request, Response } from 'express';
import { InsightService } from './insight.service.js';
import { InsightRepository } from '../../domain/insight/insight.repository.js';

// 싱글톤 리포지토리 (인메모리 상태 유지를 위해)
const insightRepository = new InsightRepository();

export class InsightController {
  public router: Router;
  private service: InsightService;

  constructor() {
    this.router = Router();
    this.service = new InsightService(insightRepository);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', this.createInsight.bind(this));
    this.router.get('/user/:userId', this.getInsightsByUser.bind(this));
  }

  private async createInsight(req: Request, res: Response): Promise<void> {
    try {
      const {
        sessionId,
        personId,
        userId,
        worrySummary,
        insightText,
        personName,
        personAvatar,
        personColor,
      } = req.body;

      if (!sessionId || !personId || !userId || !worrySummary || !insightText) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
      }

      const insight = await this.service.createInsight({
        sessionId,
        personId,
        userId,
        worrySummary,
        insightText,
        personName: personName || '',
        personAvatar: personAvatar || '👤',
        personColor: personColor || '#c8b6ff',
      });

      res.status(201).json(insight);
    } catch (error) {
      console.error('createInsight error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getInsightsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const insights = await this.service.getInsightsByUserId(userId);
      res.json(insights);
    } catch (error) {
      console.error('getInsightsByUser error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
