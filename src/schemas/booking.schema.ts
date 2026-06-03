import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Booking extends Document {
  @Prop({ type: String }) bookingNo: string;
  @Prop({ type: String }) customerId: string;
  @Prop({ type: String }) vehicleId: string;
  @Prop({ type: String }) fromDate: string;
  @Prop({ type: String }) toDate: string;
  @Prop({ type: String }) startTime: string; // trip start time e.g. "09:00"
  @Prop({ type: String }) endTime: string; // trip reached / return time e.g. "18:30"
  @Prop({ type: String }) destination: string; // e.g. "Trichy"
  @Prop({ type: Number }) startKm: number; // odometer at trip start
  // endKm is NOT stored on the booking — the trip hasn't ended at booking time.
  // The end odometer is captured at Vehicle Return (see Return.returnKm).
  @Prop({ type: Number }) rentPerDay: number; // suggested daily rate (from vehicle)
  @Prop({ type: Number }) fullAmount: number; // total agreed lease amount for the trip
  @Prop({ type: Number }) paidAmount: number; // amount received at booking time
  @Prop({ type: Number }) advance: number; // legacy (kept for backward compatibility)
  @Prop({ type: Number }) securityDeposit: number; // legacy
  @Prop({ type: String }) source: string; // enquiry source (WhatsApp/Call/Website/Walk-in/Referral)
  @Prop({ type: String }) followUpDate: string; // follow-up date while the booking is at Enquiry stage
  @Prop({ type: String, default: 'Enquiry' }) status: string;
  @Prop({ type: String }) notes: string;
}

export const Bookingschema = SchemaFactory.createForClass(Booking);
