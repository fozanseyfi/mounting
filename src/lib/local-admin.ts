/**
 * Yönetim sayfaları (Kullanıcılar, Aktivite, Paylaşım, Bildirimler) için
 * local-mode veri katmanı. Supabase + giriş sistemi eklenene kadar veriler
 * tarayıcının localStorage'ında tutulur.
 */

export type Role = 'admin' | 'user' | 'viewer';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Yönetici',
  user: 'Kullanıcı',
  viewer: 'Görüntüleyici',
};

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  actionLabel: string;
  resourceType: 'project' | 'user' | 'settings' | 'share';
  resourceName?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

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
  invites: 'admin.invites',
  audit: 'admin.audit',
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

/* ---------- Davetler ---------- */
export function getInvites(): Invitation[] {
  const now = Date.now();
  return read<Invitation[]>(KEYS.invites, []).filter((i) => new Date(i.expiresAt).getTime() > now);
}

export function addInvite(email: string, role: Role): Invitation {
  const inv: Invitation = {
    id: uid(),
    email,
    role,
    token: token(),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
  };
  write(KEYS.invites, [inv, ...getInvites()]);
  logAudit('user.invite', 'Kullanıcı davet edildi', 'user', email, { role: ROLE_LABELS[role] });
  return inv;
}

export function cancelInvite(id: string) {
  const inv = getInvites().find((i) => i.id === id);
  write(
    KEYS.invites,
    getInvites().filter((i) => i.id !== id)
  );
  if (inv) logAudit('user.invite_cancel', 'Davet iptal edildi', 'user', inv.email);
}

/* ---------- Aktivite ---------- */
export function getAudit(): AuditEntry[] {
  return read<AuditEntry[]>(KEYS.audit, []);
}

export function logAudit(
  action: string,
  actionLabel: string,
  resourceType: AuditEntry['resourceType'],
  resourceName?: string,
  details?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return;
  let actorName = 'Kullanıcı';
  try {
    actorName = localStorage.getItem('profile.fullName') || 'Ozan Seyfi';
  } catch {}
  const entry: AuditEntry = {
    id: uid(),
    actorName,
    action,
    actionLabel,
    resourceType,
    resourceName,
    details,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.audit, [entry, ...getAudit()].slice(0, 200));
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
  logAudit('share.create', 'Paylaşım linki oluşturuldu', 'share', projectName, {
    süre: days ? `${days} gün` : 'Süresiz',
  });
  return link;
}

export function revokeShare(id: string) {
  const list = getShares();
  const link = list.find((l) => l.id === id);
  write(
    KEYS.shares,
    list.map((l) => (l.id === id ? { ...l, revoked: true } : l))
  );
  if (link) logAudit('share.revoke', 'Paylaşım linki iptal edildi', 'share', link.projectName);
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
