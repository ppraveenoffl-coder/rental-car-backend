import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

// A registered push target — one FCM token per user device, scoped to a tenant.
@Schema(baseSchemaOptions)
export class Device extends Document {
  @Prop({ type: String, index: true }) tenantId: string;
  @Prop({ type: String, index: true }) userId: string;
  @Prop({ type: String, required: true, unique: true }) token: string;
  @Prop({ type: String }) platform: string; // android | ios
}

export const Deviceschema = SchemaFactory.createForClass(Device);
Deviceschema.index({ tenantId: 1 });
