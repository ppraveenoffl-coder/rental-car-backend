import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Return extends Document {
  @Prop({ type: String, index: true }) tenantId: string;

  @Prop({ type: String }) bookingId: string;
  @Prop({ type: String }) returnDate: string;
  @Prop({ type: String }) returnTime: string;
  @Prop({ type: Number }) startKm: number;
  @Prop({ type: Number }) returnKm: number;
  @Prop({ type: Number }) extraKm: number;
  @Prop({ type: Number }) damageCharge: number;
  @Prop({ type: Number }) fuelDifference: number;
  @Prop({ type: Number }) fineAmount: number;
  @Prop({ type: Number }) tollAmount: number;
  @Prop({ type: Number }) lateFee: number; // late-return fee charged beyond the grace window
  @Prop({ type: Number }) delayHours: number; // hours returned past the agreed end time
  @Prop({ type: Number }) balanceCollected: number;
  @Prop({ type: String }) notes: string;
}

export const Returnschema = SchemaFactory.createForClass(Return);

Returnschema.index({ tenantId: 1, createdAt: -1 });
Returnschema.index({ tenantId: 1, bookingId: 1 });
