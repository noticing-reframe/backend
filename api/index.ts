import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

const server = express();

let app: any;
let bootstrapError: Error | null = null;

async function bootstrap() {
  if (bootstrapError) {
    throw bootstrapError;
  }
  if (!app) {
    try {
      const expressAdapter = new ExpressAdapter(server);
      app = await NestFactory.create(AppModule, expressAdapter, {
        logger: ['error', 'warn'],
      });
      app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'X-LLM-API-Key', 'Authorization'],
        credentials: false,
      });
      await app.init();
    } catch (error) {
      bootstrapError = error as Error;
      throw error;
    }
  }
  return server;
}

export default async (req: Request, res: Response) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-LLM-API-Key, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const instance = await bootstrap();
    instance(req, res);
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
