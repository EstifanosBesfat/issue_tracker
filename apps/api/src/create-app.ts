import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

/** Local Nest process helper (`nest start`, tests). */
export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  await configureApp(app);
  return app;
}
