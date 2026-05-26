import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmRoot } from '@/components/ui/confirm';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'Solar BOM | Konstrüksiyon Tonaj Hesabı',
  description: 'Solar GES projelerinde çelik konstrüksiyon ağırlık hesaplama platformu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <ToastProvider>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">{children}</div>
          </div>
          <ConfirmRoot />
        </ToastProvider>
      </body>
    </html>
  );
}
