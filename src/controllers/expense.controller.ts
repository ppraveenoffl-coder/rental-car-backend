import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { ExpenseService } from '../services/expense.service';
import { Expense } from '../schemas/expense.schema';

@Controller('expenses')
export class ExpenseController extends CrudController<Expense> {
  constructor(@Inject(ExpenseService) service: ExpenseService) {
    super(service);
  }
}
