import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Expense extends Document {
  @Prop({ type: String, index: true }) tenantId: string;

  @Prop({ type: String }) date: string;
  @Prop({ type: String }) vehicleId: string;
  @Prop({ type: String }) type: string;
  @Prop({ type: Number }) amount: number;
}

export const Expenseschema = SchemaFactory.createForClass(Expense);

Expenseschema.index({ tenantId: 1, createdAt: -1 });
Expenseschema.index({ tenantId: 1, date: 1 });
Expenseschema.index({ tenantId: 1, vehicleId: 1 });
