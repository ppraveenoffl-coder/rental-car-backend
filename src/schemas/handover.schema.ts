import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Handover extends Document {
  @Prop({ type: String, index: true }) tenantId: string;

  @Prop({ type: String }) bookingId: string;
  @Prop({ type: String }) date: string;
  @Prop({ type: Number }) odometer: number;
  @Prop({ type: String }) fuelLevel: string;
  @Prop({ type: String }) photo: string; // legacy single photo (kept for backward compatibility)
  @Prop({ type: [String], default: [] }) photos: string[]; // car current-condition photos (evidence)
  @Prop({ type: String }) licencePhoto: string; // captured driving licence (original)
  @Prop({ type: String }) idProof: string; // captured customer ID proof
  @Prop({ type: String }) selfie: string; // customer selfie
  @Prop({ type: String }) signature: string; // customer signature
  @Prop({ type: Object, default: {} }) checklist: Record<string, any>;
  @Prop({ type: Boolean, default: false }) termsAccepted: boolean;
  @Prop({ type: String }) notes: string;
}

export const Handoverschema = SchemaFactory.createForClass(Handover);

Handoverschema.index({ tenantId: 1, createdAt: -1 });
Handoverschema.index({ tenantId: 1, bookingId: 1 });
