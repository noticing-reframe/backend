import { Router, Request, Response } from 'express';
import { ChatService } from './chat.service.js';

export class ChatController {
  public router: Router;
  private service: ChatService;

  constructor() {
    this.router = Router();
    this.service = new ChatService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', this.streamChat.bind(this));
  }

  private async streamChat(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, personId, messages } = req.body;

      if (!sessionId || !personId || !messages) {
        res.status(400).json({ error: 'sessionId, personId, and messages are required' });
        return;
      }

      // SSE 헤더 설정
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      await this.service.streamChat(personId, messages, (chunk) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      });

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('streamChat error:', error);

      // 이미 헤더를 보낸 경우
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
        return;
      }

      if (error.message === 'Person not found') {
        res.status(404).json({ error: 'Person not found', message: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
