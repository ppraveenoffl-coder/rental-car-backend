import { MongooseModule } from '@nestjs/mongoose';
import dbConfig from './utils/config/db.config';
import { User, Userschema } from './schemas/user.schema';
import { Customer, Customerschema } from './schemas/customer.schema';
import { Vehicle, Vehicleschema } from './schemas/vehicle.schema';
import { Booking, Bookingschema } from './schemas/booking.schema';
import { Handover, Handoverschema } from './schemas/handover.schema';
import { Return, Returnschema } from './schemas/return.schema';
import { Damage, Damageschema } from './schemas/damage.schema';
import { Maintenance, Maintenanceschema } from './schemas/maintenance.schema';
import { Income, Incomeschema } from './schemas/income.schema';
import { Expense, Expenseschema } from './schemas/expense.schema';
import { Settings, Settingsschema } from './schemas/settings.schema';
import { Tenant, Tenantschema } from './schemas/tenant.schema';
import { Device, Deviceschema } from './schemas/device.schema';
import { Commission, Commissionschema } from './schemas/commission.schema';

export default [
  // pooled connection sized for many concurrent tenants
  MongooseModule.forRoot(dbConfig.uri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 50,
    minPoolSize: 5,
  }),
  MongooseModule.forFeature([
    { name: User.name, schema: Userschema },
    { name: Customer.name, schema: Customerschema },
    { name: Vehicle.name, schema: Vehicleschema },
    { name: Booking.name, schema: Bookingschema },
    { name: Handover.name, schema: Handoverschema },
    { name: Return.name, schema: Returnschema },
    { name: Damage.name, schema: Damageschema },
    { name: Maintenance.name, schema: Maintenanceschema },
    { name: Income.name, schema: Incomeschema },
    { name: Expense.name, schema: Expenseschema },
    { name: Settings.name, schema: Settingsschema },
    { name: Tenant.name, schema: Tenantschema },
    { name: Device.name, schema: Deviceschema },
    { name: Commission.name, schema: Commissionschema },
  ]),
];
