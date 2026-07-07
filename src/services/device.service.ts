/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device } from '../schemas/device.schema';

@Injectable()
export class DeviceService {
  constructor(@InjectModel(Device.name) private readonly model: Model<Device>) {}

  // upsert by token — re-registering the same device just refreshes its owner
  async register(tenantId: string, userId: string, token: string, platform?: string): Promise<any> {
    if (!token) return null;
    await this.model.updateOne(
      { token },
      { $set: { tenantId, userId, platform: platform || 'unknown' } },
      { upsert: true },
    );
    return { ok: true };
  }

  async unregister(token: string): Promise<any> {
    await this.model.deleteOne({ token });
    return { ok: true };
  }

  async tokensForTenant(tenantId: string): Promise<string[]> {
    const rows = await this.model.find({ tenantId }, { token: 1 }).lean();
    return rows.map((r: any) => r.token).filter(Boolean);
  }

  async tokensForUser(userId: string): Promise<string[]> {
    const rows = await this.model.find({ userId }, { token: 1 }).lean();
    return rows.map((r: any) => r.token).filter(Boolean);
  }

  // remove tokens FCM reported as invalid/unregistered
  async removeTokens(tokens: string[]): Promise<void> {
    if (tokens.length) await this.model.deleteMany({ token: { $in: tokens } });
  }
}
