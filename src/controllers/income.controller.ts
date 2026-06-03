import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { IncomeService } from '../services/income.service';
import { Income } from '../schemas/income.schema';

@Controller('incomes')
export class IncomeController extends CrudController<Income> {
  constructor(@Inject(IncomeService) service: IncomeService) {
    super(service);
  }
}
