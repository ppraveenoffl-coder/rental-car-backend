import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Vehicle extends Document {
  @Prop({ type: String }) vehicleNo: string;
  @Prop({ type: String }) vehicleCode: string; // e.g. V001
  @Prop({ type: String }) brand: string; // e.g. Maruti Suzuki
  @Prop({ type: String }) rcBookNo: string;
  @Prop({ type: String }) insNo: string; // insurance policy number
  @Prop({ type: String }) name: string;
  @Prop({ type: String }) type: string;
  @Prop({ type: Number }) dailyRent: number;
  @Prop({ type: Number }) freeKmPerDay: number;
  @Prop({ type: Number }) extraKmCharge: number;
  @Prop({ type: String }) insuranceExpiry: string;
  @Prop({ type: String }) fcExpiry: string;
  @Prop({ type: String }) pollutionExpiry: string;
  @Prop({ type: String, default: 'Available' }) status: string;
}

export const Vehicleschema = SchemaFactory.createForClass(Vehicle);
