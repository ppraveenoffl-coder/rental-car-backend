/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User } from '../schemas/user.schema';
import { Tenant } from '../schemas/tenant.schema';
import { Customer } from '../schemas/customer.schema';
import { Vehicle } from '../schemas/vehicle.schema';
import { Booking } from '../schemas/booking.schema';
import { Handover } from '../schemas/handover.schema';
import { Return } from '../schemas/return.schema';
import { Damage } from '../schemas/damage.schema';
import { Maintenance } from '../schemas/maintenance.schema';
import { Income } from '../schemas/income.schema';
import { Expense } from '../schemas/expense.schema';
import { Settings } from '../schemas/settings.schema';
import { Role } from '../utils/enum/roles.enum';

// Runs once on startup. Idempotent — it only acts on data that predates
// multi-tenancy, so it's safe to keep on every boot.
@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Bootstrap');

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Tenant.name) private readonly tenants: Model<Tenant>,
    @InjectModel(Customer.name) private readonly customers: Model<Customer>,
    @InjectModel(Vehicle.name) private readonly vehicles: Model<Vehicle>,
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Handover.name) private readonly handovers: Model<Handover>,
    @InjectModel(Return.name) private readonly returns: Model<Return>,
    @InjectModel(Damage.name) private readonly damages: Model<Damage>,
    @InjectModel(Maintenance.name) private readonly maintenance: Model<Maintenance>,
    @InjectModel(Income.name) private readonly incomes: Model<Income>,
    @InjectModel(Expense.name) private readonly expenses: Model<Expense>,
    @InjectModel(Settings.name) private readonly settings: Model<Settings>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureSuperAdmin();
    await this.migrateLegacyData();
  }

  // create the SaaS operator login if none exists
  private async ensureSuperAdmin(): Promise<void> {
    const existing = await this.users.findOne({ role: Role.SUPERADMIN });
    if (existing) return;
    const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@app.com').toLowerCase();
    const password = process.env.SUPERADMIN_PASSWORD || 'super123';
    // don't collide with a normal user that happens to use this email
    if (await this.users.findOne({ email })) return;
    await this.users.create({
      name: 'Super Admin',
      email,
      password: await bcrypt.hash(password, 10),
      role: Role.SUPERADMIN,
      tenantId: null,
    });
    this.logger.log(`Super-admin created → ${email} (change SUPERADMIN_PASSWORD in .env)`);
  }

  // assign legacy (pre-tenant) data to a single "Default Organization" tenant
  private async migrateLegacyData(): Promise<void> {
    const legacyUsers = await this.users.countDocuments({
      role: { $ne: Role.SUPERADMIN },
      $or: [{ tenantId: null }, { tenantId: { $exists: false } }],
    });
    if (legacyUsers === 0) return; // nothing to migrate

    let tenant = await this.tenants.findOne({ name: 'Default Organization' });
    if (!tenant) {
      const today = new Date().toISOString().slice(0, 10);
      const far = new Date();
      far.setFullYear(far.getFullYear() + 5);
      tenant = await this.tenants.create({
        name: 'Default Organization',
        plan: 'year',
        status: 'active',
        startedAt: today,
        expiresAt: far.toISOString().slice(0, 10),
        notes: 'Auto-created during multi-tenant migration.',
      });
    }
    const tenantId = tenant.id;
    const orphan = { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] };

    await this.users.updateMany({ role: { $ne: Role.SUPERADMIN }, ...orphan }, { $set: { tenantId } });
    const models: Model<any>[] = [
      this.customers,
      this.vehicles,
      this.bookings,
      this.handovers,
      this.returns,
      this.damages,
      this.maintenance,
      this.incomes,
      this.expenses,
      this.settings,
    ];
    for (const m of models) {
      await m.updateMany(orphan, { $set: { tenantId } });
    }
    this.logger.log(`Migrated legacy data into tenant "${tenant.name}" (${tenantId}).`);
  }
}
