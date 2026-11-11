import { Language, translations } from './translations';

export function formatWithCommas(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).replace(/,/g, '').trim();
  if (!str) return '';
  if (str === '-') return '-';

  const isNegative = str.startsWith('-');
  const unsignedStr = isNegative ? str.slice(1) : str;

  const parts = unsignedStr.split('.');
  const intPart = parts[0].replace(/\D/g, '');
  const decPart = parts.length > 1 ? parts.slice(1).join('').replace(/\D/g, '') : null;

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const result = (isNegative ? '-' : '') + (decPart !== null ? `${formattedInt}.${decPart}` : formattedInt);

  return result;
}

export function parseRawNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const clean = String(value).replace(/,/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function formatCurrency(amount: number, lang: Language = 'ar'): string {
  const rounded = Math.round((amount || 0) * 100) / 100;
  const formattedNumber = new Intl.NumberFormat(lang === 'ar' ? 'ar-IQ' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);

  const symbol = translations[lang].iqd;
  return lang === 'ar' ? `${formattedNumber} ${symbol}` : `${symbol} ${formattedNumber}`;
}

export function formatNumber(num: number, lang: Language = 'ar'): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-IQ' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(num || 0);
}

export function formatDate(dateString: string, lang: Language = 'ar'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function generateInvoiceNumber(prefix: string): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}
