/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Booking } from '../schemas/booking.schema';
import { Vehicle } from '../schemas/vehicle.schema';
import { Maintenance } from '../schemas/maintenance.schema';
import { Settings } from '../schemas/settings.schema';
import { Tenant } from '../schemas/tenant.schema';
import { DeviceService } from './device.service';
import { PushService } from './push.service';
import { isExpired } from './tenant.service';

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
};

export interface AlertSummary {
  overdueReturns: number;
  insuranceExpiring: number;
  fcExpiring: number;
  serviceDue: number;
  total: number;
  message: string;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger('Alerts');

  constructor(
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Vehicle.name) private readonly vehicles: Model<Vehicle>,
    @InjectModel(Maintenance.name) private readonly maintenance: Model<Maintenance>,
    @InjectModel(Settings.name) private readonly settings: Model<Settings>,
    @InjectModel(Tenant.name) private readonly tenants: Model<Tenant>,
    private readonly devices: DeviceService,
    private readonly push: PushService,
  ) {}

  // every day at 08:00 server time
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async dailyAlerts(): Promise<void> {
    this.logger.log('Running daily alerts…');
    await this.runForAllTenants();
  }

  async runForAllTenants(): Promise<{ tenants: number; pushed: number }> {
    const tenants = await this.tenants.find({ status: { $ne: 'suspended' } }).lean();
    let pushed = 0;
    for (const t of tenants as any[]) {
      // skip lapsed subscriptions
      if (isExpired(t.expiresAt)) continue;
      const res = await this.runForTenant(String(t._id));
      if (res && res.sent) pushed += res.sent;
    }
    return { tenants: tenants.length, pushed };
  }

  async runForTenant(tenantId: string): Promise<{ summary: AlertSummary; sent: number } | null> {
    const summary = await this.computeAlerts(tenantId);
    if (summary.total === 0) return { summary, sent: 0 };
    const tokens = await this.devices.tokensForTenant(tenantId);
    if (tokens.length === 0) return { summary, sent: 0 };
    const res = await this.push.sendToTokens(tokens, 'Daily fleet alerts', summary.message, { type: 'daily_alerts' });
    if (res.invalidTokens.length) await this.devices.removeTokens(res.invalidTokens);
    return { summary, sent: res.sent };
  }

  // Per-tenant actionable alerts (mirrors the dashboard alert chips).
  async computeAlerts(tenantId: string): Promise<AlertSummary> {
    const today = isoDate(new Date());
    const [bookings, vehicles, maintenance, settings] = await Promise.all([
      this.bookings.find({ tenantId }).lean(),
      this.vehicles.find({ tenantId }).lean(),
      this.maintenance.find({ tenantId }).lean(),
      this.settings.findOne({ tenantId }).lean(),
    ]);
    const alertDays = (settings as any)?.expiryAlertDays || 30;
    const horizon = addDays(today, alertDays);

    const overdueReturns = (bookings as any[]).filter((b) => b.status === 'Running' && b.toDate && b.toDate < today).length;
    const insuranceExpiring = (vehicles as any[]).filter((v) => v.insuranceExpiry && v.insuranceExpiry >= today && v.insuranceExpiry <= horizon).length;
    const fcExpiring = (vehicles as any[]).filter((v) => v.fcExpiry && v.fcExpiry >= today && v.fcExpiry <= horizon).length;
    const serviceDue =
      (vehicles as any[]).filter((v) => v.status === 'Service').length +
      (maintenance as any[]).filter((m) => m.nextServiceDate && m.nextServiceDate >= today && m.nextServiceDate <= horizon).length;

    const parts: string[] = [];
    if (overdueReturns) parts.push(`${overdueReturns} overdue return${overdueReturns > 1 ? 's' : ''}`);
    if (insuranceExpiring) parts.push(`${insuranceExpiring} insurance expiring`);
    if (fcExpiring) parts.push(`${fcExpiring} FC expiring`);
    if (serviceDue) parts.push(`${serviceDue} service due`);
    const total = overdueReturns + insuranceExpiring + fcExpiring + serviceDue;

    return { overdueReturns, insuranceExpiring, fcExpiring, serviceDue, total, message: parts.join(' · ') };
  }
}
