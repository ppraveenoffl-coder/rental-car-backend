import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  root() {
    return { name: 'Car Rental API', status: 'ok' };
  }
}
