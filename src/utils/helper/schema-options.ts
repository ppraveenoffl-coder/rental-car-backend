import { SchemaOptions } from '@nestjs/mongoose';

// Shared schema options so the API stays byte-compatible with the legacy
// Express backend: timestamps on, drop __v, expose `id` instead of `_id`.
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v; // strip version key even on docs written by the legacy backend
      return ret;
    },
  },
};

// Same as above but also strips the password hash (used by the User schema).
export const userSchemaOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v; // strip version key even on docs written by the legacy backend
      delete ret.password;
      return ret;
    },
  },
};
