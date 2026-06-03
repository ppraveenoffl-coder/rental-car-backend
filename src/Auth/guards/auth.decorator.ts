import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from '../../utils/enum/roles.enum';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from '../jwt-auth.guard';

export const ROLES_KEY = 'roles';

// @Auth()            → just requires a valid token
// @Auth(Role.ADMIN)  → requires a valid token AND one of the given roles
export function Auth(...role: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, role.length ? role : null),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
