import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { BookingService } from '../services/booking.service';
import { Booking } from '../schemas/booking.schema';

@Controller('bookings')
export class BookingController extends CrudController<Booking> {
  constructor(@Inject(BookingService) service: BookingService) {
    super(service);
  }
}
