import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer, Order, OrderItem, PayMethod, Payment, Product, Purchase, PurchaseItem, PurchaseReturn, Settings, Supplier } from '../types';
import { makeProducts, seedAll } from '../data/seed';

export const defaultSettings: Settings = {
  lang: 'en',
  theme: 'light',
  bnDigits: false,
  paper: '80mm',
  vat: 0,
  copies: 1,
  showQr: true,
  showWords: true,
  footer: 'Thank you! Get well soon.\nMedicines once sold are not returnable without a receipt.',
  lock: false,
  pins: { Admin: '1234', Pharmacist: '2222', Cashier: '3333' },
  toured: false,
  refillDays: 30,
  pharmacy: {
    name: 'PharmaDesk Pharmacy',
    address: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
    phone: '+8801700-000000',
    license: 'DL-000000',
    bin: '000000000-0000',
  },
};

export interface NewOrderInput {
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paid: number;
  method: PayMethod;
  doctor?: string;
}

export const seedSuppliers = (): Supplier[] => [
  { id: 'S001', name: 'Square Distribution Ltd.', phone: '+8801711-000001', address: 'Mirpur, Dhaka' },
  { id: 'S002', name: 'Beximco Pharma Depot', phone: '+8801711-000002', address: 'Tejgaon, Dhaka' },
  { id: 'S003', name: 'Incepta Agency', phone: '+8801711-000003', address: 'Zirabo, Savar' },
  { id: 'S004', name: 'Renata Wholesale', phone: '+8801711-000004', address: 'Mohakhali, Dhaka' },
  { id: 'S005', name: 'Aristopharma Supply', phone: '+8801711-000005', address: 'Shampur, Dhaka' },
];

interface State {
  suppliers: Supplier[];
  purchases: Purchase[];
  payments: Payment[];
  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  createPurchase: (input: { supplierId: string; items: PurchaseItem[]; paid: number }) => Purchase | null;
  paySupplier: (purchaseId: string, amount: number) => void;
  returnPurchase: (purchaseId: string, lines: { productId: string; qty: number }[]) => number;
  collectDue: (orderId: string, amount: number, method: PayMethod) => void;
  settings: Settings;
  products: Product[];
  customers: Customer[];
  orders: Order[];

  setSettings: (patch: Partial<Settings>) => void;
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (c: Omit<Customer, 'id'>) => Customer;
  createOrder: (input: NewOrderInput) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  restoreOrder: (o: Order) => void;
  restoreProduct: (p: Product) => void;
  importProducts: (rows: Product[]) => number;
  addSampleProducts: () => number;
  resetDemo: () => void;
  importData: (json: string) => boolean;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      ...seedAll(),
      suppliers: seedSuppliers(),
      purchases: [],
      payments: [],

      addSupplier: (sp) =>
        set((s) => ({ suppliers: [...s.suppliers, { ...sp, id: 'S' + String(s.suppliers.length + 1).padStart(3, '0') + Date.now().toString(36).slice(-2).toUpperCase() }] })),

      createPurchase: ({ supplierId, items, paid }) => {
        const s = get();
        const sup = s.suppliers.find((x) => x.id === supplierId);
        if (!sup || !items.length) return null;
        const total = items.reduce((a, i) => a + i.qty * i.cost, 0);
        const purchase: Purchase = {
          id: 'PUR' + String(s.purchases.length + 1).padStart(3, '0'),
          date: new Date().toISOString(),
          supplierId,
          supplierName: sup.name,
          items,
          total,
          paid: Math.min(paid, total),
        };
        const add = new Map<string, PurchaseItem>();
        items.forEach((i) => add.set(i.productId, i));
        set({
          purchases: [purchase, ...s.purchases],
          // stock goes up and the latest purchase price is remembered
          products: s.products.map((p) => (add.has(p.id) ? { ...p, qty: p.qty + (add.get(p.id) as PurchaseItem).qty, cost: (add.get(p.id) as PurchaseItem).cost } : p)),
        });
        return purchase;
      },

      paySupplier: (purchaseId, amount) =>
        set((s) => ({
          purchases: s.purchases.map((p) => {
            if (p.id !== purchaseId) return p;
            const net = p.total - (p.returns ?? []).reduce((a, r) => a + r.amount, 0);
            return { ...p, paid: Math.min(Math.max(net, p.paid), p.paid + amount) };
          }),
        })),

      // Send items back to the supplier: stock goes down, the amount owed goes down
      returnPurchase: (purchaseId, lines) => {
        const s = get();
        const pur = s.purchases.find((x) => x.id === purchaseId);
        if (!pur) return 0;
        const made: PurchaseReturn[] = [];
        const stockDown = new Map<string, number>();
        lines.forEach((l) => {
          const item = pur.items.find((i) => i.productId === l.productId);
          const prod = s.products.find((p) => p.id === l.productId);
          if (!item || !prod || l.qty <= 0) return;
          const already = (pur.returns ?? []).filter((r) => r.productId === l.productId).reduce((a, r) => a + r.qty, 0);
          const qty = Math.min(l.qty, item.qty - already, prod.qty);
          if (qty <= 0) return;
          made.push({ date: new Date().toISOString(), productId: item.productId, name: item.name, qty, amount: qty * item.cost });
          stockDown.set(item.productId, qty);
        });
        if (!made.length) return 0;
        set({
          purchases: s.purchases.map((x) => (x.id === purchaseId ? { ...x, returns: [...(x.returns ?? []), ...made] } : x)),
          products: s.products.map((p) => (stockDown.has(p.id) ? { ...p, qty: p.qty - (stockDown.get(p.id) as number) } : p)),
        });
        return made.reduce((a, r) => a + r.amount, 0);
      },

      collectDue: (orderId, amount, method) => {
        const s = get();
        const o = s.orders.find((x) => x.id === orderId);
        if (!o || amount <= 0) return;
        const paid = Math.min(o.total, o.paid + amount);
        const pay: Payment = { id: 'TXN' + String(s.payments.length + 1).padStart(3, '0'), date: new Date().toISOString(), orderId, customerName: o.customerName, amount: Math.min(amount, o.total - o.paid), method };
        set({
          payments: [pay, ...s.payments],
          orders: s.orders.map((x) => (x.id === orderId ? { ...x, paid, payStatus: paid >= x.total ? 'Paid' : 'Due' } : x)),
        });
      },

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      saveProduct: (p) =>
        set((s) => {
          const exists = s.products.some((x) => x.id === p.id);
          return { products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] };
        }),

      // Adds the built-in sample catalogue without touching existing products (matched by name + strength)
      addSampleProducts: () => {
        const s = get();
        const key = (p: Product) => (p.name + '|' + p.strength).toLowerCase();
        const have = new Set(s.products.map(key));
        const fresh = makeProducts().filter((p) => !have.has(key(p)));
        let max = s.products.reduce((m, p) => Math.max(m, Number(p.id.replace(/\D/g, '')) || 0), 0);
        const added = fresh.map((p) => ({ ...p, id: 'P' + String(++max).padStart(3, '0') }));
        if (added.length) set({ products: [...s.products, ...added] });
        return added.length;
      },

      importProducts: (rows) => {
        const s = get();
        let max = s.products.reduce((m, p) => Math.max(m, Number(p.id.replace(/\D/g, '')) || 0), 0);
        const added = rows.map((r) => ({ ...r, id: 'P' + String(++max).padStart(3, '0') }));
        set({ products: [...added, ...s.products] });
        return added.length;
      },

      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      restoreProduct: (p) => set((s) => ({ products: [p, ...s.products.filter((x) => x.id !== p.id)] })),

      addCustomer: (c) => {
        const n = get().customers.length + 1;
        const customer: Customer = { ...c, id: 'C' + String(n).padStart(3, '0') + Date.now().toString(36).slice(-2).toUpperCase() };
        set((s) => ({ customers: [customer, ...s.customers] }));
        return customer;
      },

      createOrder: (input) => {
        const s = get();
        const next = s.orders.reduce((m, o) => Math.max(m, Number(o.id.replace(/\D/g, '')) || 0), 0) + 1;
        const due = input.method === 'Due';
        const order: Order = {
          id: 'ORD' + String(next).padStart(3, '0'),
          invoiceNo: 'INV-' + (1000 + next),
          date: new Date().toISOString(),
          customerId: input.customerId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          items: input.items,
          subtotal: input.subtotal,
          discount: input.discount,
          vat: input.vat,
          total: input.total,
          paid: input.paid,
          method: input.method,
          payStatus: due ? 'Due' : 'Paid',
          status: 'Completed',
          cashier: 'Admin',
          doctor: input.doctor,
        };
        // deduct stock
        const sold = new Map<string, number>();
        input.items.forEach((i) => sold.set(i.productId, (sold.get(i.productId) ?? 0) + i.qty));
        set({
          orders: [order, ...s.orders],
          products: s.products.map((p) => (sold.has(p.id) ? { ...p, qty: Math.max(0, p.qty - (sold.get(p.id) as number)) } : p)),
        });
        return order;
      },

      updateOrder: (id, patch) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      deleteOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
      restoreOrder: (o) =>
        set((s) => ({ orders: [o, ...s.orders.filter((x) => x.id !== o.id)].sort((a, b) => b.date.localeCompare(a.date)) })),

      resetDemo: () => set({ ...seedAll(), suppliers: seedSuppliers(), purchases: [], payments: [] }),

      importData: (json) => {
        try {
          const d = JSON.parse(json);
          if (!Array.isArray(d.products) || !Array.isArray(d.orders) || !Array.isArray(d.customers)) return false;
          set({
            products: d.products,
            orders: d.orders,
            customers: d.customers,
            settings: d.settings ? { ...defaultSettings, ...d.settings } : get().settings,
            suppliers: d.suppliers ?? get().suppliers,
            purchases: d.purchases ?? [],
            payments: d.payments ?? [],
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'pharmadesk-v1',
      version: 3,
      migrate: (p: any) => p,
      // keep new settings keys when older saved data lacks them
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted ?? {}),
        settings: { ...current.settings, ...(persisted?.settings ?? {}), pins: { ...current.settings.pins, ...(persisted?.settings?.pins ?? {}) } },
      }),
    }
  )
);
