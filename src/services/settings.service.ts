/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from '../schemas/settings.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Settings.name) private readonly model: Model<Settings>) {}

  // GET /api/settings — auto-create an empty doc the first time.
  async read(): Promise<any> {
    let doc = await this.model.findOne();
    if (!doc) doc = await this.model.create({});
    return doc;
  }

  // PUT /api/settings — upsert the single settings document.
  async update(body: any): Promise<any> {
    const data = { ...body };
    delete data.id;
    delete data._id;
    let doc = await this.model.findOne();
    if (!doc) {
      doc = await this.model.create(data);
    } else {
      doc.set(data);
      await doc.save();
    }
    return doc;
  }
}
