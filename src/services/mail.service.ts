/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// Thin email sender. Configured via SMTP_* env vars; when none are set it
// degrades gracefully (logs instead of sending) so the reset flow still works
// in development — the link is printed to the server console.
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
    }
  }

  get configured(): boolean {
    return !!this.transporter;
  }

  // returns true if actually sent; false if SMTP isn't configured or sending failed
  // (never throws — callers fall back to logging the link).
  async send(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`SMTP not configured — "${subject}" email to ${to} was not sent.`);
      return false;
    }
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@app.com';
    try {
      await this.transporter.sendMail({ from, to, subject, html, text });
      return true;
    } catch (e: any) {
      this.logger.error(`Failed to send "${subject}" email to ${to}: ${e?.message || e}`);
      return false;
    }
  }
}
