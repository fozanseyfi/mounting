/**
 * Yönetim sayfaları (Paylaşım, Bildirimler) için
 * local-mode veri katmanı. Supabase + giriş sistemi eklenene kadar veriler
 * tarayıcının localStorage'ında tutulur.
 */

export interface ShareLink {
  id: string;
  projectId: string;
  projectName: string;
  /** Proje verisini taşıyan tam link (/p#...) */
  url: string;
  createdAt: string;
  /** Son geçerlilik günü (YYYY-MM-DD) — null: süresiz */
  expiresAt: string | null;
  /** Fiyat ve maliyet bilgisi linke dahil mi */
  includeCost: boolean;
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

/* ---------- Paylaşım linkleri ---------- */
export function getShares(): ShareLink[] {
  // Eski biçimdeki (link taşımayan) kayıtlar atlanır
  return read<ShareLink[]>(KEYS.shares, []).filter((l) => typeof l.url === 'string' && l.url.length > 0);
}

export function addShare(link: Omit<ShareLink, 'id' | 'createdAt'>): ShareLink {
  const full: ShareLink = { ...link, id: uid(), createdAt: new Date().toISOString() };
  write(KEYS.shares, [full, ...getShares()]);
  return full;
}

export function removeShare(id: string) {
  write(KEYS.shares, getShares().filter((l) => l.id !== id));
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
