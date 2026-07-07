/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Tenant } from '../schemas/tenant.schema';
import { User } from '../schemas/user.schema';
import { Role } from '../utils/enum/roles.enum';

// plan → length of the subscription, in minutes.
// `test_1h` / `test_12h` are short-lived plans for exercising the renew/expiry flow.
export const PLAN_MINUTES: Record<string, number> = {
  test_1h: 60,
  test_12h: 12 * 60,
  trial: 14 * 24 * 60,
  month: 30 * 24 * 60,
  quarter: 90 * 24 * 60,
  half: 180 * 24 * 60,
  year: 365 * 24 * 60,
};

// how long before expiry the tenant starts seeing the "ending soon" notice.
// Real plans warn 5 days out; the test plans warn proportionally so the banner
// is actually visible during a short test run.
const DEFAULT_WARN_MINUTES = 5 * 24 * 60; // 5 days
export const PLAN_WARN_MINUTES: Record<string, number> = {
  test_1h: 10, // last 10 minutes
  test_12h: 60, // last hour
};
const warnMinutes = (plan: string) => PLAN_WARN_MINUTES[plan] ?? DEFAULT_WARN_MINUTES;

const addMinutes = (from: Date, mins: number) => new Date(from.getTime() + mins * 60_000);

// `expiresAt` may be a legacy date-only string (active through the end of that day)
// or a full ISO datetime (used by hour-precision test plans). Resolve both to ms.
const expiryMs = (expiresAt?: string): number => {
  if (!expiresAt) return 0;
  const s = expiresAt.length === 10 ? `${expiresAt}T23:59:59.999Z` : expiresAt;
  return new Date(s).getTime();
};
export const isExpired = (expiresAt?: string): boolean => !expiresAt || expiryMs(expiresAt) < Date.now();

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<Tenant>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  // list all tenants (super-admin) with their owner-user count
  async list(): Promise<any> {
    const tenants = await this.tenantModel.find().sort({ createdAt: -1 }).lean();
    const counts = await this.userModel.aggregate([{ $group: { _id: '$tenantId', n: { $sum: 1 } } }]);
    const byTenant: Record<string, number> = {};
    counts.forEach((c: any) => (byTenant[String(c._id)] = c.n));
    return tenants.map((t: any) => ({
      ...t,
      id: String(t._id),
      users: byTenant[String(t._id)] || 0,
      expired: isExpired(t.expiresAt),
    }));
  }

  // create a tenant + its owner ADMIN user in one step
  async create(body: any): Promise<any> {
    const name = (body?.name || '').trim();
    const ownerName = (body?.ownerName || '').trim();
    const ownerEmail = (body?.ownerEmail || '').toLowerCase().trim();
    const password = (body?.password || '').trim();
    const plan = PLAN_MINUTES[body?.plan] ? body.plan : 'month';
    if (!name || !ownerEmail || !password) {
      throw new BadRequestException({ message: 'Business name, owner email and password are required.' });
    }
    const exists = await this.userModel.findOne({ email: ownerEmail });
    if (exists) throw new ConflictException({ message: 'That owner email is already in use.' });

    const now = new Date();
    const tenant = await this.tenantModel.create({
      name,
      ownerName,
      ownerEmail,
      mobile: (body?.mobile || '').trim(),
      plan,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: addMinutes(now, PLAN_MINUTES[plan]).toISOString(),
    });

    const hash = await bcrypt.hash(password, 10);
    await this.userModel.create({
      name: ownerName || name,
      email: ownerEmail,
      password: hash,
      role: Role.ADMIN,
      tenantId: tenant.id,
    });

    return { ...tenant.toJSON(), users: 1 };
  }

  // extend / renew a subscription by one plan period (manual activation)
  async extend(id: string, plan: string): Promise<any> {
    if (!PLAN_MINUTES[plan]) throw new BadRequestException({ message: 'Unknown plan.' });
    const tenant = await this.tenantModel.findById(id);
    if (!tenant) throw new NotFoundException({ message: 'Tenant not found.' });
    const now = new Date();
    // extend from whichever is later: now, or the current (unexpired) expiry
    const base = !isExpired(tenant.expiresAt) ? new Date(expiryMs(tenant.expiresAt)) : now;
    tenant.plan = plan;
    tenant.status = 'active';
    tenant.expiresAt = addMinutes(base, PLAN_MINUTES[plan]).toISOString();
    tenant.renewalRequestedAt = null; // request handled — clear the super-admin notification
    if (!tenant.startedAt) tenant.startedAt = now.toISOString();
    await tenant.save();
    return tenant.toJSON();
  }

  // a tenant raises a renewal request (works even after the plan has lapsed).
  // Surfaces to the super-admin on the Subscribers page; cleared when extended.
  async requestRenewal(tenantId: string): Promise<any> {
    if (!tenantId) throw new BadRequestException({ message: 'No tenant on this account.' });
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException({ message: 'Tenant not found.' });
    if (!tenant.renewalRequestedAt) {
      tenant.renewalRequestedAt = new Date().toISOString();
      await tenant.save();
    }
    return { ok: true, renewalRequestedAt: tenant.renewalRequestedAt };
  }

  // super-admin resets the subscriber owner's login password (no email needed)
  async resetOwnerPassword(id: string, password: string): Promise<any> {
    const next = (password || '').trim();
    if (next.length < 8) throw new BadRequestException({ message: 'Password must be at least 8 characters.' });
    const tenant = await this.tenantModel.findById(id);
    if (!tenant) throw new NotFoundException({ message: 'Tenant not found.' });
    // the owner = the admin user on this tenant (prefer the registered owner email)
    const owner =
      (tenant.ownerEmail && (await this.userModel.findOne({ tenantId: id, email: tenant.ownerEmail }))) ||
      (await this.userModel.findOne({ tenantId: id, role: Role.ADMIN }));
    if (!owner) throw new NotFoundException({ message: 'Owner login not found for this tenant.' });
    owner.password = await bcrypt.hash(next, 10);
    owner.passwordChangedAt = new Date(); // force the owner to re-login with the new password
    await owner.save();
    return { ok: true, ownerEmail: owner.email };
  }

  // suspend / reactivate
  async setStatus(id: string, status: string): Promise<any> {
    const tenant = await this.tenantModel.findByIdAndUpdate(
      id,
      { status: status === 'suspended' ? 'suspended' : 'active' },
      { new: true },
    );
    if (!tenant) throw new NotFoundException({ message: 'Tenant not found.' });
    return tenant.toJSON();
  }

  // compact subscription status attached to req.user (drives the renew gate)
  async summary(tenantId: string): Promise<any> {
    if (!tenantId) return null;
    const t: any = await this.tenantModel.findById(tenantId).lean();
    if (!t)
      return { name: null, plan: null, status: 'missing', expiresAt: null, expired: true, suspended: false, expiringSoon: false };
    const suspended = t.status === 'suspended';
    const expired = isExpired(t.expiresAt);
    const msLeft = expiryMs(t.expiresAt) - Date.now();
    return {
      name: t.name,
      plan: t.plan,
      status: t.status,
      expiresAt: t.expiresAt,
      suspended,
      expired,
      // within the plan's warning window — drives the in-app "renew soon" notice
      expiringSoon: !expired && !suspended && msLeft <= warnMinutes(t.plan) * 60_000,
      renewalRequestedAt: t.renewalRequestedAt || null, // tenant already asked to renew
    };
  }

  // used by public routes — confirm a tenant exists, is active and not expired
  async assertActive(tenantId: string): Promise<void> {
    if (!tenantId) throw new ForbiddenException({ message: 'Invalid form link.' });
    const tenant: any = await this.tenantModel.findById(tenantId).lean();
    if (!tenant || tenant.status === 'suspended' || isExpired(tenant.expiresAt)) {
      throw new ForbiddenException({ message: 'This registration link is no longer active.' });
    }
  }
}
