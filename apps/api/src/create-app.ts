import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import express from 'express';
import { AppModule } from './app.module';

function getCorsOrigins(): string | string[] {
  const origins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (!origins.includes('http://localhost:3000')) {
    origins.push('http://localhost:3000');
  }

  return origins.length === 1 ? origins[0] : origins;
}

export async function configureApp(app: INestApplication): Promise<void> {
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: getCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EthioTelecom Project Manager API')
    .setDescription('REST API for project and task management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

/** Local / long-running Nest process (`nest start`, `node dist/main.js`). */
export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  await configureApp(app);
  return app;
}

/**
 * Cached Express app for Vercel serverless.
 * Nest is initialized once per warm isolate, then reused across invocations.
 */
let cachedExpressApp: Express | undefined;
let initPromise: Promise<Express> | undefined;

export async function getVercelExpressApp(): Promise<Express> {
  if (cachedExpressApp) {
    return cachedExpressApp;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const expressApp = express();
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
        { bodyParser: true },
      );
      await configureApp(app);
      await app.init();
      cachedExpressApp = expressApp;
      return expressApp;
    })();
  }

  return initPromise;
}
