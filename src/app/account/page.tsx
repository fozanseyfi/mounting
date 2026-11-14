'use client';

import { numLocale } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { Shield, Mail, Building2, User, Save, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { readProfile, writeProfile, effectivePanelName, type LocalProfile } from '@/lib/local-profile';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(d: string): string {
  return new Intl.DateTimeFormat(numLocale(), { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d));
}

type Msg = { tone: 'error' | 'success'; text: string } | null;

export default function AccountPage() {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [panelName, setPanelName] = useState('');
  const [profileMsg, setProfileMsg] = useState<Msg>(null);
  const [panelMsg, setPanelMsg] = useState<Msg>(null);

  useEffect(() => {
    const p = readProfile();
    setProfile(p);
    setFullName(p.fullName);
    setEmail(p.email);
    setPanelName(effectivePanelName(p));
  }, []);

  if (!profile) return <main className="flex-1 p-4 sm:p-6 lg:p-8" />;

  const roleLabel = 'Yönetici';
  const firmName = effectivePanelName(profile) || 'Solar BOM';

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileMsg({ tone: 'error', text: 'Ad Soyad boş olamaz.' });
      return;
    }
    writeProfile({ fullName: fullName.trim(), email: email.trim() });
    setProfile(readProfile());
    setProfileMsg({ tone: 'success', text: 'Profil bilgileri kaydedildi.' });
  }

  function savePanel(e: React.FormEvent) {
    e.preventDefault();
    writeProfile({ panelName: panelName.trim() });
    setProfile(readProfile());
    setPanelMsg({ tone: 'success', text: 'Panel adı kaydedildi.' });
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        {/* Kimlik şeridi */}
        <section className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border bg-gradient-to-b from-card to-muted/40 px-6 py-5">
          <div className="flex min-w-0 basis-full items-center gap-4 sm:basis-0 sm:flex-1">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
              {initials(profile.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Profilim</p>
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                <span className="truncate">{profile.fullName}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <Shield className="size-3" /> {roleLabel}
                </span>
              </h1>
              {profile.email && <p className="truncate text-[13px] text-muted-foreground">{profile.email}</p>}
            </div>
          </div>
          <dl className="flex gap-6 text-xs">
            <div>
              <dt className="text-muted-foreground">Şirket</dt>
              <dd className="font-semibold text-foreground">{firmName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Üyelik</dt>
              <dd className="font-semibold text-foreground">{formatDate(profile.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          {/* Profil + şirket adı */}
          <Panel icon={User} title="Profil" desc="Görünen adınız ve sidebar'da görünen şirket adı.">
            <form onSubmit={saveProfile} className="space-y-3.5">
              <FieldGroup label="Ad Soyad">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Ad Soyad" />
              </FieldGroup>
              <FieldGroup label="E-posta">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="pl-9" />
                </div>
              </FieldGroup>
              {profileMsg && <FormMessage tone={profileMsg.tone}>{profileMsg.text}</FormMessage>}
              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  <Save className="size-3.5" />
                  Kaydet
                </Button>
              </div>
            </form>
            <form onSubmit={savePanel} className="mt-4 space-y-3.5 border-t pt-4">
              <FieldGroup label="Şirket / panel adı">
                <Input value={panelName} onChange={(e) => setPanelName(e.target.value)} placeholder="Örn. Kontrolmatik" />
              </FieldGroup>
              {panelMsg && <FormMessage tone={panelMsg.tone}>{panelMsg.text}</FormMessage>}
              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  <Building2 className="size-3.5" />
                  Şirket adını kaydet
                </Button>
              </div>
            </form>
          </Panel>

          {/* Şifre */}
          <Panel icon={KeyRound} title="Şifre" desc="Şifre değişikliği, bulut hesabına (Supabase) geçişle aktif olacak.">
            <div className="space-y-3.5 opacity-60">
              <FieldGroup label="Mevcut şifre">
                <PasswordInput disabled />
              </FieldGroup>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <FieldGroup label="Yeni şifre">
                  <PasswordInput disabled placeholder="En az 8 karakter" />
                </FieldGroup>
                <FieldGroup label="Yeni şifre (tekrar)">
                  <PasswordInput disabled placeholder="Tekrar yazın" />
                </FieldGroup>
              </div>
              <div className="flex justify-end">
                <Button type="button" size="sm" disabled>
                  <KeyRound className="size-3.5" />
                  Şifreyi güncelle
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function Panel({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-start gap-3 border-b px-5 py-3.5">
        <Icon className="mt-0.5 size-4 text-muted-foreground" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">{label}</Label>
      {children}
    </div>
  );
}

function PasswordInput({ disabled, placeholder }: { disabled?: boolean; placeholder?: string }) {
  return (
    <div className="relative">
      <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
      <Input type="password" disabled={disabled} placeholder={placeholder ?? '••••••••'} className="pl-9" />
    </div>
  );
}

function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        'rounded-md border px-3 py-2 text-xs font-medium',
        tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      )}
    >
      {children}
    </p>
  );
}

