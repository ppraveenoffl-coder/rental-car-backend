/* eslint-disable @typescript-eslint/no-explicit-any */
import { Body, Controller, Inject, Param, Post, Put } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { VehicleService } from '../services/vehicle.service';
import { Vehicle } from '../schemas/vehicle.schema';
import { Auth } from '../Auth/guards/auth.decorator';
import { TenantId } from '../Auth/guards/tenant.decorator';
import { Role } from '../utils/enum/roles.enum';

@Controller('vehicles')
export class VehicleController extends CrudController<Vehicle> {
  constructor(@Inject(VehicleService) service: VehicleService) {
    super(service);
  }

  // Vehicles are admin-only for writes (staff is view-only); list/get inherited.
  @Post()
  @Auth(Role.ADMIN)
  create(@Body() body: any, @TenantId() tenantId: string): Promise<any> {
    return this.service.create(body, tenantId);
  }

  @Put(':id')
  @Auth(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any, @TenantId() tenantId: string): Promise<any> {
    return this.service.update(id, body, tenantId);
  }
}
