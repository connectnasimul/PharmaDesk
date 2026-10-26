import { useStore } from '../store';
import { useUI } from '../store/ui';
import type { Role } from '../types';

/** Effective role: everyone is Admin while the PIN lock is off. null = locked. */
export function useRole(): Role | null {
  const lock = useStore((s) => s.settings.lock);
  const role = useUI((s) => s.role);
  return lock ? role : 'Admin';
}
