import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

// CORS: in dev, reflect localhost AND private-LAN origins (any port), so the
// app works from other devices on the same network (phone, another PC).
// Set CLIENT_ORIGIN in .env to lock this down in production.
const LAN_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CLIENT_ORIGIN?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl / same-origin / mobile apps
      if (!allowedOrigins || allowedOrigins.includes('*')) return cb(null, true);
      if (allowedOrigins.includes(origin) || LAN_ORIGIN.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });

  // large limit for base64 document/photo uploads (multiple images)
  app.use(json({ limit: '40mb' }));
  app.use(urlencoded({ extended: true, limit: '40mb' }));

  // keep the legacy contract: everything is served under /api
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`✓ API running on http://localhost:${port}/api`);
}

bootstrap();
