import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  ConsoleLogger,
  ValidationPipe,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // En producción, logs JSON: Cloud Logging los interpreta con su severidad
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({ json: process.env.NODE_ENV === 'production' }),
  });

  // Cabeceras de seguridad HTTP (nosniff, frameguard, HSTS, etc.).
  // CORP en cross-origin para que la PWA (otro origen) pueda mostrar las imágenes subidas.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // La IP real del cliente viene en X-Forwarded-For. Saltos de proxy de confianza:
  // 1 = solo Cloud Run (o local); 2 = balanceador HTTPS externo + Cloud Run.
  // Debe coincidir con la topología real, si no el rate limit usaría la IP del balanceador.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

  // Sin GCS_BUCKET (desarrollo) las imágenes se guardan en disco y se sirven desde aquí
  if (!process.env.GCS_BUCKET) {
    app.useStaticAssets(join(__dirname, '..', 'public', 'uploads'), {
      prefix: '/uploads',
      dotfiles: 'deny',
      index: false,
    });
  }

  // Cloud Run envía SIGTERM antes de detener la instancia: cerrar conexiones a la BD limpiamente
  app.enableShutdownHooks();

  // CORS restringido a los orígenes de la PWA (lista separada por comas)
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
