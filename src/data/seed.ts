import type { Customer, Order, OrderItem, PayMethod, Product } from '../types';

/* All data here is fictional sample data. Prices are in BDT (৳). */

// name | strength | generic | manufacturer | category | form | unit price
const RAW = `
Napa|500mg|Paracetamol|Beximco|Pain Relievers|Tablet|1.5
Napa Extra|665mg|Paracetamol + Caffeine|Beximco|Pain Relievers|Tablet|2.5
Ace|500mg|Paracetamol|Square|Pain Relievers|Tablet|1.2
Ace Plus|500mg|Paracetamol + Caffeine|Square|Pain Relievers|Tablet|2.2
Brufen|400mg|Ibuprofen|Square|Pain Relievers|Tablet|4
Tory|90mg|Etoricoxib|Square|Pain Relievers|Tablet|15
Seclo|20mg|Omeprazole|Square|Gastric|Capsule|6
Maxpro|20mg|Esomeprazole|Renata|Gastric|Tablet|7
Losectil|20mg|Omeprazole|Eskayef|Gastric|Capsule|6.5
Pantonix|20mg|Pantoprazole|Square|Gastric|Tablet|6
Antacid Plus|200ml|Aluminium + Magnesium|Beximco|Gastric|Syrup|85
Fexo|120mg|Fexofenadine|Square|Allergy Medication|Tablet|8
Alatrol|10mg|Cetirizine|Square|Allergy Medication|Tablet|2.5
Monas|10mg|Montelukast|Acme|Allergy Medication|Tablet|14
Lorin|10mg|Loratadine|Beximco|Allergy Medication|Tablet|3
Moxacil|500mg|Amoxicillin|Square|Antibiotics|Capsule|8
Ciprocin|500mg|Ciprofloxacin|Square|Antibiotics|Tablet|10
Zimax|500mg|Azithromycin|Square|Antibiotics|Tablet|35
Cef-3|200mg|Cefixime|Square|Antibiotics|Capsule|28
Doxicap|100mg|Doxycycline|Renata|Antibiotics|Capsule|7
Filmet|400mg|Metronidazole|Beximco|Antibiotics|Tablet|2.5
Glucomin|500mg|Metformin|Aristopharma|Diabetes Care|Tablet|3
Reclide|80mg|Gliclazide|Square|Diabetes Care|Tablet|4.5
Sitagil|50mg|Sitagliptin|Incepta|Diabetes Care|Tablet|22
Insulin Pen|100IU/ml|Human Insulin|Novo Nordisk|Diabetes Care|Injection|650
Angilock|50mg|Losartan|Square|Cardiovascular|Tablet|6
Amlo|5mg|Amlodipine|Square|Cardiovascular|Tablet|3
Atova|10mg|Atorvastatin|Square|Cardiovascular|Tablet|9
Bisocor|5mg|Bisoprolol|Incepta|Cardiovascular|Tablet|6
Plagrin|75mg|Clopidogrel|Square|Cardiovascular|Tablet|6
Ventolin|100mcg|Salbutamol|GSK|Respiratory Medicines|Inhaler|220
Sultolin|4mg|Salbutamol|Square|Respiratory Medicines|Tablet|1.2
Expec|100ml|Bromhexine|Square|Respiratory Medicines|Syrup|70
Bricanyl|2.5mg|Terbutaline|AstraZeneca|Respiratory Medicines|Tablet|5
Calbo-D|500mg|Calcium + Vitamin D3|Square|Vitamins & Supplements|Tablet|8
Ostocal-D|600mg|Calcium + Vitamin D3|Eskayef|Vitamins & Supplements|Tablet|9
Ceevit|250mg|Vitamin C|Square|Vitamins & Supplements|Tablet|2.5
D-Rise|2000IU|Vitamin D3|Square|Vitamins & Supplements|Capsule|12
Zinc Plus|20mg|Zinc Sulphate|Renata|Vitamins & Supplements|Tablet|3.5
B-Plex||Vitamin B Complex|Square|Vitamins & Supplements|Tablet|2
Orsaline-N||ORS Saline|Square|Vitamins & Supplements|Sachet|5
Virux|400mg|Acyclovir|Square|Antiviral Drugs|Tablet|12
Tamivir|75mg|Oseltamivir|Square|Antiviral Drugs|Capsule|60
Entavir|0.5mg|Entecavir|Beacon|Antiviral Drugs|Tablet|45
Valvir|500mg|Valacyclovir|Incepta|Antiviral Drugs|Tablet|38
`.trim();

export const CATEGORIES = [
  'Antibiotics',
  'Pain Relievers',
  'Vitamins & Supplements',
  'Antiviral Drugs',
  'Diabetes Care',
  'Cardiovascular',
  'Allergy Medication',
  'Respiratory Medicines',
  'Gastric',
];

export const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler', 'Sachet', 'Cream', 'Drops', 'Other'];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const iso = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(d);

export function makeProducts(): Product[] {
  const r = rng(42);
  const now = new Date();
  return RAW.split('\n').map((line, i) => {
    const [name, strength, generic, manufacturer, category, form, priceStr] = line.split('|');
    const price = Number(priceStr);
    const cost = Math.round(price * 0.74 * 100) / 100;
    const reorder = price > 100 ? 5 : 40;
    // Mix of healthy, low, out-of-stock, expiring-soon and expired stock
    let qty = Math.round((r() * 6 + 1.5) * reorder);
    let expiry = addDays(now, 120 + Math.floor(r() * 600));
    if (i % 11 === 3) qty = Math.floor(r() * reorder * 0.8) + 1; // low
    if (i % 13 === 5) qty = 0; // out
    if (i % 9 === 7) expiry = addDays(now, 8 + Math.floor(r() * 70)); // expiring soon
    if (i === 20) expiry = addDays(now, -20); // expired
    return {
      id: 'P' + String(i + 1).padStart(3, '0'),
      name,
      strength,
      generic,
      manufacturer,
      category,
      form,
      unit: form === 'Syrup' || form === 'Inhaler' || form === 'Injection' ? 'pcs' : form === 'Sachet' ? 'sachet' : 'pcs',
      barcode: '88' + String(10000000000 + i * 7919).slice(0, 11),
      batch: 'B' + (2400 + i * 3),
      expiry: iso(expiry),
      cost,
      price,
      qty,
      reorder,
      shelf: 'R' + (1 + (i % 6)) + '-' + String.fromCharCode(65 + (i % 5)),
    };
  });
}

const NAMES = [
  'Rahim Uddin', 'Karima Begum', 'Sabbir Hossain', 'Nusrat Jahan', 'Tanvir Ahmed',
  'Farhana Akter', 'Mahmudul Hasan', 'Sumaiya Islam', 'Arif Chowdhury', 'Shirin Sultana',
  'Imran Khan', 'Rokeya Khatun', 'Jahid Hasan', 'Mim Akter', 'Shafiqul Islam',
  'Taslima Nasrin', 'Kamrul Hasan', 'Lamia Rahman', 'Nasir Uddin', 'Popy Das',
  'Habib Rahman', 'Ayesha Siddika', 'Monir Hossain', 'Rima Chakma', 'Delwar Hossain',
];

export function makeCustomers(): Customer[] {
  const r = rng(7);
  const prefixes = ['013', '014', '015', '016', '017', '018', '019'];
  return NAMES.map((name, i) => ({
    id: 'C' + String(i + 1).padStart(3, '0'),
    name,
    phone: '+880' + '1' + prefixes[Math.floor(r() * prefixes.length)].slice(2) + String(Math.floor(r() * 90000000) + 10000000),
  }));
}

export function makeOrders(products: Product[], customers: Customer[]): Order[] {
  const r = rng(99);
  const now = new Date();
  const methods: PayMethod[] = ['Cash', 'Cash', 'Cash', 'bKash', 'bKash', 'Nagad', 'Card', 'Rocket', 'Bank Transfer', 'Due'];
  const orders: Order[] = [];
  const total = 60;
  for (let n = 1; n <= total; n++) {
    // spread across last 30 days, always a few "today"
    const daysAgo = n <= 6 ? 0 : Math.floor(r() * 30);
    const d = addDays(now, -daysAgo);
    d.setHours(9 + Math.floor(r() * 12), Math.floor(r() * 60), 0, 0);
    if (daysAgo === 0 && d.getTime() > now.getTime()) d.setTime(now.getTime() - n * 600000);

    const lineCount = 1 + Math.floor(r() * 3);
    const items: OrderItem[] = [];
    const picked = new Set<number>();
    for (let k = 0; k < lineCount; k++) {
      const idx = Math.floor(r() * products.length);
      if (picked.has(idx)) continue;
      picked.add(idx);
      const p = products[idx];
      const qty = p.price > 100 ? 1 : 1 + Math.floor(r() * 10);
      items.push({ productId: p.id, name: p.name, strength: p.strength, qty, price: p.price, cost: p.cost });
    }
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const discount = r() < 0.2 ? Math.round(subtotal * 0.05) : 0;
    const totalAmt = Math.round((subtotal - discount) * 100) / 100;
    const method = methods[Math.floor(r() * methods.length)];
    const walkIn = r() < 0.35;
    const cust = walkIn ? undefined : customers[Math.floor(r() * customers.length)];
    const roll = r();
    let status: Order['status'] = 'Completed';
    let payStatus: Order['payStatus'] = method === 'Due' ? 'Due' : 'Paid';
    if (roll > 0.93) { status = 'Cancelled'; payStatus = 'Failed'; }
    else if (roll > 0.86) { status = 'In progress'; payStatus = 'Pending'; }
    else if (roll > 0.8) { status = 'Pending'; payStatus = 'Pending'; }
    orders.push({
      id: 'ORD' + String(n).padStart(3, '0'),
      invoiceNo: 'INV-' + (1000 + n),
      date: d.toISOString(),
      customerId: cust?.id,
      customerName: cust?.name ?? 'Walk-in',
      customerPhone: cust?.phone,
      items,
      subtotal,
      discount,
      vat: 0,
      total: totalAmt,
      paid: payStatus === 'Paid' ? totalAmt : 0,
      method,
      payStatus,
      status,
      cashier: 'Admin',
    });
  }
  return orders.sort((a, b) => b.date.localeCompare(a.date));
}

export function seedAll() {
  const products = makeProducts();
  const customers = makeCustomers();
  const orders = makeOrders(products, customers);
  return { products, customers, orders };
}
