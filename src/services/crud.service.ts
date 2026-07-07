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

  // Every method is scoped to a tenant — `tenantId` comes from the JWT (see the
  // @TenantId() decorator) and is mixed into every filter so one tenant can never
  // read or write another tenant's documents, even by guessing an _id.
  private scope(tenantId: string, extra: Record<string, any> = {}): Record<string, any> {
    return { tenantId, ...extra };
  }

  // list → newest first (full collection for this tenant; used by the in-memory store)
  async list(tenantId: string): Promise<any> {
    return this.model.find(this.scope(tenantId)).sort({ createdAt: -1 });
  }

  // paginated + sorted + searched list → { data, total, page, limit, totalPages }
  // `search` is regex-matched (case-insensitive) against the supplied searchFields.
  async listPaged(opts: ListQuery, tenantId: string): Promise<PagedResult<any>> {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(opts.limit) || 10));
    const sortField = opts.sort || 'createdAt';
    const sortDir = opts.order === 'asc' ? 1 : -1;

    const filter: Record<string, any> = this.scope(tenantId);
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

  // single → 404 if missing or owned by another tenant
  async get(id: string, tenantId: string): Promise<any> {
    const doc = await this.model.findOne(this.scope(tenantId, { _id: id }));
    if (!doc) throw new NotFoundException({ message: 'Not found' });
    return doc;
  }

  // create → strip id/_id, stamp the tenant, return created doc
  async create(body: any, tenantId: string): Promise<any> {
    const data = { ...body };
    delete data.id;
    delete data._id;
    data.tenantId = tenantId; // force — never trust a client-supplied tenantId
    return this.model.create(data);
  }

  // update → strip id/_id, run validators, 404 if missing / other tenant
  async update(id: string, body: any, tenantId: string): Promise<any> {
    const data = { ...body };
    delete data.id;
    delete data._id;
    delete data.tenantId; // immutable
    const doc = await this.model.findOneAndUpdate(this.scope(tenantId, { _id: id }), data, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new NotFoundException({ message: 'Not found' });
    return doc;
  }

  // delete → 404 if missing / other tenant, else { id, deleted: true }
  async remove(id: string, tenantId: string): Promise<any> {
    const doc = await this.model.findOneAndDelete(this.scope(tenantId, { _id: id }));
    if (!doc) throw new NotFoundException({ message: 'Not found' });
    return { id, deleted: true };
  }
}
