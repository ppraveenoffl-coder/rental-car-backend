import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Vehicle extends Document {
  @Prop({ type: String, index: true }) tenantId: string;

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
  @Prop({ type: String }) gpsDeviceId?: string;
  @Prop({ type: String }) gpsProvider?: string;
  @Prop({ type: Object }) liveLocation?: {
    lat: number;
    lng: number;
    speed: number;
    ignition: boolean;
    lastUpdate: string;
  };
}

export const Vehicleschema = SchemaFactory.createForClass(Vehicle);

Vehicleschema.index({ tenantId: 1, createdAt: -1 });
Vehicleschema.index({ tenantId: 1, status: 1 });
