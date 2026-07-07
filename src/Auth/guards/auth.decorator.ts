import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from '../../utils/enum/roles.enum';
import { RolesGuard } from './roles.guard';
import { SubscriptionGuard } from './subscription.guard';
import { JwtAuthGuard } from '../jwt-auth.guard';

export const ROLES_KEY = 'roles';
export const ALLOW_EXPIRED_KEY = 'allowExpired';

// @AllowExpired() → route stays reachable even when the subscription has lapsed
// (e.g. /auth/me, so the app can detect the lapse and show the renew screen).
export const AllowExpired = () => SetMetadata(ALLOW_EXPIRED_KEY, true);

// @Auth()            → requires a valid token + an active subscription
// @Auth(Role.ADMIN)  → also requires one of the given roles
export function Auth(...role: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, role.length ? role : null),
    UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard),
  );
}
