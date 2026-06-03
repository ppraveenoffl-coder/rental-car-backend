import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { ReturnService } from '../services/return.service';
import { Return } from '../schemas/return.schema';

@Controller('returns')
export class ReturnController extends CrudController<Return> {
  constructor(@Inject(ReturnService) service: ReturnService) {
    super(service);
  }
}
