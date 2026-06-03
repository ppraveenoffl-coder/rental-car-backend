import { Controller, Inject } from '@nestjs/common';
import { CrudController } from './crud.controller';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../schemas/customer.schema';

@Controller('customers')
export class CustomerController extends CrudController<Customer> {
  constructor(@Inject(CustomerService) service: CustomerService) {
    super(service);
  }
}
