import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Maintenance extends Document {
  @Prop({ type: String, index: true }) tenantId: string;

  @Prop({ type: String }) serviceDate: string;
  @Prop({ type: String }) vehicleId: string;
  @Prop({ type: Number }) odometer: number;
  @Prop({ type: String }) serviceType: string;
  @Prop({ type: String }) vendor: string;
  @Prop({ type: Number }) amount: number;
  @Prop({ type: Number }) nextServiceKm: number;
  @Prop({ type: String }) nextServiceDate: string;
}

export const Maintenanceschema = SchemaFactory.createForClass(Maintenance);

Maintenanceschema.index({ tenantId: 1, createdAt: -1 });
Maintenanceschema.index({ tenantId: 1, vehicleId: 1 });
