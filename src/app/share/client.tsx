'use client';

import { useEffect, useMemo, useState } from 'react';
import { Share2, Link as LinkIcon, Clock, Copy, Trash2, Eye, Lock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { cn, formatDate } from '@/lib/utils';
import { readProfile, effectivePanelName } from '@/lib/local-profile';
import { getShares, addShare, revokeShare, type ShareLink } from '@/lib/local-admin';

const PRESET_OPTIONS = [
  { value: '1', label: '1 gün' },
  { value: '7', label: '7 gün' },
  { value: '14', label: '14 gün' },
  { value: '30', label: '30 gün' },
  { value: '60', label: '60 gün' },
  { value: '90', label: '90 gün' },
  { value: 'infinite', label: 'Süresiz' },
];

function statusOf(l: ShareLink): { label: string; tone: 'active' | 'expired' | 'revoked' } {
  if (l.revoked) return { label: 'İptal Edildi', tone: 'revoked' };
  if (l.expiresAt && new Date(l.expiresAt).getTime() <= Date.now()) return { label: 'Süresi Doldu', tone: 'expired' };
  return { label: 'Aktif', tone: 'active' };
}

interface Props {
  projects: { id: string; name: string; customer: string | null }[];
}

export function ShareLinksClient({ projects }: Props) {
  const { toast } = useToast();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [orgName, setOrgName] = useState('Solar BOM');
  const [projectId, setProjectId] = useState('');
  const [email, setEmail] = useState('');
  const [preset, setPreset] = useState('30');

  useEffect(() => {
    const load = () => {
      setLinks(getShares());
      setOrgName(effectivePanelName(readProfile()) || 'Solar BOM');
    };
    load();
    window.addEventListener('admin:updated', load);
    return () => window.removeEventListener('admin:updated', load);
  }, []);

  const activeLinks = useMemo(() => links.filter((l) => statusOf(l).tone === 'active'), [links]);
  const archivedLinks = useMemo(() => links.filter((l) => statusOf(l).tone !== 'active'), [links]);

  function urlOf(l: ShareLink) {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${l.token}`;
  }

  function handleCreate() {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    const link = addShare(p.id, p.name, preset === 'infinite' ? null : Number(preset), email.trim());
    navigator.clipboard?.writeText(urlOf(link)).catch(() => {});
    toast('Link oluşturuldu ve panoya kopyalandı', 'success');
    setEmail('');
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast('Link kopyalandı', 'success');
  }

  return (
    <>
      {/* Hero */}
      <Card className="overflow-hidden border-emerald-200 shadow-sm">
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Share2 className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">Yönetici Paneli</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paylaşım Linkleri</h1>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  <strong className="text-slate-900">{orgName}</strong> panelindeki projelerin müşteri/yatırımcıya
                  gönderilebilir read-only linkleri. Süresini sen belirlersin; birim fiyat ve maliyet kalemleri
                  linkte gizlenir.
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Chip icon={Eye} title="Read-only erişim" desc="Görüntüler, değiştiremez" />
              <Chip icon={Lock} title="Süre + iptal" desc="İstediğin an kapat" />
              <Chip icon={ShieldCheck} title="Maliyet gizliliği" desc="Fiyatlar linkte görünmez" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yeni Paylaşım */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="size-4" /> Yeni Paylaşım Oluştur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project">Proje</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project" className="w-full">
                  <SelectValue placeholder={projects.length ? 'Proje seç' : 'Henüz proje yok'} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.customer ? ` · ${p.customer}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recipientEmail">Müşteri E-posta (opsiyonel)</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="musteri@firma.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="preset">Geçerlilik Süresi</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger id="preset" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleCreate} disabled={!projectId} className="w-full sm:w-auto">
                <LinkIcon className="size-4" /> Link Oluştur
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aktif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="size-4" /> Aktif Linkler ({activeLinks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeLinks.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Henüz aktif paylaşım linki yok. Yukarıdan yeni bir link oluştur.
            </div>
          ) : (
            <LinkTable rows={activeLinks} urlOf={urlOf} onCopy={copy} onRevoke={revokeShare} showRevoke />
          )}
        </CardContent>
      </Card>

      {archivedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" /> Geçmiş ({archivedLinks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LinkTable rows={archivedLinks} urlOf={urlOf} onCopy={copy} onRevoke={revokeShare} showRevoke={false} />
          </CardContent>
        </Card>
      )}
    </>
  );
}

function LinkTable({
  rows,
  urlOf,
  onCopy,
  onRevoke,
  showRevoke,
}: {
  rows: ShareLink[];
  urlOf: (l: ShareLink) => string;
  onCopy: (s: string) => void;
  onRevoke: (id: string) => void;
  showRevoke: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="px-4 py-2.5 text-left font-medium">Proje</th>
            <th className="px-4 py-2.5 text-left font-medium">Müşteri</th>
            <th className="px-4 py-2.5 text-left font-medium">Oluşturma</th>
            <th className="px-4 py-2.5 text-left font-medium">Bitiş</th>
            <th className="px-4 py-2.5 text-left font-medium">Durum</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((l) => {
            const st = statusOf(l);
            return (
              <tr key={l.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{l.projectName}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.customerEmail ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(l.createdAt)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {l.expiresAt ? formatDate(l.expiresAt) : 'Süresiz'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      st.tone === 'active' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                      st.tone === 'expired' && 'border-amber-200 bg-amber-50 text-amber-700',
                      st.tone === 'revoked' && 'border-slate-200 bg-slate-50 text-slate-500'
                    )}
                  >
                    {st.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onCopy(urlOf(l))}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      title="Linki kopyala"
                    >
                      <Copy className="size-3.5" />
                    </button>
                    {showRevoke && (
                      <button
                        type="button"
                        onClick={() => onRevoke(l.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        title="İptal et"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Chip({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold leading-tight text-slate-900">{title}</p>
        <p className="mt-0.5 text-[10.5px] leading-tight text-slate-500">{desc}</p>
      </div>
    </div>
  );
}
