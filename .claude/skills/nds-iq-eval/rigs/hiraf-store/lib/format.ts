import type { Locale } from './i18n';

export function money(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function num(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(value);
}

export function formatDate(iso: string, locale: Locale, withTime = false): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));
}

/** Fills {name} placeholders in a dictionary string. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
