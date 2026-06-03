import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Customer extends Document {
  @Prop({ type: String }) name: string;
  @Prop({ type: String }) mobile: string;
  @Prop({ type: String }) address: string;
  @Prop({ type: String }) aadhaar: string;
  @Prop({ type: String }) license: string;
  @Prop({ type: String }) emergencyContact: string;
  @Prop({ type: Boolean, default: false }) blacklist: boolean;
  @Prop({ type: String }) selfie: string;
  @Prop({ type: String }) signature: string;

  // free-form array of { id, name, type, status, file } managed by the client
  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  documents: any[];
}

export const Customerschema = SchemaFactory.createForClass(Customer);
