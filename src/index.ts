import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ClaudeModule } from './infrastructure/claude/claude.module.js';
import { PersonController } from './application/person/person.controller.js';
import { SessionController } from './application/session/session.controller.js';
import { MatchController } from './application/match/match.controller.js';
import { ChatController } from './application/chat/chat.controller.js';
import { InsightController } from './application/insight/insight.controller.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Claude 모듈 초기화
ClaudeModule.initialize();

// 미들웨어
app.use(cors());
app.use(express.json());

// 헬스 체크
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API 라우터
const personController = new PersonController();
const sessionController = new SessionController();
const matchController = new MatchController();
const chatController = new ChatController();
const insightController = new InsightController();

app.use('/api/persons', personController.router);
app.use('/api/sessions', sessionController.router);
app.use('/api/match', matchController.router);
app.use('/api/chat', chatController.router);
app.use('/api/insights', insightController.router);

// 에러 핸들러
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
