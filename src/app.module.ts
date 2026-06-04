import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import providerConfiguration from './provider.configuration';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthController } from './Auth/auth.controller';
import { AuthService } from './Auth/auth.service';
import { JwtStrategyService } from './Auth/guards/jwtStrategy.service';

import { CustomerController } from './controllers/customer.controller';
import { VehicleController } from './controllers/vehicle.controller';
import { BookingController } from './controllers/booking.controller';
import { HandoverController } from './controllers/handover.controller';
import { ReturnController } from './controllers/return.controller';
import { DamageController } from './controllers/damage.controller';
import { MaintenanceController } from './controllers/maintenance.controller';
import { IncomeController } from './controllers/income.controller';
import { ExpenseController } from './controllers/expense.controller';
import { SettingsController } from './controllers/settings.controller';
import { ReportsController } from './controllers/reports.controller';

import { CustomerService } from './services/customer.service';
import { VehicleService } from './services/vehicle.service';
import { BookingService } from './services/booking.service';
import { HandoverService } from './services/handover.service';
import { ReturnService } from './services/return.service';
import { DamageService } from './services/damage.service';
import { MaintenanceService } from './services/maintenance.service';
import { IncomeService } from './services/income.service';
import { ExpenseService } from './services/expense.service';
import { SettingsService } from './services/settings.service';
import { ReportsService } from './services/reports.service';

@Module({
  imports: [
    ...providerConfiguration,
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-this-secret-in-production-7f3a9c2e',
      signOptions: { expiresIn: process.env.JWT_EXPIRES || '7d' },
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    CustomerController,
    VehicleController,
    BookingController,
    HandoverController,
    ReturnController,
    DamageController,
    MaintenanceController,
    IncomeController,
    ExpenseController,
    SettingsController,
    ReportsController,
  ],
  providers: [
    AppService,
    AuthService,
    JwtStrategyService,
    CustomerService,
    VehicleService,
    BookingService,
    HandoverService,
    ReturnService,
    DamageService,
    MaintenanceService,
    IncomeService,
    ExpenseService,
    SettingsService,
    ReportsService,
  ],
  exports: [PassportModule, JwtModule],
})
export class AppModule {}
