export const ROLES = ['owner', 'manager', 'packer', 'support'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSION_GROUPS = [
  { id: 'orders', permissions: ['orders.view', 'orders.update', 'orders.cancel'] },
  { id: 'products', permissions: ['products.view', 'products.edit', 'products.delete'] },
  { id: 'customers', permissions: ['customers.view', 'customers.edit', 'customers.export'] },
  { id: 'settings', permissions: ['settings.view', 'settings.edit', 'settings.roles'] },
] as const;

export const ALL_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) => [...g.permissions]);

export type Matrix = Record<Role, string[]>;

const defaults = (): Matrix => ({
  owner: [...ALL_PERMISSIONS],
  manager: ALL_PERMISSIONS.filter((p) => !p.startsWith('settings.')),
  packer: ['orders.view', 'orders.update', 'products.view'],
  support: ['orders.view', 'customers.view', 'customers.edit'],
});

export function getMatrix(): Matrix {
  const g = globalThis as typeof globalThis & { __hirafRoles?: Matrix };
  return (g.__hirafRoles ??= defaults());
}

export function saveMatrix(next: Matrix): Matrix {
  const g = globalThis as typeof globalThis & { __hirafRoles?: Matrix };
  g.__hirafRoles = next;
  return next;
}
