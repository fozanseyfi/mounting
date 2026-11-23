'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, LogIn, Mail, PlayCircle, Sparkles } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LinkedInIcon } from '@/components/shared/footer';
import { PlatformNoteCard, PrivacyCard } from '@/components/auth/login-info';
import { LoginShowcase } from '@/components/auth/login-showcase';
import { OtherPlatforms } from '@/components/auth/other-platforms';
import { TourLink, TourPromo } from '@/components/auth/tour-promo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleToggle } from '@/components/LocaleToggle';
import { readProfile, writeProfile } from '@/lib/local-profile';
import { login } from '@/lib/session';
import { siteConfig } from '@/lib/site-config';

const { developer } = siteConfig;

const iconBtn =
  'flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary-soft-foreground';

function SocialIcons() {
  return (
    <>
      <a href={developer.linkedin.href} target="_blank" rel="noopener noreferrer" title="LinkedIn" className={iconBtn}>
        <LinkedInIcon className="size-4" />
      </a>
      <a href={developer.website.href} target="_blank" rel="noopener noreferrer" title={developer.website.label} className={iconBtn}>
        <Globe className="size-4" />
      </a>
      <a href={`mailto:${developer.email}`} title="E-posta" className={iconBtn}>
        <Mail className="size-4" />
      </a>
    </>
  );
}

/**
 * Giriş ekranı — Teklif platformunun login şablonu (header, 2 kolon, tanıtım,
 * diğer platformlar, geliştirici footer'ı). Supabase girişi gelene kadar yerel profil ile oturum açar.
 */
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

  return (
    <div className="min-h-screen bg-soft-gradient">
      {/* ÜST BAŞLIK */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3 lg:px-10">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <BrandMark className="size-8 shrink-0 rounded-xl shadow-sm sm:size-9" />
            <div className="leading-tight">
              <p className="text-[13px] font-bold tracking-tight text-foreground sm:text-sm">Solar BOM</p>
              <p className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Konstrüksiyon Tonaj Platformu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <SocialIcons />
            </div>
            <LocaleToggle />
            <ThemeToggle />
            <Link
              href="/tanitim"
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:ml-1.5 sm:h-9 sm:gap-1.5 sm:px-3.5 sm:text-xs"
            >
              <PlayCircle className="size-3 sm:size-3.5" />
              <span className="hidden sm:inline">Platform Tanıtımı</span>
              <span className="sm:hidden">Tanıtım</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ANA — 2 kolon (lg+), tek kolon mobil/tablet */}
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 pb-8 pt-6 sm:gap-8 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(380px,5fr)_7fr] lg:gap-12 lg:px-10 lg:pt-12">
        {/* SOL — Form */}
        <section className="flex flex-col">
          <div className="mx-auto w-full max-w-md animate-in-up">
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/60 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-primary-soft-foreground sm:px-3 sm:py-1 sm:text-[10px]">
              <Sparkles className="size-2.5 sm:size-3" />
              Bağımsız bir inisiyatif
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2.4rem] lg:leading-tight">
              Hoş Geldiniz
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground sm:mt-2 sm:text-sm">
              Solar BOM, GES konstrüksiyonunun parça listesini, tonajını ve maliyetini hesaplayan ücretsiz bir platformdur. Devam etmek için giriş yapın.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3.5 sm:mt-7 sm:space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-foreground">Ad Soyad</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  required
                  autoComplete="name"
                  data-no-i18n
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@firma.com"
                  autoComplete="email"
                  data-no-i18n
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <LogIn className="size-4" /> Giriş Yap
              </button>
            </form>

            <p className="mt-4 text-center text-[12px] text-muted-foreground sm:mt-5">
              Şifreli giriş, platformun kendi veritabanı (Supabase) bağlandığında aktif olacak.
            </p>

            <div className="mt-4">
              <TourLink />
            </div>

            <div className="mt-5 sm:mt-6">
              <PlatformNoteCard />
            </div>
          </div>
        </section>

        {/* SAĞ — Örnek önizleme + Veri Gizliliği (lg+) */}
        <section className="hidden flex-col gap-4 lg:flex lg:self-start">
          <LoginShowcase />
          <PrivacyCard />
        </section>
      </main>

      {/* PLATFORM TANITIMI — giriş yapmadan önce gerçek ekranlarla */}
      <TourPromo />

      {/* DİĞER PLATFORMLAR */}
      <OtherPlatforms />

      {/* GELİŞTİRİCİ FOOTER */}
      <footer className="border-t border-border/60 bg-background/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4 sm:px-6 sm:py-5 sm:text-[12px] lg:px-10">
          <span className="flex flex-wrap items-center justify-center gap-1.5 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Solar BOM</span>
            <span className="text-muted-foreground/60">·</span>
            <span>
              Tasarım &amp; Geliştirme:{' '}
              <a
                href={developer.linkedin.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary hover:underline"
              >
                {developer.name}
              </a>
            </span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <SocialIcons />
          </div>
        </div>
      </footer>
    </div>
  );
}
