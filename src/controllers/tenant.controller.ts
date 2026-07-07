/* eslint-disable @typescript-eslint/no-explicit-any */
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Auth, AllowExpired } from '../Auth/guards/auth.decorator';
import { TenantId } from '../Auth/guards/tenant.decorator';
import { Role } from '../utils/enum/roles.enum';
import { TenantService } from '../services/tenant.service';

// Super-admin only — the SaaS operator manages subscribers & their plans here.
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  @Get()
  @Auth(Role.SUPERADMIN)
  list() {
    return this.tenants.list();
  }

  // create a subscriber + its owner admin login
  @Post()
  @Auth(Role.SUPERADMIN)
  create(@Body() body: any) {
    return this.tenants.create(body);
  }

  // a subscriber (any authenticated tenant user) asks the operator to renew.
  // @AllowExpired so it stays reachable from the renew wall after the plan lapses.
  @Post('request-renewal')
  @Auth()
  @AllowExpired()
  requestRenewal(@TenantId() tenantId: string) {
    return this.tenants.requestRenewal(tenantId);
  }

  // renew / extend a subscription by one plan period (manual activation)
  @Patch(':id/extend')
  @Auth(Role.SUPERADMIN)
  extend(@Param('id') id: string, @Body() body: any) {
    return this.tenants.extend(id, body?.plan);
  }

  // reset the subscriber owner's login password
  @Patch(':id/reset-password')
  @Auth(Role.SUPERADMIN)
  resetPassword(@Param('id') id: string, @Body() body: any) {
    return this.tenants.resetOwnerPassword(id, body?.password);
  }

  // suspend or reactivate a subscriber
  @Patch(':id/status')
  @Auth(Role.SUPERADMIN)
  setStatus(@Param('id') id: string, @Body() body: any) {
    return this.tenants.setStatus(id, body?.status);
  }
}
