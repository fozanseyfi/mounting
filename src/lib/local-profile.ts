/**
 * Local-mode profil yönetimi.
 * Auth eklenene kadar profil bilgilerini localStorage'da tutuyoruz.
 */

const KEYS = {
  fullName: 'profile.fullName',
  email: 'profile.email',
  phone: 'profile.phone',
  panelName: 'profile.panelName',
  createdAt: 'profile.createdAt',
} as const;

export interface LocalProfile {
  fullName: string;
  email: string;
  phone: string;
  panelName: string;
  createdAt: string; // ISO
}

const DEFAULTS: LocalProfile = {
  fullName: 'Ozan Seyfi',
  email: 'ozan.seyfi@kontrolmatik.com',
  phone: '',
  panelName: '',
  createdAt: new Date().toISOString(),
};

export function readProfile(): LocalProfile {
  if (typeof window === 'undefined') return DEFAULTS;
  const get = (k: string, fallback: string) => localStorage.getItem(k) ?? fallback;
  const createdAt = localStorage.getItem(KEYS.createdAt);
  if (!createdAt) localStorage.setItem(KEYS.createdAt, DEFAULTS.createdAt);
  return {
    fullName: get(KEYS.fullName, DEFAULTS.fullName),
    email: get(KEYS.email, DEFAULTS.email),
    phone: get(KEYS.phone, DEFAULTS.phone),
    panelName: get(KEYS.panelName, DEFAULTS.panelName),
    createdAt: createdAt ?? DEFAULTS.createdAt,
  };
}

export function writeProfile(p: Partial<LocalProfile>) {
  if (typeof window === 'undefined') return;
  if (p.fullName !== undefined) localStorage.setItem(KEYS.fullName, p.fullName);
  if (p.email !== undefined) localStorage.setItem(KEYS.email, p.email);
  if (p.phone !== undefined) localStorage.setItem(KEYS.phone, p.phone);
  if (p.panelName !== undefined) localStorage.setItem(KEYS.panelName, p.panelName);
  // notify listeners
  window.dispatchEvent(new CustomEvent('profile:updated'));
}

/** Effective panel name = panelName if set, otherwise fullName */
export function effectivePanelName(p: LocalProfile): string {
  return (p.panelName?.trim() || p.fullName?.trim() || '').trim();
}
