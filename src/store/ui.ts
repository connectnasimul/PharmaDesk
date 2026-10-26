import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { Role } from '../types';

export interface Toast {
  id: number;
  text: string;
  tone: 'success' | 'error' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

export interface PrintJob {
  page: string; // CSS @page size e.g. 'A4' or '58mm auto'
  node: ReactNode;
}

interface UI {
  role: Role | null;
  setRole: (r: Role | null) => void;
  paletteOpen: boolean;
  setPalette: (v: boolean) => void;
  tourOpen: boolean;
  setTour: (v: boolean) => void;
  printJob: PrintJob | null;
  print: (job: PrintJob) => void;
  clearPrint: () => void;
  toasts: Toast[];
  mobileMenu: boolean;
  collapsed: boolean;
  query: string;
  toast: (text: string, tone?: Toast['tone'], action?: { label: string; run: () => void }) => void;
  dismiss: (id: number) => void;
  setMobileMenu: (v: boolean) => void;
  toggleCollapsed: () => void;
  setQuery: (q: string) => void;
}

let n = 1;

export const useUI = create<UI>((set, get) => ({
  role: null,
  setRole: (role) => set({ role }),
  paletteOpen: false,
  setPalette: (paletteOpen) => set({ paletteOpen }),
  tourOpen: false,
  setTour: (tourOpen) => set({ tourOpen }),
  printJob: null,
  print: (job) => set({ printJob: job }),
  clearPrint: () => set({ printJob: null }),
  toasts: [],
  mobileMenu: false,
  collapsed: false,
  query: '',
  toast: (text, tone = 'success', action) => {
    const id = n++;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone, actionLabel: action?.label, onAction: action?.run }] }));
    setTimeout(() => get().dismiss(id), action ? 6000 : 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setMobileMenu: (v) => set({ mobileMenu: v }),
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setQuery: (q) => set({ query: q }),
}));
