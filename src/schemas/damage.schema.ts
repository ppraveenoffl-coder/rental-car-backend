import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Damage extends Document {
  @Prop({ type: String, index: true }) tenantId: string;

  @Prop({ type: String }) incidentDate: string;
  @Prop({ type: String }) vehicleId: string;
  @Prop({ type: String }) customerId: string;
  @Prop({ type: String }) description: string;
  @Prop({ type: String }) photo: string;
  @Prop({ type: Number }) repairCost: number;
  @Prop({ type: Number }) insuranceClaim: number;
  @Prop({ type: Number }) customerLiability: number;
}

export const Damageschema = SchemaFactory.createForClass(Damage);

Damageschema.index({ tenantId: 1, createdAt: -1 });
Damageschema.index({ tenantId: 1, vehicleId: 1 });
