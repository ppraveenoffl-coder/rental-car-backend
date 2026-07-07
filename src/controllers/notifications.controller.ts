/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, Get, Post } from '@nestjs/common';
import { Auth } from '../Auth/guards/auth.decorator';
import { CurrentUser, TenantId } from '../Auth/guards/tenant.decorator';
import { Role } from '../utils/enum/roles.enum';
import { AlertsService } from '../services/alerts.service';
import { DeviceService } from '../services/device.service';
import { PushService } from '../services/push.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly alerts: AlertsService,
    private readonly devices: DeviceService,
    private readonly push: PushService,
  ) {}

  // GET /api/notifications/preview — compute this tenant's alerts (no send)
  @Get('preview')
  @Auth()
  preview(@TenantId() tenantId: string) {
    return this.alerts.computeAlerts(tenantId);
  }

  // POST /api/notifications/test — send a test push to the caller's own devices
  @Post('test')
  @Auth()
  async test(@CurrentUser() user: any) {
    const tokens = await this.devices.tokensForUser(user.id);
    const res = await this.push.sendToTokens(tokens, 'Test notification', 'Push notifications are working ✅', { type: 'test' });
    return { configured: this.push.configured, devices: tokens.length, ...res };
  }

  // POST /api/notifications/run-mine — run the daily alert job for this tenant now
  @Post('run-mine')
  @Auth(Role.ADMIN)
  runMine(@TenantId() tenantId: string) {
    return this.alerts.runForTenant(tenantId);
  }

  // POST /api/notifications/run-all — run for every tenant (super-admin)
  @Post('run-all')
  @Auth(Role.SUPERADMIN)
  runAll() {
    return this.alerts.runForAllTenants();
  }
}
