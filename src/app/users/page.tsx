'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Users, Mail, Copy, Clock, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn, formatDate } from '@/lib/utils';
import { readProfile, effectivePanelName, type LocalProfile } from '@/lib/local-profile';
import { ROLE_LABELS, type Role, type Invitation, getInvites, addInvite, cancelInvite } from '@/lib/local-admin';

export default function UsersPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [latestInvite, setLatestInvite] = useState<{ url: string; email: string } | null>(null);

  useEffect(() => {
    const load = () => {
      setProfile(readProfile());
      setInvites(getInvites());
    };
    load();
    window.addEventListener('admin:updated', load);
    window.addEventListener('profile:updated', load);
    return () => {
      window.removeEventListener('admin:updated', load);
      window.removeEventListener('profile:updated', load);
    };
  }, []);

  const organizationName = (profile && effectivePanelName(profile)) || 'Solar BOM';

  function inviteUrl(token: string) {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`;
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    if (invites.some((i) => i.email.toLowerCase() === value.toLowerCase())) {
      toast('Bu e-posta için bekleyen bir davet zaten var', 'error');
      return;
    }
    const inv = addInvite(value, role);
    setLatestInvite({ url: inviteUrl(inv.token), email: value });
    setEmail('');
    toast('Davet oluşturuldu', 'success');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast('Link kopyalandı', 'success');
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero */}
        <Card className="overflow-hidden border-emerald-200 shadow-sm">
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">Yönetici Paneli</p>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ekip ve Yetkilendirme</h1>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    <strong className="text-slate-900">{organizationName}</strong> panelinde rol ve erişim yönetimi.
                    Davet ettiğin kişiler sadece bu panelde görünür — diğer platformların etkilenmez.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <FeatureChip icon={UserPlus} title="Kullanıcı Davet Et" desc="E-posta ile davet" />
                <FeatureChip icon={Shield} title="Rol Yönetimi" desc="Yönetici / Kullanıcı / Görüntüleyici" />
                <FeatureChip icon={Lock} title="Erişim Kontrolü" desc="Proje bazlı gizle / salt okunur" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Davet Et */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4" /> Yeni Kullanıcı Davet Et
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="kullanici@firma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger className="w-full sm:w-44" id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="sm:mb-px">
                <UserPlus className="size-4" /> Davet Oluştur
              </Button>
            </form>
            {latestInvite && (
              <div className="mt-4 rounded-lg border border-success/30 bg-success-soft/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-success-soft-foreground/80">
                  Davet linki — {latestInvite.email}
                </p>
                <div className="mt-2 flex items-start justify-between gap-2 rounded-md border bg-card p-2">
                  <p className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{latestInvite.url}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(latestInvite.url)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Kopyala"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-success-soft-foreground/70">
                  Giriş sistemi aktif olduğunda davet e-postası otomatik gönderilecek. Link 7 gün geçerli.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bekleyen Davetler */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" /> Bekleyen Davetler ({invites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted text-muted-foreground">
                      <th className="px-4 py-2.5 text-left font-medium">E-posta</th>
                      <th className="px-4 py-2.5 text-left font-medium">Rol</th>
                      <th className="px-4 py-2.5 text-left font-medium">Süre Bitiş</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invites.map((i) => (
                      <tr key={i.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="size-3.5 text-muted-foreground" />
                            {i.email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {ROLE_LABELS[i.role] ?? i.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(i.expiresAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(inviteUrl(i.token))}
                              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                              title="Davet linkini kopyala"
                            >
                              <Copy className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                cancelInvite(i.id);
                                toast('Davet iptal edildi', 'success');
                              }}
                              className="text-muted-foreground transition-colors hover:text-destructive"
                              title="Daveti iptal et"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aktif Kullanıcılar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" /> Panel Kullanıcıları (1)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">İsim</th>
                    <th className="px-4 py-2.5 text-left font-medium">E-posta</th>
                    <th className="px-4 py-2.5 text-left font-medium">Rol</th>
                    <th className="px-4 py-2.5 text-left font-medium">Katıldı</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">{profile?.fullName ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{profile?.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className="text-xs">Yönetici (siz)</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {profile ? formatDate(profile.createdAt) : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function FeatureChip({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5')}>
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
