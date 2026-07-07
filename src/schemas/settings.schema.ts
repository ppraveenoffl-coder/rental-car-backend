import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Settings extends Document {
  @Prop({ type: String, index: true }) tenantId: string;

  @Prop({ type: String }) companyName: string;
  @Prop({ type: Number }) defaultFreeKm: number;
  @Prop({ type: Number }) defaultExtraKmCharge: number;
  @Prop({ type: Number }) defaultSecurityDeposit: number;
  @Prop({ type: Number }) fuelChargePerLevel: number;
  @Prop({ type: Number }) serviceIntervalKm: number;
  @Prop({ type: Number }) expiryAlertDays: number;
  @Prop({ type: [String] }) terms: string[];
}

export const Settingsschema = SchemaFactory.createForClass(Settings);

// one settings document per tenant
Settingsschema.index({ tenantId: 1 }, { unique: true });
