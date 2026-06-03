/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

// escape user input before building a case-insensitive search regex
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface ListQuery {
  page?: number | string;
  limit?: number | string;
  sort?: string;
  order?: 'asc' | 'desc' | string;
  search?: string;
  searchFields?: string[];
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Generic CRUD engine — a 1:1 port of the Express `crudRouter` behaviour.
// Each resource service extends this with its own injected Mongoose model.
export abstract class CrudService<T> {
  protected constructor(protected readonly model: Model<T>) {}

  // list → newest first (full collection; used by the in-memory store + reports)
  async list(): Promise<any> {
    return this.model.find().sort({ createdAt: -1 });
  }

  // paginated + sorted + searched list → { data, total, page, limit, totalPages }
  // `search` is regex-matched (case-insensitive) against the supplied searchFields.
  async listPaged(opts: ListQuery): Promise<PagedResult<any>> {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(opts.limit) || 10));
    const sortField = opts.sort || 'createdAt';
    const sortDir = opts.order === 'asc' ? 1 : -1;

    const filter: Record<string, any> = {};
    const search = (opts.search || '').trim();
    if (search && opts.searchFields?.length) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = opts.searchFields.map((f) => ({ [f]: rx }));
    }

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ [sortField]: sortDir, _id: sortDir })
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  // single → 404 if missing
  async get(id: string): Promise<any> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException({ message: 'Not found' });
    return doc;
  }

  // create → strip id/_id, return created doc
  async create(body: any): Promise<any> {
    const data = { ...body };
    delete data.id;
    delete data._id;
    return this.model.create(data);
  }

  // update → strip id/_id, run validators, 404 if missing
  async update(id: string, body: any): Promise<any> {
    const data = { ...body };
    delete data.id;
    delete data._id;
    const doc = await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new NotFoundException({ message: 'Not found' });
    return doc;
  }

  // delete → 404 if missing, else { id, deleted: true }
  async remove(id: string): Promise<any> {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException({ message: 'Not found' });
    return { id, deleted: true };
  }
}
