import type { Role } from '../types';

/** Which routes each role may open. Admin = everything. */
const ALLOWED: Record<Role, string[] | 'all'> = {
  Admin: 'all',
  Pharmacist: ['/', '/products', '/orders', '/pos', '/sales', '/customers', '/payments', '/suppliers', '/reports', '/help'],
  Cashier: ['/pos', '/orders', '/customers', '/payments', '/help'],
};

export function canOpen(role: Role, path: string): boolean {
  const a = ALLOWED[role];
  return a === 'all' || a.includes(path);
}

export const homeFor = (role: Role) => (role === 'Cashier' ? '/pos' : '/');
