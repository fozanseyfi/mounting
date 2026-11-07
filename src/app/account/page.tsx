'use client';

import { useEffect, useState } from 'react';
import {
  UserCircle2,
  Shield,
  Mail,
  Building2,
  Calendar,
  User,
  Save,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d));
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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* HERO */}
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardContent className="p-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40" />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-200" />

              <div className="relative grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-7">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-2xl font-bold tracking-tight text-white shadow-lg shadow-emerald-900/20 ring-4 ring-white">
                  {initials(profile.fullName)}
                </div>
                <div className="min-w-0 space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
                    <UserCircle2 className="size-3" />
                    Profilim
                  </span>
                  <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{profile.fullName}</h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700">
                      <Shield className="size-3 text-emerald-600" />
                      {roleLabel}
                    </span>
                    {profile.email && (
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Mail className="size-3.5" />
                        {profile.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative grid gap-px overflow-hidden border-t border-slate-200/80 bg-slate-200/80 sm:grid-cols-3">
                <MetaCell icon={Building2} label="Şirket" value={firmName} />
                <MetaCell icon={Shield} label="Rol" value={roleLabel} />
                <MetaCell icon={Calendar} label="Üyelik Tarihi" value={formatDate(profile.createdAt)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PROFİL BİLGİLERİ */}
        <SectionCard
          icon={User}
          title="Profil bilgileri"
          subtitle="Görünen adınızı güncelleyin — ekip arkadaşlarınız sizi bu isimle görür."
        >
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Ad Soyad">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Ad Soyad" />
              </FieldGroup>
              <FieldGroup label="E-posta">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="pl-9" />
                </div>
              </FieldGroup>
            </div>
            {profileMsg && <FormMessage tone={profileMsg.tone}>{profileMsg.text}</FormMessage>}
            <div className="flex">
              <Button type="submit" size="sm">
                <Save className="size-3.5" />
                Kaydet
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* ŞİRKET / PANEL ADI */}
        <SectionCard icon={Building2} title="Şirket / panel adı" subtitle="Sidebar başlığında ve topbar'da görünen şirket adı.">
          <form onSubmit={savePanel} className="space-y-4">
            <FieldGroup label="Şirket Adı">
              <Input value={panelName} onChange={(e) => setPanelName(e.target.value)} placeholder="Örn. Kontrolmatik" />
            </FieldGroup>
            {panelMsg && <FormMessage tone={panelMsg.tone}>{panelMsg.text}</FormMessage>}
            <div className="flex">
              <Button type="submit" size="sm">
                <Save className="size-3.5" />
                Kaydet
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* ŞİFRE GÜVENLİĞİ */}
        <SectionCard
          icon={KeyRound}
          title="Şifre güvenliği"
          subtitle="Bu platformun kendi giriş sistemi Supabase entegrasyonu ile aktif olacak. O zamana kadar şifre değişikliği yapılamaz."
        >
          <div className="space-y-4 opacity-60">
            <FieldGroup label="Mevcut Şifre">
              <PasswordInput disabled />
            </FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="Yeni Şifre">
                <PasswordInput disabled placeholder="En az 8 karakter" />
              </FieldGroup>
              <FieldGroup label="Yeni Şifre (Tekrar)">
                <PasswordInput disabled placeholder="En az 8 karakter" />
              </FieldGroup>
            </div>
            <div className="flex">
              <Button type="button" size="sm" disabled>
                <KeyRound className="size-3.5" />
                Şifreyi Güncelle
              </Button>
            </div>
          </div>
        </SectionCard>

      </div>
    </main>
  );
}

function MetaCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white px-5 py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="ml-0 sm:ml-12">{children}</div>
      </CardContent>
    </Card>
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

