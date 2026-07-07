import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../utils/enum/roles.enum';
import { userSchemaOptions } from '../utils/helper/schema-options';

@Schema(userSchemaOptions)
export class User extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, enum: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF], default: Role.STAFF })
  role: string;

  // the tenant this user belongs to. null only for the SUPERADMIN (SaaS operator).
  @Prop({ type: String, index: true, default: null })
  tenantId: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  // any token issued before this moment is rejected — invalidates old sessions
  // whenever the password is changed or reset.
  @Prop({ type: Date })
  passwordChangedAt: Date;

  // forgot-password: SHA-256 of the emailed reset token + its expiry (single use)
  @Prop({ type: String, default: null })
  resetTokenHash: string;

  @Prop({ type: Date, default: null })
  resetTokenExpiry: Date;
}

export const Userschema = SchemaFactory.createForClass(User);
