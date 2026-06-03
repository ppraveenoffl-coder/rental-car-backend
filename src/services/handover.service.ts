import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Handover } from '../schemas/handover.schema';
import { CrudService } from './crud.service';

@Injectable()
export class HandoverService extends CrudService<Handover> {
  constructor(@InjectModel(Handover.name) model: Model<Handover>) {
    super(model);
  }
}
