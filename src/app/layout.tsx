import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/shared/footer';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmRoot } from '@/components/ui/confirm';
import { LocalApiShim } from '@/components/local/LocalApiShim';
import { isDbConfigured } from '@/lib/db';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'Solar BOM | Konstrüksiyon Tonaj Hesabı',
  description: 'Solar GES projelerinde çelik konstrüksiyon ağırlık hesaplama platformu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* Veritabanı yoksa API çağrıları tarayıcıdaki yerel kayda yönlenir */}
        <LocalApiShim enabled={!isDbConfigured} />
        <ToastProvider>
          <div className="min-h-screen bg-slate-50">
            <Sidebar />
            {/* Üst bar fixed (h-14); desktop'ta içerik sidebar genişliği kadar kayar */}
            <div className="flex min-h-screen min-w-0 flex-col pt-14 sidebar-aware">
              <div className="flex min-w-0 flex-1 flex-col">{children}</div>
              <Footer />
            </div>
          </div>
          <ConfirmRoot />
        </ToastProvider>
      </body>
    </html>
  );
}
