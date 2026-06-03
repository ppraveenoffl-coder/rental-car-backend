/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import dbConfig from './config/db.config';
import { User as UserClass, Userschema } from '../schemas/user.schema';
import { Customer as CustomerClass, Customerschema } from '../schemas/customer.schema';
import { Vehicle as VehicleClass, Vehicleschema } from '../schemas/vehicle.schema';
import { Booking as BookingClass, Bookingschema } from '../schemas/booking.schema';
import { Handover as HandoverClass, Handoverschema } from '../schemas/handover.schema';
import { Return as ReturnClass, Returnschema } from '../schemas/return.schema';
import { Income as IncomeClass, Incomeschema } from '../schemas/income.schema';
import { Expense as ExpenseClass, Expenseschema } from '../schemas/expense.schema';
import { Maintenance as MaintenanceClass, Maintenanceschema } from '../schemas/maintenance.schema';
import { Settings as SettingsClass, Settingsschema } from '../schemas/settings.schema';

// register standalone models (same names → same collections as the app)
const User = mongoose.model(UserClass.name, Userschema);
const Customer = mongoose.model(CustomerClass.name, Customerschema);
const Vehicle = mongoose.model(VehicleClass.name, Vehicleschema);
const Booking = mongoose.model(BookingClass.name, Bookingschema);
const Handover = mongoose.model(HandoverClass.name, Handoverschema);
const Return = mongoose.model(ReturnClass.name, Returnschema);
const Income = mongoose.model(IncomeClass.name, Incomeschema);
const Expense = mongoose.model(ExpenseClass.name, Expenseschema);
const Maintenance = mongoose.model(MaintenanceClass.name, Maintenanceschema);
const Settings = mongoose.model(SettingsClass.name, Settingsschema);

async function run() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(dbConfig.uri, { serverSelectionTimeoutMS: 8000 });
  console.log('✓ MongoDB connected:', mongoose.connection.host, '/', mongoose.connection.name);

  console.log('Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Vehicle.deleteMany({}),
    Booking.deleteMany({}),
    Handover.deleteMany({}),
    Return.deleteMany({}),
    Income.deleteMany({}),
    Expense.deleteMany({}),
    Maintenance.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  // ---- users ----
  const adminPass = await bcrypt.hash('admin123', 10);
  const staffPass = await bcrypt.hash('staff123', 10);
  await User.create([
    { name: 'Administrator', email: 'admin@rental.com', password: adminPass, role: 'admin' },
    { name: 'Front Desk Staff', email: 'staff@rental.com', password: staffPass, role: 'staff' },
  ]);

  // ---- settings ----
  await Settings.create({
    companyName: 'SelfDrive Car Rentals',
    defaultFreeKm: 300,
    defaultExtraKmCharge: 6,
    defaultSecurityDeposit: 5000,
    fuelChargePerLevel: 300,
    serviceIntervalKm: 5000,
    expiryAlertDays: 30,
    terms: [
      'Lease Basis — The vehicle is provided solely on a lease basis. The lessee acknowledges that this agreement does not create a rental relationship.',
      'Responsibility for Vehicle Damage — The lessee shall be fully responsible for any loss, damage, theft, or deterioration of the vehicle occurring during the lease period, regardless of cause.',
      'Accidents and Incidents — In the event of an accident, collision, theft, or any other incident involving the vehicle, the lessee shall bear all associated costs, including repairs, insurance excess/deductibles, third-party claims, legal expenses, and any other settlement amounts arising from such incident.',
      'Traffic Violations and Penalties — The lessee shall be solely responsible for the payment of all traffic fines, challans, penalties, towing charges, and other violations incurred during the lease period.',
      'Permitted Use — The vehicle shall not be: (a) used for any unlawful or illegal purpose; (b) sub-leased, rented, assigned, or transferred to any third party; (c) driven by any person other than the authorized lessee, unless prior written approval is obtained from the lessor.',
      'Return of Vehicle and Documents — Final settlement and closure of the lease shall be completed only after the vehicle, keys, and all original documents have been returned to the lessor and successfully verified.',
      "Identity Verification and Signature — The lessee's signature is mandatory. The lessor reserves the right to verify the lessee's identity and signature prior to handing over the vehicle.",
      'Acceptance of Terms — By signing this agreement, the lessee confirms that they have read, understood, and agreed to all the terms and conditions stated herein.',
      'No Drinking and Driving — The lessee shall not operate the vehicle while under the influence of alcohol, narcotics, drugs, or any substance that may impair driving ability. Any violation of applicable drinking-and-driving laws shall be the sole responsibility of the lessee, who shall bear all costs, fines, penalties, legal expenses, damages, claims, and liabilities arising from such violation, including any damage to the vehicle or third parties.',
      'GPS Tracking and Vehicle Monitoring — The lessee acknowledges that the vehicle is equipped with a GPS tracking device and may be monitored by the lessor for security, safety, recovery, operational, and compliance purposes. The lessee shall not tamper with, disable, disconnect, remove, or interfere with the GPS device. Any unauthorized interference shall constitute a material breach and may result in immediate termination of the lease, vehicle recovery, and liability for any resulting costs, damages, or losses.',
    ],
  });

  // ---- customers ----
  const [rahul, priya] = await Customer.create([
    {
      name: 'Rahul Sharma',
      mobile: '9876543210',
      address: '12 MG Road, Bengaluru',
      aadhaar: '1234-5678-9012',
      license: 'DL-0420110012345',
      emergencyContact: '9876500000',
      documents: [
        { id: 'doc1', name: 'Aadhaar Card', type: 'Aadhaar', status: 'Verified' },
        { id: 'doc2', name: 'Driving Licence', type: 'Driving License', status: 'Verified' },
      ],
    },
    {
      name: 'Priya Nair',
      mobile: '9123456780',
      address: '8 Brigade Road, Bengaluru',
      aadhaar: '2345-6789-0123',
      license: 'DL-0520120098765',
      emergencyContact: '9123400000',
      documents: [{ id: 'doc3', name: 'Driving Licence', type: 'Driving License', status: 'Pending' }],
    },
  ]);

  // ---- vehicles ----
  const [swift, ertiga] = await Vehicle.create([
    { vehicleNo: 'KA01AB1234', name: 'Maruti Swift', type: '5 Seat', dailyRent: 1500, freeKmPerDay: 300, extraKmCharge: 6, insuranceExpiry: '2026-12-15', fcExpiry: '2027-03-20', pollutionExpiry: '2026-06-20', status: 'Available' },
    { vehicleNo: 'KA02CD5678', name: 'Maruti Ertiga', type: '7 Seat', dailyRent: 2300, freeKmPerDay: 300, extraKmCharge: 7, insuranceExpiry: '2026-06-25', fcExpiry: '2027-01-10', pollutionExpiry: '2026-09-10', status: 'Running' },
    { vehicleNo: 'KA03EF9012', name: 'Toyota Innova', type: '7 Seat', dailyRent: 3500, freeKmPerDay: 300, extraKmCharge: 9, insuranceExpiry: '2027-02-18', fcExpiry: '2027-05-12', pollutionExpiry: '2026-11-05', status: 'Available' },
  ]);

  // ---- bookings ----
  // Start KM is captured at handover; End KM is captured at vehicle return — not at booking time.
  const [bk1, bk2] = await Booking.create([
    { bookingNo: 'BK-2001', customerId: rahul.id, vehicleId: ertiga.id, fromDate: '2026-05-30', toDate: '2026-06-02', startTime: '09:00', endTime: '18:30', destination: 'Coorg', startKm: 42500, rentPerDay: 2300, fullAmount: 6900, paidAmount: 3000, status: 'Running', notes: 'Coorg trip' },
    { bookingNo: 'BK-2002', customerId: priya.id, vehicleId: swift.id, fromDate: '2026-05-20', toDate: '2026-05-23', startTime: '08:30', endTime: '19:15', destination: 'Trichy', startKm: 40200, rentPerDay: 1500, fullAmount: 4500, paidAmount: 4500, status: 'Completed', notes: '' },
  ]);

  // ---- handovers (start odometer) & returns (end odometer) ----
  // bk1 is still Running → handed over (start km), no return yet.
  // bk2 is Completed → handed over and returned (end km lives on the return).
  await Handover.create([
    { bookingId: bk1.id, date: '2026-05-30', odometer: 42500, fuelLevel: 'Full', termsAccepted: true },
    { bookingId: bk2.id, date: '2026-05-20', odometer: 40200, fuelLevel: 'Full', termsAccepted: true },
  ]);
  await Return.create([
    { bookingId: bk2.id, returnDate: '2026-05-23', returnTime: '19:15', startKm: 40200, returnKm: 41050, extraKm: 0, damageCharge: 0, fuelDifference: 0, fineAmount: 0, tollAmount: 0, balanceCollected: 0, notes: '' },
  ]);

  // ---- income / expense / maintenance ----
  await Income.create([
    { date: '2026-05-23', bookingId: bk2.id, customerId: priya.id, amount: 4500, paymentMode: 'UPI', type: 'Rental Payment' },
    { date: '2026-05-30', bookingId: bk1.id, customerId: rahul.id, amount: 2300, paymentMode: 'Cash', type: 'Advance' },
  ]);
  await Expense.create([
    { date: '2026-05-10', vehicleId: swift.id, type: 'Service', amount: 3500 },
    { date: '2026-05-12', vehicleId: ertiga.id, type: 'Fuel', amount: 2000 },
    { date: '2026-05-15', vehicleId: swift.id, type: 'Insurance', amount: 8000 },
  ]);
  await Maintenance.create([
    { serviceDate: '2026-05-10', vehicleId: swift.id, odometer: 40000, serviceType: 'Oil Change', vendor: 'Maruti Service', amount: 3500, nextServiceKm: 45000, nextServiceDate: '2026-08-10' },
  ]);

  console.log('\n✓ Seed complete.');
  console.log('  Admin login:  admin@rental.com / admin123');
  console.log('  Staff login:  staff@rental.com / staff123\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
