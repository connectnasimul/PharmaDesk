export type Lang = 'en' | 'bn';
export type Theme = 'light' | 'dark' | 'system';
export type Paper = '58mm' | '80mm' | 'A4';
export type Role = 'Admin' | 'Pharmacist' | 'Cashier';

export interface Product {
  id: string;
  name: string;
  strength: string;
  generic: string;
  manufacturer: string;
  category: string;
  form: string;
  unit: string;
  barcode: string;
  batch: string;
  expiry: string; // YYYY-MM-DD
  cost: number;
  price: number;
  qty: number;
  reorder: number;
  shelf: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  strength: string;
  qty: number;
  price: number;
  cost: number;
}

export type PayMethod = 'Cash' | 'bKash' | 'Nagad' | 'Rocket' | 'Card' | 'Bank Transfer' | 'Due';
export type PayStatus = 'Paid' | 'Pending' | 'Failed' | 'Due';
export type OrderStatus = 'Completed' | 'In progress' | 'Pending' | 'Cancelled';

export interface Order {
  id: string;
  invoiceNo: string;
  date: string; // ISO
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
  payStatus: PayStatus;
  status: OrderStatus;
  cashier: string;
  doctor?: string;
}

export interface PharmacyProfile {
  name: string;
  address: string;
  phone: string;
  license: string;
  bin: string;
}

export interface Settings {
  lang: Lang;
  theme: Theme;
  bnDigits: boolean;
  paper: Paper;
  vat: number;
  copies: number;
  showQr: boolean;
  showWords: boolean;
  footer: string;
  pharmacy: PharmacyProfile;
  lock: boolean;
  pins: Record<Role, string>;
  toured: boolean;
  refillDays: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  qty: number;
  cost: number;
}

export interface PurchaseReturn {
  date: string;
  productId: string;
  name: string;
  qty: number;
  amount: number;
}

export interface Purchase {
  returns?: PurchaseReturn[];
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  paid: number;
}

export interface Payment {
  id: string;
  date: string;
  orderId: string;
  customerName: string;
  amount: number;
  method: PayMethod;
}
