/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as admin from 'firebase-admin';

export interface PushResult {
  sent: number;
  failed: number;
  invalidTokens: string[];
}

// Sends FCM pushes via Firebase Admin. Configured with a service-account JSON
// (env FIREBASE_SERVICE_ACCOUNT = path to the file OR the raw JSON). When not
// configured it degrades gracefully — logs instead of sending — so the rest of
// the app and the scheduler keep working.
@Injectable()
export class PushService {
  private readonly logger = new Logger('Push');
  private ready = false;

  constructor() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT not set — push notifications are logged, not sent.');
      return;
    }
    try {
      const json = fs.existsSync(raw) ? JSON.parse(fs.readFileSync(raw, 'utf8')) : JSON.parse(raw);
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(json) });
      }
      this.ready = true;
      this.logger.log('Firebase Admin initialised — push notifications enabled.');
    } catch (e: any) {
      this.logger.error(`Failed to init Firebase Admin: ${e?.message || e}`);
    }
  }

  get configured(): boolean {
    return this.ready;
  }

  async sendToTokens(tokens: string[], title: string, body: string, data: Record<string, string> = {}): Promise<PushResult> {
    const unique = Array.from(new Set(tokens.filter(Boolean)));
    if (!this.ready) {
      this.logger.warn(`[not sent] "${title}" → ${unique.length} device(s): ${body}`);
      return { sent: 0, failed: unique.length, invalidTokens: [] };
    }
    if (unique.length === 0) return { sent: 0, failed: 0, invalidTokens: [] };

    const res = await admin.messaging().sendEachForMulticast({
      tokens: unique,
      notification: { title, body },
      data,
      android: { priority: 'high' },
    });

    const invalidTokens: string[] = [];
    res.responses.forEach((r, i) => {
      const code = (r.error as any)?.code || '';
      if (!r.success && (code.includes('registration-token-not-registered') || code.includes('invalid-argument'))) {
        invalidTokens.push(unique[i]);
      }
    });
    return { sent: res.successCount, failed: res.failureCount, invalidTokens };
  }
}
