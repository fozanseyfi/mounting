'use client';

import { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Save,
  Building2,
  Shield,
  Calendar,
  KeyRound,
  Mail,
  Lock,
  ShieldAlert,
  Phone,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { readProfile, writeProfile, effectivePanelName, type LocalProfile } from '@/lib/local-profile';

export default function AccountPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [panel, setPanel] = useState('');
  const [pwd, setPwd] = useState({ current: '', next: '', repeat: '' });

  useEffect(() => {
    const p = readProfile();
    setProfile(p);
    setFullName(p.fullName);
    setPhone(p.phone);
    setPanel(p.panelName);
  }, []);

  if (!profile) {
    return (
      <main className="flex-1 p-6">
        <Card className="rounded-2xl bg-white border border-slate-200 p-6 shadow-soft">
          <div className="text-sm text-text2">Profil yükleniyor...</div>
        </Card>
      </main>
    );
  }

  function saveProfile() {
    writeProfile({ fullName: fullName.trim(), phone: phone.trim() });
    setProfile((p) => (p ? { ...p, fullName: fullName.trim(), phone: phone.trim() } : p));
    toast('Profil bilgileri kaydedildi.', 'success');
  }

  function savePanel() {
    writeProfile({ panelName: panel.trim() });
    setProfile((p) => (p ? { ...p, panelName: panel.trim() } : p));
    toast('Panel adı güncellendi.', 'success');
  }

  function savePassword() {
    if (!pwd.current) return toast('Mevcut şifreyi girin.', 'error');
    if (pwd.next.length < 8) return toast('Yeni şifre en az 8 karakter olmalı.', 'error');
    if (pwd.next !== pwd.repeat) return toast('Yeni şifre ile tekrar eşleşmiyor.', 'error');
    setPwd({ current: '', next: '', repeat: '' });
    toast('Şifre güncellendi (lokal mod).', 'success');
  }

  const initials = (profile.fullName || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const eff = effectivePanelName(profile);

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* HEADER CARD */}
        <div className="rounded-2xl bg-white border border-brand/25 shadow-soft overflow-hidden">
          <div className="bg-gradient-to-br from-brand/10 via-white to-brand/5 p-6">
            <div className="flex items-start gap-4 flex-wrap">
              <div
                className="flex items-center justify-center w-20 h-20 rounded-2xl text-white font-extrabold text-2xl shadow-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}
              >
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[1.4px] text-brand">
                  <UserIcon className="w-3 h-3" />
                  Profilim
                </div>
                <h1 className="font-display text-2xl md:text-[28px] font-extrabold text-text tracking-tight mt-2 leading-tight">
                  {profile.fullName}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand text-white text-[10px] font-bold uppercase tracking-wider">
                    <Shield className="w-3 h-3" />
                    Yönetici
                  </span>
                  <span className="text-[13px] text-text2 inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-text3" />
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <InfoChip icon={Building2} label="Şirket / Panel" value={eff || '—'} />
              <InfoChip icon={Shield} label="Rol" value="Yönetici" />
              <InfoChip icon={Calendar} label="Üyelik Tarihi" value={formatDate(profile.createdAt)} />
            </div>
          </div>
        </div>

        {/* PROFİL BİLGİLERİ */}
        <SectionCard
          icon={UserIcon}
          title="Profil bilgileri"
          description="Görünen adınızı ve iletişim numaranızı güncelleyin."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="!mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text3">Ad Soyad</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız Soyadınız" />
            </div>
            <div>
              <Label className="!mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text3">Telefon</Label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="+90 ..." />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="!mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text3">E-posta</Label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
                <Input value={profile.email} readOnly disabled className="pl-9 cursor-not-allowed bg-bg2" />
              </div>
              <p className="text-[11px] text-text3 mt-1 inline-flex items-center gap-1">
                <Lock className="w-3 h-3" />
                E-posta değiştirilemez. Değişim için iletişime geçin.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <Button onClick={saveProfile}>
              <Save className="w-4 h-4" />
              Kaydet
            </Button>
          </div>
        </SectionCard>

        {/* ŞİRKET / PANEL ADI */}
        <SectionCard
          icon={Building2}
          title="Şirket / Panel Adı"
          description={
            <>
              Topbar'da görünen ad. Varsayılan olarak <strong className="text-text">ad-soyadınız</strong> kullanılır;
              şirket veya ekip adı yazmak isterseniz aşağıdan değiştirebilirsiniz.
            </>
          }
        >
          <Label className="!mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text3">
            Şirket / Panel Adı
          </Label>
          <Input
            value={panel}
            onChange={(e) => setPanel(e.target.value)}
            placeholder={profile.fullName ? `Otomatik: ${profile.fullName}` : 'Şirket / panel adı'}
          />
          <div className="text-[11px] text-text3 mt-1.5">
            Şu an gösterilen: <strong className="text-text font-semibold">{eff || '—'}</strong>
            {!profile.panelName.trim() && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0 rounded bg-brand/10 text-brand text-[9px] font-bold uppercase tracking-wider">
                Otomatik
              </span>
            )}
          </div>
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <Button onClick={savePanel}>
              <Save className="w-4 h-4" />
              Kaydet
            </Button>
            {profile.panelName.trim() && (
              <Button
                variant="ghost"
                onClick={() => {
                  writeProfile({ panelName: '' });
                  setProfile((p) => (p ? { ...p, panelName: '' } : p));
                  setPanel('');
                  toast('Otomatik (ad-soyad) kullanılıyor.', 'info');
                }}
              >
                Varsayılana Döndür
              </Button>
            )}
          </div>
        </SectionCard>

        {/* ŞİFRE GÜVENLİĞİ */}
        <SectionCard
          icon={KeyRound}
          title="Şifre güvenliği"
          description={
            <>
              Mevcut şifrenizi onaylayarak yeni bir şifre belirleyin. Şifrenizi unuttuysanız çıkış yapıp{' '}
              <strong className="text-text">"Şifremi unuttum"</strong> bağlantısını kullanın.
            </>
          }
        >
          <div>
            <Label className="!mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text3">Mevcut Şifre</Label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
              <Input
                type="password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                className="pl-9"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="!mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text3">Yeni Şifre</Label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
                <Input
                  type="password"
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                  className="pl-9"
                  placeholder="En az 8 karakter"
                />
              </div>
            </div>
            <div>
              <Label className="!mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text3">
                Yeni Şifre (Tekrar)
              </Label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
                <Input
                  type="password"
                  value={pwd.repeat}
                  onChange={(e) => setPwd({ ...pwd, repeat: e.target.value })}
                  className="pl-9"
                  placeholder="En az 8 karakter"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center flex-wrap gap-3">
            <Button onClick={savePassword}>
              <Save className="w-4 h-4" />
              Şifreyi Güncelle
            </Button>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-text3">
              <ShieldAlert className="w-3.5 h-3.5 text-yellow" />
              Şifre değişiminden sonra mevcut oturumlar bozulmaz.
            </span>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand/10 text-brand shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wider text-text3">{label}</div>
        <div className="text-[13px] font-semibold text-text truncate">{value}</div>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-soft">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-5">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 text-brand shrink-0">
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-bold text-text tracking-tight">{title}</h3>
            <p className="text-[13px] text-text2 mt-0.5 leading-relaxed">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
