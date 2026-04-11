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
    app.setGlobalPrefix('api');
    await app.init();
  }
  return server;
}

export default async (req: Request, res: Response) => {
  const instance = await bootstrap();
  instance(req, res);
};
