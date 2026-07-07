/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from '../schemas/settings.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Settings.name) private readonly model: Model<Settings>) {}

  // GET /api/settings — auto-create an empty doc for this tenant the first time.
  async read(tenantId: string): Promise<any> {
    let doc = await this.model.findOne({ tenantId });
    if (!doc) doc = await this.model.create({ tenantId });
    return doc;
  }

  // PUT /api/settings — upsert this tenant's single settings document.
  async update(body: any, tenantId: string): Promise<any> {
    const data = { ...body };
    delete data.id;
    delete data._id;
    delete data.tenantId;
    let doc = await this.model.findOne({ tenantId });
    if (!doc) {
      doc = await this.model.create({ ...data, tenantId });
    } else {
      doc.set(data);
      await doc.save();
    }
    return doc;
  }
}
