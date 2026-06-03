import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maintenance } from '../schemas/maintenance.schema';
import { CrudService } from './crud.service';

@Injectable()
export class MaintenanceService extends CrudService<Maintenance> {
  constructor(@InjectModel(Maintenance.name) model: Model<Maintenance>) {
    super(model);
  }
}
