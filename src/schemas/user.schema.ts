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

  @Prop({ type: String, enum: [Role.ADMIN, Role.STAFF], default: Role.STAFF })
  role: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;
}

export const Userschema = SchemaFactory.createForClass(User);
