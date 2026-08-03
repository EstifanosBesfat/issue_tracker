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
  // Vercel serverless cannot serve swagger-ui static files from node_modules.
  // Load CSS/JS from a CDN so /api/docs works in production.
  const swaggerUiVersion = '5.17.14';
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customCssUrl: `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${swaggerUiVersion}/swagger-ui.min.css`,
    customJs: [
      `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${swaggerUiVersion}/swagger-ui-bundle.min.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${swaggerUiVersion}/swagger-ui-standalone-preset.min.js`,
    ],
    customSiteTitle: 'EthioTelecom Project Manager API',
  });
}

/** Local Nest process helper (`nest start`, tests). */
export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  await configureApp(app);
  return app;
}
