import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import '@/styles/classic.css';
import '@/styles/dark.css';
import { AppChrome } from '@/components/layout/AppChrome';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmRoot } from '@/components/ui/confirm';
import { LocalApiShim } from '@/components/local/LocalApiShim';
import { I18nRoot } from '@/components/I18nRoot';
import { isDbConfigured } from '@/lib/db';
import type { Locale } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export function generateMetadata(): Metadata {
  const en = cookies().get('locale')?.value === 'en';
  return en
    ? {
        title: 'Solar BOM | Mounting Structure Tonnage',
        description: 'Steel mounting structure weight calculation platform for solar PV projects',
      }
    : {
        title: 'Solar BOM | Konstrüksiyon Tonaj Hesabı',
        description: 'Solar GES projelerinde çelik konstrüksiyon ağırlık hesaplama platformu',
      };
}

const BOOT_SCRIPT =
  "try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}" +
  "if(/(^|; )locale=en/.test(document.cookie)){document.documentElement.classList.add('i18n-pending');setTimeout(function(){document.documentElement.classList.remove('i18n-pending')},2500)}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = cookies().get('locale')?.value === 'en' ? 'en' : 'tr';
  // Sunucu render'ında sayı/tarih biçimi (lib/i18n appLocale)
  (globalThis as { __APP_LOCALE?: Locale }).__APP_LOCALE = locale;
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Gece modu ilk boyamadan önce; EN'de çeviri bitene kadar Türkçe metin görünmez */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className={inter.className}>
        <I18nRoot locale={locale} />
        {/* Veritabanı yoksa API çağrıları tarayıcıdaki yerel kayda yönlenir */}
        <LocalApiShim enabled={!isDbConfigured} />
        <ToastProvider>
          <AppChrome>{children}</AppChrome>
          <ConfirmRoot />
        </ToastProvider>
      </body>
    </html>
  );
}
