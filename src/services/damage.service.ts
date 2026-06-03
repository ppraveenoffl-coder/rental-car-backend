import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Damage } from '../schemas/damage.schema';
import { CrudService } from './crud.service';

@Injectable()
export class DamageService extends CrudService<Damage> {
  constructor(@InjectModel(Damage.name) model: Model<Damage>) {
    super(model);
  }
}
