import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function normalizeOrigin(raw: string): string {
  const url = raw.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
    return `http://${url}`;
  }
  return `https://${url}`;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendUrl = normalizeOrigin(
    process.env.FRONTEND_URL ?? 'http://localhost:5173',
  );
  app.enableCors({ origin: frontendUrl });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
