/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from '../Auth/guards/auth.decorator';
import { TenantId } from '../Auth/guards/tenant.decorator';
import { ReportsService } from '../services/reports.service';

// Server-side business reports: paginated + searchable + date-range filtered.
// All routes require a valid token and are scoped to the caller's tenant.
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  // GET /reports/trips?from&to&vehicleId&search&page&limit
  @Get('trips')
  @Auth()
  trips(@Query() query: any, @TenantId() tenantId: string) {
    return this.reports.tripReport(query, tenantId);
  }

  // GET /reports/profit-loss?from&to&search&page&limit
  @Get('profit-loss')
  @Auth()
  profitLoss(@Query() query: any, @TenantId() tenantId: string) {
    return this.reports.profitLossReport(query, tenantId);
  }

  // GET /reports/trip-creation?from&to&search&page&limit
  @Get('trip-creation')
  @Auth()
  tripCreation(@Query() query: any, @TenantId() tenantId: string) {
    return this.reports.tripCreationReport(query, tenantId);
  }
}
