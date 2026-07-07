// Roles for the car-rental system.
// SUPERADMIN is the SaaS operator (you) — manages tenants & subscriptions and is
// NOT scoped to any single tenant. ADMIN/STAFF belong to one tenant.
export enum Role {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  STAFF = 'staff',
}
