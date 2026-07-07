/* eslint-disable @typescript-eslint/no-explicit-any */
import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { Auth } from '../Auth/guards/auth.decorator';
import { TenantId } from '../Auth/guards/tenant.decorator';
import { Role } from '../utils/enum/roles.enum';

@Controller('settings')
export class SettingsController {
  constructor(@Inject(SettingsService) private readonly settingsService: SettingsService) {}

  // GET /api/settings — any authenticated user (this tenant's settings)
  @Get()
  @Auth()
  read(@TenantId() tenantId: string): Promise<any> {
    return this.settingsService.read(tenantId);
  }

  // PUT /api/settings — admin only
  @Put()
  @Auth(Role.ADMIN)
  update(@Body() body: any, @TenantId() tenantId: string): Promise<any> {
    return this.settingsService.update(body, tenantId);
  }
}
