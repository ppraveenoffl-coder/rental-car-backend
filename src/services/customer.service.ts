import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from '../schemas/customer.schema';
import { CrudService } from './crud.service';

@Injectable()
export class CustomerService extends CrudService<Customer> {
  constructor(@InjectModel(Customer.name) model: Model<Customer>) {
    super(model);
  }
}
