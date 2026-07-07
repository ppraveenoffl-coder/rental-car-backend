import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Commission extends Document {
  @Prop({ type: String, index: true }) tenantId: string;

  @Prop({ type: String }) date: string;
  @Prop({ type: String }) vehicleName: string;
  @Prop({ type: String }) vehicleOwner: string;
  @Prop({ type: Number }) amount: number;
}

export const Commissionschema = SchemaFactory.createForClass(Commission);

Commissionschema.index({ tenantId: 1, createdAt: -1 });
Commissionschema.index({ tenantId: 1, date: 1 });
