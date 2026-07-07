import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Commission } from '../schemas/commission.schema';
import { CrudService } from './crud.service';

@Injectable()
export class CommissionService extends CrudService<Commission> {
  constructor(@InjectModel(Commission.name) model: Model<Commission>) {
    super(model);
  }
}
