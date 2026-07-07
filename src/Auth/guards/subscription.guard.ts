/* eslint-disable @typescript-eslint/no-explicit-any */
import { CanActivate, ExecutionContext, HttpException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../utils/enum/roles.enum';
import { ALLOW_EXPIRED_KEY } from './auth.decorator';

// Blocks a tenant's users once their subscription has lapsed or been suspended.
// Reads the subscription summary already attached to req.user by the JWT strategy
// (no extra DB hit). Super-admins and routes marked @AllowExpired() pass through.
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowExpired = this.reflector.getAllAndOverride<boolean>(ALLOW_EXPIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowExpired) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || user.role === Role.SUPERADMIN || !user.tenantId) return true;

    const sub = user.subscription;
    if (sub && (sub.expired || sub.suspended)) {
      throw new HttpException(
        { message: 'Your subscription is inactive. Please renew to continue.', code: 'SUBSCRIPTION_INACTIVE' },
        402,
      );
    }
    return true;
  }
}
