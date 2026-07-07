/* eslint-disable @typescript-eslint/no-explicit-any */
import { Body, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Auth } from '../Auth/guards/auth.decorator';
import { TenantId } from '../Auth/guards/tenant.decorator';
import { Role } from '../utils/enum/roles.enum';
import { CrudService } from '../services/crud.service';

// Base controller giving every resource the standard REST verbs with the
// default permission policy (write = admin+staff, delete = admin).
// Every call is scoped to the caller's tenant (from the JWT).
// Resources with a different policy (e.g. vehicles) override the methods.
export abstract class CrudController<T> {
  protected constructor(protected readonly service: CrudService<T>) {}

  // GET /resource             → full array (back-compat: in-memory store)
  // GET /resource?page=1&...  → { data, total, page, limit, totalPages }
  @Get()
  @Auth()
  list(@Query() query: any, @TenantId() tenantId: string): Promise<any> {
    if (query && query.page !== undefined) {
      return this.service.listPaged(
        {
          page: query.page,
          limit: query.limit,
          sort: query.sort,
          order: query.order,
          search: query.search,
          searchFields: query.searchFields
            ? String(query.searchFields)
                .split(',')
                .map((f) => f.trim())
                .filter(Boolean)
            : undefined,
        },
        tenantId,
      );
    }
    return this.service.list(tenantId);
  }

  @Get(':id')
  @Auth()
  get(@Param('id') id: string, @TenantId() tenantId: string): Promise<any> {
    return this.service.get(id, tenantId);
  }

  @Post()
  @Auth(Role.ADMIN, Role.STAFF)
  create(@Body() body: any, @TenantId() tenantId: string): Promise<any> {
    return this.service.create(body, tenantId);
  }

  @Put(':id')
  @Auth(Role.ADMIN, Role.STAFF)
  update(@Param('id') id: string, @Body() body: any, @TenantId() tenantId: string): Promise<any> {
    return this.service.update(id, body, tenantId);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  remove(@Param('id') id: string, @TenantId() tenantId: string): Promise<any> {
    return this.service.remove(id, tenantId);
  }
}
