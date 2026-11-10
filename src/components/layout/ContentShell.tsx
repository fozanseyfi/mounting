'use client';

import { usePathname } from 'next/navigation';

/** Diğer platformlarla ortak şablonu koruyan sayfalar: klasik görünüm uygulanmaz */
const PLATFORM_ROUTES = ['/account', '/contact', '/platforms'];
const isPlatformRoute = (p: string) => PLATFORM_ROUTES.some((r) => p === r || p.startsWith(`${r}/`));

/** İçerik alanı: Fizibilite platformundaki klasik (kurumsal) görünümü uygular. */
export function ContentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  return (
    <div className={`flex min-w-0 flex-1 flex-col ${isPlatformRoute(pathname) ? '' : 'ui-classic'}`}>{children}</div>
  );
}
