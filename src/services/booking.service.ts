import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking } from '../schemas/booking.schema';
import { CrudService } from './crud.service';

@Injectable()
export class BookingService extends CrudService<Booking> {
  constructor(@InjectModel(Booking.name) model: Model<Booking>) {
    super(model);
  }
}
