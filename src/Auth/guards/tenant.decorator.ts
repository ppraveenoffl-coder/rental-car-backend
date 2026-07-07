/* eslint-disable @typescript-eslint/no-explicit-any */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// @TenantId() → the tenant the authenticated user belongs to (from the JWT).
// This is the single source of truth for data isolation; never trust a
// tenant id sent from the client on authenticated routes.
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req: any = ctx.switchToHttp().getRequest();
  return req.user?.tenantId;
});

// @CurrentUser() → the full req.user object resolved by the JWT strategy.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req: any = ctx.switchToHttp().getRequest();
  return req.user;
});
