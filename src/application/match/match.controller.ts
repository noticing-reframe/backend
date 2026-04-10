import { Router, Request, Response } from 'express';
import { MatchService } from './match.service.js';

export class MatchController {
  public router: Router;
  private service: MatchService;

  constructor() {
    this.router = Router();
    this.service = new MatchService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', this.matchPersons.bind(this));
  }

  private async matchPersons(req: Request, res: Response): Promise<void> {
    try {
      const { worryText } = req.body;

      if (!worryText || typeof worryText !== 'string') {
        res.status(400).json({ error: 'worryText is required' });
        return;
      }

      const matches = await this.service.matchPersons(worryText);
      res.json(matches);
    } catch (error) {
      console.error('matchPersons error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
