import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense } from '../schemas/expense.schema';
import { CrudService } from './crud.service';

@Injectable()
export class ExpenseService extends CrudService<Expense> {
  constructor(@InjectModel(Expense.name) model: Model<Expense>) {
    super(model);
  }
}
