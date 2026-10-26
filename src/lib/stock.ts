import type { Product } from '../types';

export type StockStatus = 'in' | 'low' | 'out' | 'expired' | 'expiring';

export function daysToExpiry(iso: string): number {
  return Math.ceil((new Date(iso + 'T23:59:59').getTime() - Date.now()) / 86400000);
}

export function stockStatus(p: Product, expiryWindow = 90): StockStatus {
  if (daysToExpiry(p.expiry) < 0) return 'expired';
  if (p.qty <= 0) return 'out';
  if (p.qty <= p.reorder) return 'low';
  if (daysToExpiry(p.expiry) <= expiryWindow) return 'expiring';
  return 'in';
}

/** Same generic name, in stock, not expired — suggested when an item is unavailable */
export function substitutes(all: Product[], p: Product): Product[] {
  return all.filter(
    (x) => x.id !== p.id && x.generic.toLowerCase() === p.generic.toLowerCase() && x.qty > 0 && daysToExpiry(x.expiry) >= 0
  );
}

export function isSellable(p: Product): boolean {
  return p.qty > 0 && daysToExpiry(p.expiry) >= 0;
}
