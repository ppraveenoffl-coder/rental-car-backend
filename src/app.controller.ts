import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// Public health check — kept outside the /api prefix mirror of the legacy
// Express `GET /` route, served at GET /api here.
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root() {
    return this.appService.root();
  }
}
