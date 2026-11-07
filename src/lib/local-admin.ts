/**
 * Yönetim sayfaları (Paylaşım, Bildirimler) için
 * local-mode veri katmanı. Supabase + giriş sistemi eklenene kadar veriler
 * tarayıcının localStorage'ında tutulur.
 */

export interface ShareLink {
  id: string;
  projectId: string;
  projectName: string;
  token: string;
  customerEmail?: string;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

const KEYS = {
  shares: 'admin.shares',
  notifications: 'admin.notifications',
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new CustomEvent('admin:updated'));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function token(): string {
  return Array.from({ length: 3 }, () => Math.random().toString(36).slice(2, 10)).join('');
}

/* ---------- Paylaşım linkleri ---------- */
export function getShares(): ShareLink[] {
  return read<ShareLink[]>(KEYS.shares, []);
}

export function addShare(projectId: string, projectName: string, days: number | null, customerEmail?: string): ShareLink {
  const link: ShareLink = {
    id: uid(),
    projectId,
    projectName,
    token: token(),
    customerEmail: customerEmail || undefined,
    createdAt: new Date().toISOString(),
    expiresAt: days ? new Date(Date.now() + days * 864e5).toISOString() : null,
    revoked: false,
  };
  write(KEYS.shares, [link, ...getShares()]);
  return link;
}

export function revokeShare(id: string) {
  const list = getShares();
  write(
    KEYS.shares,
    list.map((l) => (l.id === id ? { ...l, revoked: true } : l))
  );
}

/* ---------- Bildirimler ---------- */
export function getNotifications(): Notification[] {
  return read<Notification[]>(KEYS.notifications, [
    {
      id: 'welcome',
      title: 'Solar BOM platformuna hoş geldiniz',
      body: 'Nasıl Çalışır sayfasından adım adım akışı inceleyebilir, ilk projenizi oluşturabilirsiniz.',
      createdAt: new Date().toISOString(),
      read: false,
    },
  ]);
}

export function markAllNotificationsRead() {
  write(
    KEYS.notifications,
    getNotifications().map((n) => ({ ...n, read: true }))
  );
}

export function deleteNotification(id: string) {
  write(
    KEYS.notifications,
    getNotifications().filter((n) => n.id !== id)
  );
}
