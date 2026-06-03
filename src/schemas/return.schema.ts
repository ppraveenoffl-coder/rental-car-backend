import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Return extends Document {
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
  @Prop({ type: Number }) balanceCollected: number;
  @Prop({ type: String }) notes: string;
}

export const Returnschema = SchemaFactory.createForClass(Return);
