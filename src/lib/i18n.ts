/**
 * Hafif i18n — cookie tabanlı dil seçimi (TR / EN).
 * Arayüz metinleri Türkçe yazılır; EN seçiliyse lib/i18n-dom sayfayı i18n-en.json ile çevirir.
 */

export type Locale = 'tr' | 'en';

const COOKIE_NAME = 'locale';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function getClientLocale(): Locale {
  if (typeof document === 'undefined') return 'tr';
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (match) return match[1] === 'en' ? 'en' : 'tr';
  try {
    if (localStorage.getItem('locale') === 'en') return 'en';
  } catch {}
  return 'tr';
}

export function setClientLocale(l: Locale) {
  if (typeof document !== 'undefined') {
    document.cookie = `${COOKIE_NAME}=${l}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }
  try {
    localStorage.setItem('locale', l);
  } catch {}
}

/** Etkin dil. İstemci: cookie. Sunucu: layout render sırasında globalThis.__APP_LOCALE'e yazılır. */
export function appLocale(): Locale {
  if (typeof document !== 'undefined') return getClientLocale();
  const g = globalThis as { __APP_LOCALE?: Locale };
  return g.__APP_LOCALE === 'en' ? 'en' : 'tr';
}

/** Intl biçimlendirme yereli: 'tr-TR' veya 'en-US' */
export const numLocale = (): string => (appLocale() === 'en' ? 'en-US' : 'tr-TR');
