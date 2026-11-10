'use client';

import { numLocale } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  getNotifications,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from '@/lib/local-admin';

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dk önce`;
  if (m < 1440) return `${Math.round(m / 60)} saat önce`;
  return new Date(iso).toLocaleDateString(numLocale(), { day: 'numeric', month: 'long' });
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    const load = () => setItems(getNotifications());
    load();
    window.addEventListener('admin:updated', load);
    return () => window.removeEventListener('admin:updated', load);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-[19px] font-semibold">
              <Bell className="size-5 text-primary" /> Bildirimler
            </h1>
            <p className="text-[12.5px] text-muted-foreground">
              {unread > 0 ? `${unread} okunmamış bildirim` : 'Tümü okundu'}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={() => {
                markAllNotificationsRead();
                toast('Tümü okundu işaretlendi', 'success');
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" /> Tümünü okundu işaretle
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-14 text-center">
            <Bell className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-[14px] font-medium">Henüz bildirim yok</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Platform duyuruları ve davetler burada görünür.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3 shadow-sm transition-colors',
                  n.read ? 'border-border bg-card' : 'border-primary/30 bg-primary-soft/30'
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Bell className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-[13.5px]', !n.read && 'font-semibold')}>{n.title}</span>
                  {n.body && <span className="block text-[12.5px] text-muted-foreground">{n.body}</span>}
                  <span className="block text-[11.5px] text-muted-foreground/70">{ago(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                <button
                  title="Sil"
                  onClick={() => deleteNotification(n.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
