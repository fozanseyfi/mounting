'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserCircle2,
  Shield,
  Mail,
  Building2,
  Calendar,
  User,
  Save,
  KeyRound,
  Users,
  UserPlus,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { readProfile, writeProfile, effectivePanelName, type LocalProfile } from '@/lib/local-profile';
import { logAudit } from '@/lib/local-admin';

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
    logAudit('settings.profile', 'Profil güncellendi', 'settings', fullName.trim());
    setProfileMsg({ tone: 'success', text: 'Profil bilgileri kaydedildi.' });
  }

  function savePanel(e: React.FormEvent) {
    e.preventDefault();
    writeProfile({ panelName: panelName.trim() });
    setProfile(readProfile());
    logAudit('settings.panel', 'Panel adı güncellendi', 'settings', panelName.trim());
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

        {/* EKİP ve YETKİLENDİRME */}
        <Card className="overflow-hidden border-emerald-200 shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
              <div className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">Yönetici Paneli</p>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">Ekip ve Yetkilendirme</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      Kullanıcı davet et, rolleri yönet, kaynak erişimini kişi bazında ayarla.
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <FeatureChip icon={UserPlus} title="Kullanıcı Davet Et" desc="E-posta ile davet" />
                  <FeatureChip icon={Shield} title="Rol Yönetimi" desc="Yönetici / Kullanıcı / Görüntüleyici" />
                  <FeatureChip icon={Lock} title="Erişim Kontrolü" desc="Proje bazlı gizle / salt okunur" />
                </div>
              </div>
              <div className="flex items-stretch border-t border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-6 lg:border-l lg:border-t-0">
                <Link
                  href="/users"
                  className="group inline-flex w-full items-center justify-between gap-3 rounded-xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg lg:w-auto lg:flex-col lg:items-center lg:justify-center lg:gap-2 lg:px-7 lg:py-5"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 lg:size-12">
                    <Users className="size-5 lg:size-6" />
                  </div>
                  <div className="flex flex-1 flex-col text-left lg:flex-none lg:items-center lg:text-center">
                    <span className="text-[15px] font-bold leading-tight lg:text-base">Ekibi Yönet</span>
                    <span className="text-[11px] font-medium opacity-80 lg:mt-0.5">Davet, rol, erişim</span>
                  </div>
                  <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1 lg:hidden" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
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
