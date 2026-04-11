import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

const server = express();

let app: any;

async function bootstrap() {
  if (!app) {
    const expressAdapter = new ExpressAdapter(server);
    app = await NestFactory.create(AppModule, expressAdapter);
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-LLM-API-Key', 'Authorization'],
      credentials: true,
    });
    // Vercel 라우트가 이미 /api/* 이므로 prefix 제거
    await app.init();
  }
  return server;
}

export default async (req: Request, res: Response) => {
  // CORS preflight 처리
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-LLM-API-Key, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const instance = await bootstrap();
  instance(req, res);
};
