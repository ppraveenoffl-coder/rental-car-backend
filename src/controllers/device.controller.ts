/* eslint-disable @typescript-eslint/no-explicit-any */
import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { Auth, AllowExpired } from '../Auth/guards/auth.decorator';
import { CurrentUser, TenantId } from '../Auth/guards/tenant.decorator';
import { DeviceService } from '../services/device.service';

// Mobile devices register their FCM token here (and clear it on logout).
@Controller('devices')
export class DeviceController {
  constructor(private readonly devices: DeviceService) {}

  // POST /api/devices  { token, platform }
  @Post()
  @Auth()
  @AllowExpired()
  register(@Body() body: any, @TenantId() tenantId: string, @CurrentUser() user: any) {
    return this.devices.register(tenantId, user.id, body?.token, body?.platform);
  }

  // DELETE /api/devices/:token  (on logout)
  @Delete(':token')
  @Auth()
  @AllowExpired()
  unregister(@Param('token') token: string) {
    return this.devices.unregister(token);
  }
}
