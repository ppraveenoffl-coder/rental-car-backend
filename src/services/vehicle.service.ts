import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle } from '../schemas/vehicle.schema';
import { CrudService } from './crud.service';

@Injectable()
export class VehicleService extends CrudService<Vehicle> {
  constructor(@InjectModel(Vehicle.name) model: Model<Vehicle>) {
    super(model);
  }
}
