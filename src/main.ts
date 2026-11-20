import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cabeceras de seguridad HTTP (nosniff, frameguard, HSTS, etc.).
  // CORP en cross-origin para que la PWA (otro origen) pueda mostrar las imágenes subidas.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Detrás del balanceador de Cloud Run la IP real del cliente viene en X-Forwarded-For
  app.set('trust proxy', 1);

  app.useStaticAssets(join(__dirname, '..', 'public', 'uploads'), {
    prefix: '/uploads',
    dotfiles: 'deny',
    index: false,
  });

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
