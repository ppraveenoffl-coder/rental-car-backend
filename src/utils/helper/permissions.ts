import { Role } from '../enum/roles.enum';

// Per-resource permission policy (ported 1:1 from the Express crudRouter).
//   write:  roles allowed to create/update
//   remove: roles allowed to delete
// read is allowed to any authenticated user.
// Staff = "operational only": can write most things, cannot delete,
// and vehicles are view-only for staff.
export interface ResourcePolicy {
  write: Role[];
  remove: Role[];
}

const POLICY: Record<string, ResourcePolicy> = {
  vehicles: { write: [Role.ADMIN], remove: [Role.ADMIN] },
  default: { write: [Role.ADMIN, Role.STAFF], remove: [Role.ADMIN] },
};

export const policyFor = (resource: string): ResourcePolicy =>
  POLICY[resource] || POLICY.default;
