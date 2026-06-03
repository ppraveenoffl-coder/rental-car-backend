import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Return } from '../schemas/return.schema';
import { CrudService } from './crud.service';

@Injectable()
export class ReturnService extends CrudService<Return> {
  constructor(@InjectModel(Return.name) model: Model<Return>) {
    super(model);
  }
}
