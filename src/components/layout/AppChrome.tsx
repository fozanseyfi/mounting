'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { ContentShell } from '@/components/layout/ContentShell';
import { Footer } from '@/components/shared/footer';
import { isLoggedOut, SESSION_EVENT } from '@/lib/session';

/**
 * Uygulama kabuğu: sidebar + üst bar + içerik + footer.
 * /login sayfası kabuksuz açılır; çıkış yapılmışsa diğer sayfalar /login'e yönlenir.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const isLogin = pathname === '/login';
  const [out, setOut] = useState(false);

  useEffect(() => {
    const check = () => setOut(isLoggedOut());
    check();
    window.addEventListener(SESSION_EVENT, check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener(SESSION_EVENT, check);
      window.removeEventListener('storage', check);
    };
  }, []);

  useEffect(() => {
    if (out && !isLogin) router.replace('/login');
  }, [out, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (out) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Üst bar fixed (h-14); desktop'ta içerik sidebar genişliği kadar kayar */}
      <div className="flex min-h-screen min-w-0 flex-col pt-14 sidebar-aware">
        <ContentShell>{children}</ContentShell>
        <Footer />
      </div>
    </div>
  );
}
