const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export const toBnDigits = (s: string) => s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

const TZ = 'Asia/Dhaka';

/** ৳1,250.00  (optionally with Bangla digits: ৳১,২৫০.০০) */
export function formatCurrency(n: number, bn = false, decimals = 2): string {
  const safe = Number.isFinite(n) ? n : 0;
  let s: string;
  try {
    s = safe.toLocaleString('en-BD', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  } catch {
    s = safe.toFixed(decimals);
  }
  s = '৳' + s;
  return bn ? toBnDigits(s) : s;
}

export function formatNumber(n: number, bn = false): string {
  const s = (Number.isFinite(n) ? n : 0).toLocaleString('en-BD');
  return bn ? toBnDigits(s) : s;
}

/** DD-MM-YYYY in Asia/Dhaka */
export function formatDate(iso: string | Date, bn = false): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  const s = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(d)
    .replace(/\//g, '-');
  return bn ? toBnDigits(s) : s;
}

export function formatTime(iso: string | Date, bn = false): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const s = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true }).format(d);
  return bn ? toBnDigits(s) : s;
}

/** YYYY-MM-DD key in Asia/Dhaka */
export function dateKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
}

/** {dow: 0=Sat..6=Fri, hour: 0..23} in Asia/Dhaka */
export function dhakaDowHour(d: Date): { dow: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(d);
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Sat';
  const hr = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const order = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return { dow: Math.max(0, order.indexOf(wd)), hour: hr };
}

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function below1000(n: number): string {
  const out: string[] = [];
  if (n >= 100) {
    out.push(ones[Math.floor(n / 100)] + ' hundred');
    n %= 100;
  }
  if (n >= 20) {
    out.push(tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : ''));
  } else if (n > 0) {
    out.push(ones[n]);
  }
  return out.join(' ');
}

/** South-Asian grouping: crore / lakh / thousand */
export function amountInWords(amount: number): string {
  let n = Math.floor(Math.abs(amount));
  const paisa = Math.round((Math.abs(amount) - n) * 100);
  if (n === 0 && paisa === 0) return 'Zero taka only';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(below1000(crore) + ' crore');
  if (lakh) parts.push(below1000(lakh) + ' lakh');
  if (thousand) parts.push(below1000(thousand) + ' thousand');
  if (n) parts.push(below1000(n));
  let s = parts.join(' ') + ' taka';
  if (paisa) s += ' and ' + below1000(paisa) + ' paisa';
  s += ' only';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
