export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const dirOf = (locale: Locale) => (locale === 'ar' ? 'rtl' : 'ltr');

export type Dictionary = typeof import('./dictionaries/en.json');

const loaders = {
  ar: () => import('./dictionaries/ar.json'),
  en: () => import('./dictionaries/en.json'),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const mod = await loaders[locale]();
  return mod.default as Dictionary;
}
