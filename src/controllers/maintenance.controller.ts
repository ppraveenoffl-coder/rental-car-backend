import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { MaintenanceService } from '../services/maintenance.service';
import { Maintenance } from '../schemas/maintenance.schema';

@Controller('maintenance')
export class MaintenanceController extends CrudController<Maintenance> {
  constructor(@Inject(MaintenanceService) service: MaintenanceService) {
    super(service);
  }
}
