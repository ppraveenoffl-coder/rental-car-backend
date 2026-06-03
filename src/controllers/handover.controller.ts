import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { HandoverService } from '../services/handover.service';
import { Handover } from '../schemas/handover.schema';

@Controller('handovers')
export class HandoverController extends CrudController<Handover> {
  constructor(@Inject(HandoverService) service: HandoverService) {
    super(service);
  }
}
