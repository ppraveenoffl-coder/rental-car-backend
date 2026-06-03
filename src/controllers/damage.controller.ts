import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { DamageService } from '../services/damage.service';
import { Damage } from '../schemas/damage.schema';

@Controller('damages')
export class DamageController extends CrudController<Damage> {
  constructor(@Inject(DamageService) service: DamageService) {
    super(service);
  }
}
