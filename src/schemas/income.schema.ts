import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

@Schema(baseSchemaOptions)
export class Income extends Document {
  @Prop({ type: String }) date: string;
  @Prop({ type: String }) bookingId: string;
  @Prop({ type: String }) customerId: string;
  @Prop({ type: Number }) amount: number;
  @Prop({ type: String }) paymentMode: string;
  @Prop({ type: String }) type: string;
}

export const Incomeschema = SchemaFactory.createForClass(Income);
