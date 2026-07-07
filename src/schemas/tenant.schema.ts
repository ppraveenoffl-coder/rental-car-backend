import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { baseSchemaOptions } from '../utils/helper/schema-options';

// A Tenant = one subscribing business (e.g. Siva's rental company). All business
// data is stamped with the tenant's id and every query is scoped to it.
@Schema(baseSchemaOptions)
export class Tenant extends Document {
  @Prop({ type: String, required: true }) name: string; // business / company name
  @Prop({ type: String }) ownerName: string;
  @Prop({ type: String }) ownerEmail: string;
  @Prop({ type: String }) mobile: string;

  // subscription — plan is a duration key; expiresAt drives access (Phase 2 guard)
  @Prop({ type: String, default: 'trial' }) plan: string; // trial | month | quarter | half | year
  @Prop({ type: String, default: 'active' }) status: string; // active | suspended
  @Prop({ type: String }) startedAt: string; // ISO date the current plan started
  @Prop({ type: String }) expiresAt: string; // ISO date the subscription lapses
  @Prop({ type: String, default: null }) renewalRequestedAt: string; // ISO datetime the tenant asked to renew (cleared on extend)
  @Prop({ type: String }) notes: string;
}

export const Tenantschema = SchemaFactory.createForClass(Tenant);
