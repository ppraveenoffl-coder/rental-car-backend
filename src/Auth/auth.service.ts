/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../schemas/user.schema';
import { loginDTO } from '../DTO/login.dto';
import { createUserDTO, updateUserDTO } from '../DTO/user.dto';
import { Role } from '../utils/enum/roles.enum';
import { TenantService } from '../services/tenant.service';
import { MailService } from '../services/mail.service';

// "siva@gmail.com" -> "s***@gmail.com" — a confirmation hint that doesn't expose
// the full address (or, for an unknown email, just masks what the user typed).
function maskEmail(email: string): string {
  const [local, domain] = String(email || '').split('@');
  if (!domain || !local) return '***';
  const head = local.length <= 1 ? local : local[0];
  return `${head}***@${domain}`;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(TenantService) private readonly tenants: TenantService,
    @Inject(MailService) private readonly mail: MailService,
  ) {}

  private signToken(user: any): string {
    return this.jwtService.sign(
      { id: user.id, role: user.role, tenantId: user.tenantId || null },
      {
        secret: process.env.JWT_SECRET || 'change-this-secret-in-production-7f3a9c2e',
        expiresIn: process.env.JWT_EXPIRES || '7d',
      },
    );
  }

  // POST /api/auth/login → { token, user }
  async signIn(payload: loginDTO): Promise<any> {
    const user = await this.userModel.findOne({
      email: (payload.email || '').toLowerCase().trim(),
    });
    if (!user || !user.active) {
      throw new UnauthorizedException({ message: 'Invalid credentials' });
    }
    // trim password to tolerate trailing spaces / autofill whitespace
    const ok = await bcrypt.compare((payload.password || '').trim(), user.password);
    if (!ok) {
      throw new UnauthorizedException({ message: 'Invalid credentials' });
    }
    const subscription = await this.tenants.summary(user.tenantId);
    return { token: this.signToken(user), user: { ...user.toJSON(), subscription } };
  }

  // Used by the JWT strategy: resolve the live user from the token payload and
  // return the same shape the legacy Express `req.user` exposed.
  async validateUser(payload: any): Promise<any> {
    const user = await this.userModel.findById(payload.id);
    if (!user || !user.active) {
      throw new UnauthorizedException({ message: 'Invalid or inactive user' });
    }
    // reject tokens issued before the last password change (logs out old sessions)
    if (user.passwordChangedAt && payload.iat && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new UnauthorizedException({ message: 'Session expired — please log in again' });
    }
    const subscription = await this.tenants.summary(user.tenantId);
    return { id: user.id, role: user.role, name: user.name, email: user.email, tenantId: user.tenantId || null, subscription };
  }

  // POST /api/auth/change-password — self-service. Requires the current password,
  // re-issues a fresh token, and invalidates every previously-issued token.
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<any> {
    const next = (newPassword || '').trim();
    if (next.length < 8) {
      throw new BadRequestException({ message: 'New password must be at least 8 characters.' });
    }
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException({ message: 'Invalid user' });
    const ok = await bcrypt.compare((currentPassword || '').trim(), user.password);
    if (!ok) throw new UnauthorizedException({ message: 'Current password is incorrect.' });

    user.password = await bcrypt.hash(next, 10);
    user.passwordChangedAt = new Date(Date.now() - 1000); // 1s back so the new token stays valid
    await user.save();
    return { ok: true, token: this.signToken(user) };
  }

  // POST /api/auth/forgot-password (public) — emails a single-use reset link.
  // Always returns a generic response so it can't be used to probe for emails.
  async forgotPassword(email: string): Promise<any> {
    const normalized = (email || '').toLowerCase().trim();
    const user = normalized ? await this.userModel.findOne({ email: normalized }) : null;
    if (user) {
      const raw = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      await user.save();
      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const link = `${appUrl}/reset-password?token=${raw}&email=${encodeURIComponent(user.email)}`;
      const sent = await this.mail.send(
        user.email,
        'Reset your password',
        `<p>Hello ${user.name || ''},</p>
         <p>We received a request to reset your password. This link expires in 30 minutes:</p>
         <p><a href="${link}">${link}</a></p>
         <p>If you didn't request this, you can safely ignore this email.</p>`,
        `Reset your password (expires in 30 min): ${link}`,
      );
      // dev fallback: print the link so the flow is testable without SMTP
      if (!sent) this.logger.warn(`Password reset link for ${user.email}: ${link}`);
    }
    // echo a masked hint of the destination so the user can confirm where the
    // link went, without confirming whether the account exists (anti-enumeration).
    return { ok: true, sentTo: maskEmail(user ? user.email : normalized) };
  }

  // POST /api/auth/reset-password (public) — consumes the token + sets a new password
  async resetPasswordWithToken(email: string, token: string, newPassword: string): Promise<any> {
    const next = (newPassword || '').trim();
    if (next.length < 8) throw new BadRequestException({ message: 'New password must be at least 8 characters.' });
    const normalized = (email || '').toLowerCase().trim();
    const hash = crypto.createHash('sha256').update(token || '').digest('hex');
    const user = await this.userModel.findOne({
      email: normalized,
      resetTokenHash: hash,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException({ message: 'This reset link is invalid or has expired.' });
    user.password = await bcrypt.hash(next, 10);
    user.passwordChangedAt = new Date(Date.now() - 1000);
    user.resetTokenHash = null;
    user.resetTokenExpiry = null;
    await user.save();
    return { ok: true };
  }

  // GET /api/auth/users (admin) — only this tenant's users
  async listUsers(tenantId: string): Promise<any> {
    return this.userModel.find({ tenantId }).sort({ createdAt: -1 });
  }

  // POST /api/auth/users (admin) — creates a user inside the admin's own tenant
  async createUser(body: createUserDTO, tenantId: string): Promise<any> {
    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      throw new BadRequestException({ message: 'name, email, password required' });
    }
    const exists = await this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      throw new ConflictException({ message: 'Email already in use' });
    }
    const hash = await bcrypt.hash(password, 10);
    return this.userModel.create({
      name,
      email,
      password: hash,
      role: role === Role.ADMIN ? Role.ADMIN : Role.STAFF,
      tenantId,
    });
  }

  // PUT /api/auth/users/:id (admin) — scoped to this tenant
  async updateUser(id: string, body: updateUserDTO, tenantId: string): Promise<any> {
    const update: any = {};
    if (body.name) update.name = body.name;
    if (body.role) update.role = body.role === Role.ADMIN ? Role.ADMIN : Role.STAFF;
    if (typeof body.active === 'boolean') update.active = body.active;
    if (body.password) {
      update.password = await bcrypt.hash(body.password, 10);
      update.passwordChangedAt = new Date(); // admin reset → force the user to re-login
    }

    const user = await this.userModel.findOneAndUpdate({ _id: id, tenantId }, update, { new: true });
    if (!user) throw new BadRequestException({ message: 'Not found' });
    return user;
  }

  // DELETE /api/auth/users/:id (admin) — scoped to this tenant
  async deleteUser(id: string, currentUserId: string, tenantId: string): Promise<any> {
    if (id === currentUserId) {
      throw new BadRequestException({ message: 'Cannot delete yourself' });
    }
    await this.userModel.findOneAndDelete({ _id: id, tenantId });
    return { id, deleted: true };
  }
}
