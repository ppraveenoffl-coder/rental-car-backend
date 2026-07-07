import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { CommissionService } from '../services/commission.service';
import { Commission } from '../schemas/commission.schema';

@Controller('commissions')
export class CommissionController extends CrudController<Commission> {
  constructor(@Inject(CommissionService) service: CommissionService) {
    super(service);
  }
}
