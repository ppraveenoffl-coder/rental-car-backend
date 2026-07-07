/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Booking } from '../schemas/booking.schema';
import { Income } from '../schemas/income.schema';
import { Expense } from '../schemas/expense.schema';
import { Handover } from '../schemas/handover.schema';
import { Return } from '../schemas/return.schema';
import { Vehicle } from '../schemas/vehicle.schema';
import { Customer } from '../schemas/customer.schema';

// ----------------------------------------------------------------------------
// Query + result shapes
// ----------------------------------------------------------------------------
export interface ReportQuery {
  from?: string;
  to?: string;
  page?: number | string;
  limit?: number | string;
  search?: string;
  vehicleId?: string;
}

export interface ReportResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: Record<string, any>;
}

// ----------------------------------------------------------------------------
// Pure helpers — a 1:1 port of the frontend `store/travel` report math so the
// numbers stay identical to what the UI used to compute client-side.
// ----------------------------------------------------------------------------
const inRange = (dateStr: any, from?: string, to?: string): boolean => {
  if (!dateStr) return false;
  const d = String(dateStr).slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
};

const daysBetween = (start?: string, end?: string): number => {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const d = Math.round(ms / 86400000);
  return d > 0 ? d : 1;
};

const bookingDays = (b: any) => daysBetween(b.fromDate, b.toDate);
const bookingFull = (b: any) => Number(b.fullAmount) || bookingDays(b) * Number(b.rentPerDay || 0) || 0;
const bookingPaid = (b: any) => Number(b.paidAmount ?? b.advance ?? 0);
const bookingBalance = (b: any) => bookingFull(b) - bookingPaid(b);

const tripKm = (b: any, handover: any, ret: any): number => {
  const startKm = Number(handover?.odometer) || Number(b.startKm) || Number(ret?.startKm) || 0;
  const endKm = Number(ret?.returnKm) || Number(b.endKm) || 0;
  return endKm > startKm ? endKm - startKm : 0;
};

// generic in-memory search across the given string fields of computed rows
const applySearch = (rows: any[], fields: string[], search?: string): any[] => {
  const s = (search || '').trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) => fields.some((f) => String(r[f] ?? '').toLowerCase().includes(s)));
};

// slice computed rows into a page (mirrors crud.service.listPaged shape)
const paginate = (rows: any[], page?: number | string, limit?: number | string) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(500, Math.max(1, Number(limit) || 10));
  const total = rows.length;
  const data = rows.slice((p - 1) * l, (p - 1) * l + l);
  return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) || 1 };
};

const byId = (docs: any[]) => {
  const m: Record<string, any> = {};
  docs.forEach((d) => (m[String(d._id)] = d));
  return m;
};
const byBooking = (docs: any[]) => {
  const m: Record<string, any> = {};
  docs.forEach((d) => {
    if (d.bookingId && !m[String(d.bookingId)]) m[String(d.bookingId)] = d;
  });
  return m;
};

const vehicleLabel = (v: any) => (v ? `${v.name} (${v.vehicleNo})` : '—');
const customerLabel = (c: any) => c?.name || '—';

// ==============================|| REPORTS SERVICE ||============================== //

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,
    @InjectModel(Income.name) private readonly incomeModel: Model<Income>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<Expense>,
    @InjectModel(Handover.name) private readonly handoverModel: Model<Handover>,
    @InjectModel(Return.name) private readonly returnModel: Model<Return>,
    @InjectModel(Vehicle.name) private readonly vehicleModel: Model<Vehicle>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
  ) {}

  // ---- Trip Report ---------------------------------------------------------
  async tripReport(q: ReportQuery, tenantId: string): Promise<ReportResult> {
    const { from, to, search, vehicleId } = q;
    const t = { tenantId };
    const [bookings, incomes, expenses, handovers, returns, vehicles, customers] = await Promise.all([
      this.bookingModel.find(t).sort({ createdAt: -1 }).lean(),
      this.incomeModel.find(t).lean(),
      this.expenseModel.find(t).lean(),
      this.handoverModel.find(t).lean(),
      this.returnModel.find(t).lean(),
      this.vehicleModel.find(t).lean(),
      this.customerModel.find(t).lean(),
    ]);

    const vMap = byId(vehicles);
    const cMap = byId(customers);
    const hMap = byBooking(handovers);
    const rMap = byBooking(returns);

    const incomeByBooking: Record<string, number> = {};
    incomes.forEach((i: any) => {
      if (i.bookingId) {
        const bid = String(i.bookingId);
        incomeByBooking[bid] = (incomeByBooking[bid] || 0) + Number(i.amount || 0);
      }
    });

    let rows = bookings
      .filter((b: any) => inRange(b.fromDate, from, to) && (!vehicleId || String(b.vehicleId) === vehicleId))
      .map((b: any) => {
        const id = String(b._id);
        return {
          id,
          bookingNo: b.bookingNo || id,
          fromDate: b.fromDate || '',
          toDate: b.toDate || '',
          vehicle: vehicleLabel(vMap[String(b.vehicleId)]),
          customer: customerLabel(cMap[String(b.customerId)]),
          destination: b.destination || '—',
          km: tripKm(b, hMap[id], rMap[id]),
          revenue: incomeByBooking[id] || 0,
          status: b.status || '—',
          balance: bookingBalance(b),
        };
      });

    rows = applySearch(rows, ['bookingNo', 'vehicle', 'customer', 'destination', 'status'], search);

    const totalKm = rows.reduce((s, t) => s + t.km, 0);
    const totalRevenue = rows.reduce((s, t) => s + t.revenue, 0);
    const totalExpense = expenses
      .filter((e: any) => inRange(e.date, from, to) && (!vehicleId || String(e.vehicleId) === vehicleId))
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

    return {
      ...paginate(rows, q.page, q.limit),
      summary: { trips: rows.length, totalKm, totalRevenue, totalExpense, net: totalRevenue - totalExpense },
    };
  }

  // ---- Profit & Loss by vehicle -------------------------------------------
  async profitLossReport(q: ReportQuery, tenantId: string): Promise<ReportResult> {
    const { from, to, search } = q;
    const t = { tenantId };
    const [bookings, incomes, expenses, handovers, returns, vehicles] = await Promise.all([
      this.bookingModel.find(t).lean(),
      this.incomeModel.find(t).lean(),
      this.expenseModel.find(t).lean(),
      this.handoverModel.find(t).lean(),
      this.returnModel.find(t).lean(),
      this.vehicleModel.find(t).sort({ createdAt: -1 }).lean(),
    ]);

    const hMap = byBooking(handovers);
    const rMap = byBooking(returns);

    // income is keyed by booking → resolve each booking to its vehicle
    const bookingVehicle: Record<string, string> = {};
    bookings.forEach((b: any) => (bookingVehicle[String(b._id)] = String(b.vehicleId)));

    let rows = vehicles.map((v: any) => {
      const vid = String(v._id);
      const trips = bookings.filter((b: any) => String(b.vehicleId) === vid && inRange(b.fromDate, from, to));
      const km = trips.reduce((s: number, b: any) => s + tripKm(b, hMap[String(b._id)], rMap[String(b._id)]), 0);
      const income = incomes
        .filter((i: any) => inRange(i.date, from, to) && bookingVehicle[String(i.bookingId)] === vid)
        .reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
      const expense = expenses
        .filter((e: any) => String(e.vehicleId) === vid && inRange(e.date, from, to))
        .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      const profit = income - expense;
      return {
        id: vid,
        vehicle: vehicleLabel(v),
        trips: trips.length,
        km,
        income,
        expense,
        profit,
        margin: income ? (profit / income) * 100 : 0,
      };
    });

    rows = applySearch(rows, ['vehicle'], search);

    const totalIncome = incomes
      .filter((i: any) => inRange(i.date, from, to))
      .reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const totalExpense = expenses
      .filter((e: any) => inRange(e.date, from, to))
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;

    return {
      ...paginate(rows, q.page, q.limit),
      summary: { income: totalIncome, expense: totalExpense, netProfit, margin: totalIncome ? (netProfit / totalIncome) * 100 : 0 },
    };
  }

  // ---- Trip Creation Report ------------------------------------------------
  async tripCreationReport(q: ReportQuery, tenantId: string): Promise<ReportResult> {
    const { from, to, search } = q;
    const t = { tenantId };
    const [bookings, vehicles, customers] = await Promise.all([
      this.bookingModel.find(t).sort({ createdAt: -1 }).lean(),
      this.vehicleModel.find(t).lean(),
      this.customerModel.find(t).lean(),
    ]);

    const vMap = byId(vehicles);
    const cMap = byId(customers);

    let rows = bookings
      .map((b: any) => {
        const created = (b.createdAt ? new Date(b.createdAt).toISOString() : b.fromDate || '').slice(0, 10);
        return { b, created };
      })
      .filter(({ created }) => inRange(created, from, to))
      .map(({ b, created }) => {
        const id = String(b._id);
        return {
          id,
          bookingNo: b.bookingNo || id,
          created,
          customer: customerLabel(cMap[String(b.customerId)]),
          vehicle: vehicleLabel(vMap[String(b.vehicleId)]),
          destination: b.destination || '—',
          fromDate: b.fromDate || '',
          toDate: b.toDate || '',
          fullAmount: bookingFull(b),
          paid: bookingPaid(b),
          balance: bookingBalance(b),
          status: b.status || 'Enquiry',
        };
      });

    rows = applySearch(rows, ['bookingNo', 'customer', 'vehicle', 'destination', 'status'], search);

    const count = (s: string) => rows.filter((r) => r.status === s).length;

    return {
      ...paginate(rows, q.page, q.limit),
      summary: {
        created: rows.length,
        completed: count('Completed'),
        cancelled: count('Cancelled'),
        totalValue: rows.reduce((s, r) => s + r.fullAmount, 0),
      },
    };
  }
}
