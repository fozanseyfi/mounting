'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, User } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { readProfile, writeProfile } from '@/lib/local-profile';
import { login } from '@/lib/session';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleToggle } from '@/components/LocaleToggle';

/** Basit giriş ekranı — Supabase girişi gelene kadar yerel profil ile oturum açar. */
export default function LoginPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const p = readProfile();
    setFullName(p.fullName);
    setEmail(p.email);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    writeProfile({ fullName: fullName.trim(), email: email.trim() });
    login();
    router.replace('/');
  }

  const input =
    'h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex justify-end gap-1 p-4">
        <LocaleToggle />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandMark className="mb-3 size-12" />
            <h1 className="text-xl font-semibold text-foreground">Solar BOM</h1>
            <p className="mt-1 text-sm text-muted-foreground">Konstrüksiyon tonaj hesabı platformuna giriş yapın</p>
          </div>
          <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ad Soyad</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} required data-no-i18n />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-posta</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} data-no-i18n />
              </div>
            </label>
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LogIn className="size-4" /> Giriş Yap
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Şifreli giriş, platformun kendi veritabanı (Supabase) bağlandığında aktif olacak.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
