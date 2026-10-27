# PharmaDesk — Pharmacy Management (100% free)

React + TypeScript + Vite + Tailwind. Data is stored locally in the browser (localStorage via Zustand persist), so it works offline with zero setup. Currency: ৳ (BDT). Languages: English / বাংলা.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Ready in this step
- Design system (dark-green sidebar, lime accent, pill buttons, soft cards, dark mode), responsive shell, ⌘/Ctrl+K search, notifications
- **Overview**: KPIs with count-up, revenue bar chart (striped highlight), orders-by-time heatmap, recent orders, top products
- **Products**: category cards (click to filter), search, status filters, add/edit drawer with validation, delete with Undo, CSV export
- **POS**: barcode/name search, cart with qty steppers, discount (৳/%), VAT, split of payment methods (Cash/bKash/Nagad/Rocket/Card/Bank/Due), change calculation, hold/resume, doctor field, expiry/out-of-stock guards, substitute suggestions. Shortcuts: F2, F4, F8, F9, Esc
- **Receipt printing**: 58mm, 80mm thermal and A4; QR code; amount in words; copies; live preview in Settings
- **Orders**: KPIs, search, status filter/edit, reprint invoice, delete with Undo, CSV export
- **Settings**: theme, language, Bangla digits, VAT, pharmacy profile, receipt designer, JSON backup/restore, reset demo data

- **Sales**: KPIs vs previous period, revenue chart, profit by category, top products, CSV
- **Customers**: KPIs, search, add (BD phone validation), profile with purchase history and dues
- **Payments**: status filters, collect due (partial payments), collection ledger
- **Suppliers & Purchases**: purchase invoice that raises stock and updates purchase price, supplier dues and payments
- **Reports**: sales, profit/loss, stock valuation, expiry, low stock + reorder suggestion, VAT, customer dues (CSV export)

- **Command palette** (Ctrl/Cmd+K): pages, quick actions, medicines, customers, orders
- **Help**: FAQ, shortcuts, replayable first-launch tour
- **Security & roles**: optional PIN lock (Admin / Pharmacist / Cashier) with route guards
- **Products**: CSV import, QR shelf labels (A4); **Reports**: print to A4

- **Labels**: real Code 128 barcodes (A4 sheet); **Excel export** (.xls) for products and all reports
- **Purchase returns**: send items back to a supplier, stock and amount owed go down
- **Refill reminders**: customers whose medicine is due for a refill, with WhatsApp / SMS message links (days set in Settings)

- **Catalogue**: 318 sample Bangladeshi medicines and supplies (298 medicines) in 18 categories; existing installs are topped up automatically once per catalogue version, and Settings → "Add medicines" merges any missing items without removing your data

## Not built yet
Per-batch stock with FEFO selling, ESC/POS direct thermal printing (browser print works today), true .xlsx / PDF file generation (use the print dialog's "Save as PDF").

## Deploy free
`npm run build`, then upload `dist/` to Vercel / Netlify / GitHub Pages (uses hash routing, so no server config needed).
