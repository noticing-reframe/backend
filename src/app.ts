import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module';

const server = express();

let app: any;

async function bootstrap() {
  if (!app) {
    const expressAdapter = new ExpressAdapter(server);
    app = await NestFactory.create(AppModule, expressAdapter);
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-LLM-API-Key', 'Authorization'],
    });
    app.setGlobalPrefix('api');
    await app.init();
  }
  return server;
}

// Vercel serverless handler
export default async (req: Request, res: Response) => {
  const instance = await bootstrap();
  instance(req, res);
};

// Local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = process.env.PORT || 4000;
  bootstrap().then((server) => {
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
}
