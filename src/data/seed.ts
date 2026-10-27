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
Napa Extend|665mg|Paracetamol|Beximco|Pain Relievers|Tablet|2
Napa|60ml|Paracetamol|Beximco|Pain Relievers|Syrup|35
Clofenac|50mg|Diclofenac Sodium|Square|Pain Relievers|Tablet|4
Aceclo|100mg|Aceclofenac|Square|Pain Relievers|Tablet|6
Naprox|500mg|Naproxen|Square|Pain Relievers|Tablet|8
Torax|10mg|Ketorolac|Square|Pain Relievers|Tablet|12
Maxgalin|75mg|Pregabalin|Square|Pain Relievers|Capsule|12
Gabatin|300mg|Gabapentin|Square|Pain Relievers|Capsule|10
Diclofen Gel|20g|Diclofenac|Square|Pain Relievers|Cream|90
Nexum|20mg|Esomeprazole|Square|Gastric|Tablet|7
Sergel|20mg|Esomeprazole|Healthcare|Gastric|Capsule|7
Rablet|20mg|Rabeprazole|Square|Gastric|Tablet|6
Motigut|10mg|Domperidone|Square|Gastric|Tablet|3
Motigut|60ml|Domperidone|Square|Gastric|Syrup|55
Emistat|4mg|Ondansetron|Square|Gastric|Tablet|5
Imotil|2mg|Loperamide|Square|Gastric|Capsule|3
Lactulose Syrup|100ml|Lactulose|Square|Gastric|Syrup|180
Bisalax|5mg|Bisacodyl|Beximco|Gastric|Tablet|2
Deslor|5mg|Desloratadine|Square|Allergy Medication|Tablet|6
Levocet|5mg|Levocetirizine|Square|Allergy Medication|Tablet|5
Chlorphen|4mg|Chlorpheniramine|Square|Allergy Medication|Tablet|1
Alatrol|60ml|Cetirizine|Square|Allergy Medication|Syrup|55
Moxaclav|625mg|Amoxicillin + Clavulanic Acid|Square|Antibiotics|Tablet|35
Moxacil|100ml|Amoxicillin|Square|Antibiotics|Syrup|75
Leovox|500mg|Levofloxacin|Square|Antibiotics|Tablet|22
Azin|500mg|Azithromycin|Beximco|Antibiotics|Tablet|32
Cefim|200mg|Cefixime|Beximco|Antibiotics|Capsule|26
Clarimax|500mg|Clarithromycin|Beximco|Antibiotics|Tablet|40
Cefurox|500mg|Cefuroxime|Square|Antibiotics|Tablet|45
Cefradin|500mg|Cefradine|Square|Antibiotics|Capsule|9
Co-Trim|480mg|Cotrimoxazole|Square|Antibiotics|Tablet|2.5
Tinizol|500mg|Tinidazole|Square|Antibiotics|Tablet|4
Glucomin XR|500mg|Metformin SR|Aristopharma|Diabetes Care|Tablet|4
Glimy|2mg|Glimepiride|Beximco|Diabetes Care|Tablet|5
Pioglit|15mg|Pioglitazone|Square|Diabetes Care|Tablet|6
Vildaglip|50mg|Vildagliptin|Incepta|Diabetes Care|Tablet|20
Jardiance|10mg|Empagliflozin|Boehringer Ingelheim|Diabetes Care|Tablet|250
Trajenta|5mg|Linagliptin|Boehringer Ingelheim|Diabetes Care|Tablet|230
Lantus|100IU/ml|Insulin Glargine|Sanofi|Diabetes Care|Injection|1400
Accu-Chek Active Strips|50 strips|Glucose test strips|Roche|Diabetes Care|Other|1400
Tolmi|40mg|Telmisartan|Square|Cardiovascular|Tablet|8
Atenol|50mg|Atenolol|Square|Cardiovascular|Tablet|2.5
Metolar|50mg|Metoprolol|Renata|Cardiovascular|Tablet|3.5
Carvil|6.25mg|Carvedilol|Square|Cardiovascular|Tablet|5
Rosuva|10mg|Rosuvastatin|Square|Cardiovascular|Tablet|14
Aspirin Cardio|75mg|Aspirin|Square|Cardiovascular|Tablet|1.5
Lasix|40mg|Furosemide|Sanofi|Cardiovascular|Tablet|2
Aldactone|25mg|Spironolactone|Pfizer|Cardiovascular|Tablet|8
Angised|0.5mg|Glyceryl Trinitrate|Square|Cardiovascular|Tablet|3
Warfarin|5mg|Warfarin|Square|Cardiovascular|Tablet|4
Xarelto|20mg|Rivaroxaban|Bayer|Cardiovascular|Tablet|230
Brodil|100ml|Salbutamol|Square|Respiratory Medicines|Syrup|65
Seretide Evohaler|25/125mcg|Salmeterol + Fluticasone|GSK|Respiratory Medicines|Inhaler|1100
Budecort|200mcg|Budesonide|Beximco|Respiratory Medicines|Inhaler|600
Ambrox|30mg|Ambroxol|Square|Respiratory Medicines|Tablet|3
Tusca|100ml|Dextromethorphan|Square|Respiratory Medicines|Syrup|90
Neuro-B||Vitamin B1 + B6 + B12|Square|Vitamins & Supplements|Tablet|6
Mecobal|500mcg|Mecobalamin|Square|Vitamins & Supplements|Tablet|6
Omega-3|1000mg|Omega-3 Fish Oil|Square|Vitamins & Supplements|Capsule|12
Multivit||Multivitamin + Minerals|Square|Vitamins & Supplements|Tablet|4
Ferro-F||Iron + Folic Acid|Square|Vitamins & Supplements|Capsule|3.5
Folic Acid|5mg|Folic Acid|Square|Vitamins & Supplements|Tablet|1
E-Vit|400IU|Vitamin E|Square|Vitamins & Supplements|Capsule|8
Zinc Plus|100ml|Zinc Sulphate|Renata|Vitamins & Supplements|Syrup|50
Heplav|100mg|Lamivudine|Square|Antiviral Drugs|Tablet|20
Famvir|500mg|Famciclovir|Novartis|Antiviral Drugs|Tablet|85
Clotrim|1%|Clotrimazole|Square|Dermatology|Cream|45
Betnovate|0.1%|Betamethasone|GSK|Dermatology|Cream|80
Mupicin|2%|Mupirocin|Square|Dermatology|Cream|120
Ketoral|2%|Ketoconazole|Eskayef|Dermatology|Other|250
Scabex|5%|Permethrin|Square|Dermatology|Cream|70
Calamine Lotion|100ml|Calamine|Square|Dermatology|Other|60
Fluconal|150mg|Fluconazole|Square|Dermatology|Capsule|25
Moxin Eye Drops|0.5%|Moxifloxacin|Square|Eye & Ear|Drops|120
Tobrex|0.3%|Tobramycin|Alcon|Eye & Ear|Drops|160
Cipro Ear Drops|0.3%|Ciprofloxacin|Square|Eye & Ear|Drops|85
Tear Drops|0.5%|Carboxymethylcellulose|Square|Eye & Ear|Drops|110
Gripe Water|130ml|Gripe Water|Woodward's|Baby & Mother|Syrup|110
Sudocrem|60g|Zinc Oxide|Teva|Baby & Mother|Cream|420
Digital Thermometer|1 pc||Generic|Medical Supplies|Other|220
BP Monitor|HEM-7120||Omron|Medical Supplies|Other|3200
Accu-Chek Active Meter|1 pc||Roche|Medical Supplies|Other|1800
Surgical Mask|50 pcs||Generic|Medical Supplies|Other|150
Gloves|100 pcs||Generic|Medical Supplies|Other|480
Crepe Bandage|4 inch||Generic|Medical Supplies|Other|60
Cotton Roll|100g||Generic|Medical Supplies|Other|45
Disposable Syringe|5ml||Generic|Medical Supplies|Other|8
Pregnancy Test Strip|1 pc||Generic|Medical Supplies|Other|40
Band-Aid|20 pcs||Johnson & Johnson|Medical Supplies|Other|55
Savlon|100ml|Chlorhexidine + Cetrimide|ACI|Medical Supplies|Other|65
Dettol|100ml|Chloroxylenol|Reckitt|Medical Supplies|Other|70
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
  'Dermatology',
  'Eye & Ear',
  'Baby & Mother',
  'Medical Supplies',
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
