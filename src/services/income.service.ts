import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Income } from '../schemas/income.schema';
import { CrudService } from './crud.service';

@Injectable()
export class IncomeService extends CrudService<Income> {
  constructor(@InjectModel(Income.name) model: Model<Income>) {
    super(model);
  }
}
