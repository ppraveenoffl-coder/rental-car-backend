/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from '../Auth/guards/auth.decorator';
import { ReportsService } from '../services/reports.service';

// Server-side business reports: paginated + searchable + date-range filtered.
// All routes require a valid token (read access for any authenticated user).
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  // GET /reports/trips?from&to&vehicleId&search&page&limit
  @Get('trips')
  @Auth()
  trips(@Query() query: any) {
    return this.reports.tripReport(query);
  }

  // GET /reports/profit-loss?from&to&search&page&limit
  @Get('profit-loss')
  @Auth()
  profitLoss(@Query() query: any) {
    return this.reports.profitLossReport(query);
  }

  // GET /reports/trip-creation?from&to&search&page&limit
  @Get('trip-creation')
  @Auth()
  tripCreation(@Query() query: any) {
    return this.reports.tripCreationReport(query);
  }
}
