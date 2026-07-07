/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { CustomerService } from '../services/customer.service';
import { TenantService } from '../services/tenant.service';

// Public (no-auth) endpoints — used by the shareable customer self-registration
// form. The tenant is identified by the `tenantId` baked into the form link and
// must be an active subscriber. Only a strict, whitelisted set of fields is kept.
@Controller('public')
export class PublicController {
  constructor(
    private readonly customers: CustomerService,
    private readonly tenants: TenantService,
  ) {}

  // POST /api/public/customers  → create a customer from the self-service form
  @Post('customers')
  async createCustomer(@Body() body: any) {
    const str = (k: string) => (typeof body?.[k] === 'string' ? body[k].trim() : '');
    const tenantId = str('tenantId');
    await this.tenants.assertActive(tenantId); // 403 if the link's tenant is invalid / lapsed
    const name = str('name');
    const mobile = str('mobile');
    if (!name || !mobile) throw new BadRequestException({ message: 'Name and mobile number are required.' });
    const saved = await this.customers.create(
      {
        name,
        mobile,
        address: str('address'),
        aadhaar: str('aadhaar'),
        license: str('license'),
        emergencyContact: str('emergencyContact'),
        blacklist: false,
        documents: [],
      },
      tenantId,
    );
    // return only a confirmation — never leak the full record on a public route
    return { ok: true, id: saved.id };
  }
}
