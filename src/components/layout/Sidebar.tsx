'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Library,
  Settings,
  Sun,
  FileBarChart,
  User,
  Users,
  Share2,
  History,
  BookOpen,
  MessageCircle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/sidebar-store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  tone: 'green' | 'blue' | 'purple' | 'yellow';
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Ana Menü',
    tone: 'green',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/projects', label: 'Projeler', icon: FolderKanban },
      { href: '/projects/new', label: 'Yeni Proje', icon: Plus },
      { href: '/catalog', label: 'DIN Katalog', icon: Library },
      { href: '/reports', label: 'Raporlar', icon: FileBarChart },
    ],
  },
  {
    title: 'Yönetim',
    tone: 'blue',
    items: [
      { href: '/account', label: 'Profilim', icon: User },
      { href: '/users', label: 'Kullanıcılar', icon: Users },
      { href: '/share', label: 'Paylaşım Linkleri', icon: Share2 },
      { href: '/audit', label: 'Aktivite Kayıtları', icon: History },
    ],
  },
  {
    title: 'Destek',
    tone: 'purple',
    items: [
      { href: '/how-it-works', label: 'Nasıl Çalışır', icon: BookOpen },
      { href: '/contact', label: 'İletişime Geç', icon: MessageCircle },
    ],
  },
  {
    title: 'Diğer Platformlar',
    tone: 'yellow',
    items: [{ href: '/platforms', label: 'Diğer Platformlar', icon: Boxes }],
  },
];

const TONE_DOT: Record<NavGroup['tone'], string> = {
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  yellow: 'bg-amber-500',
};

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  // Route değişince mobil drawer'ı kapat
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // ESC ile mobil drawer'ı kapat
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMobile();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeMobile]);

  // Mobil drawer açıkken body scroll'u kilitle
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'bg-white border-r border-slate-200 h-screen flex flex-col',
          'transition-[width,transform] duration-300 ease-out',
          // Mobile: fixed overlay drawer
          'fixed inset-y-0 left-0 z-50 w-72',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          // Desktop: sticky in flex flow
          'md:sticky md:top-0 md:translate-x-0 md:shadow-none',
          collapsed ? 'md:w-[72px]' : 'md:w-64'
        )}
        aria-label="Ana navigasyon"
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center gap-3 border-b border-slate-100 shrink-0 relative',
            collapsed ? 'md:px-3 md:justify-center px-4 py-5' : 'px-4 py-5'
          )}
        >
          <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center shadow-md shrink-0">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div className={cn('min-w-0 flex-1 overflow-hidden', collapsed && 'md:hidden')}>
            <p className="font-bold text-slate-900 leading-tight truncate">Solar BOM</p>
            <p className="text-xs text-slate-500 leading-tight truncate">Tonaj Hesaplama v1.0</p>
          </div>

          {/* Desktop collapse/expand toggle — sağa floating */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              'hidden md:flex items-center justify-center w-7 h-7 rounded-md',
              'bg-white border border-slate-200 text-slate-500 hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-all',
              'absolute -right-3 top-1/2 -translate-y-1/2 z-10'
            )}
            title={collapsed ? "Sidebar'ı genişlet" : "Sidebar'ı daralt"}
            aria-label={collapsed ? "Sidebar'ı genişlet" : "Sidebar'ı daralt"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={closeMobile}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
            aria-label="Menüyü kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <div
                className={cn(
                  'px-3 py-2 flex items-center gap-2',
                  collapsed && 'md:justify-center md:px-2 md:py-1.5'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', TONE_DOT[group.tone])} />
                <p
                  className={cn(
                    'text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate',
                    collapsed && 'md:hidden'
                  )}
                >
                  {group.title}
                </p>
              </div>
              {group.items.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href ||
                      (item.href !== '/projects/new' && pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                      collapsed ? 'md:justify-center md:px-2 md:py-2.5 px-3 py-2' : 'px-3 py-2',
                      active
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-3 space-y-1.5 shrink-0">
          <Link
            href="/settings"
            title={collapsed ? 'Ayarlar' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
              collapsed ? 'md:justify-center md:px-2 md:py-2.5 px-3 py-2.5' : 'px-3 py-2.5',
              pathname === '/settings'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className={cn('truncate', collapsed && 'md:hidden')}>Ayarlar</span>
          </Link>

          <div className={cn('px-3 pt-2 border-t border-slate-100', collapsed && 'md:hidden')}>
            <p className="text-[10px] text-slate-400">© 2026 Kontrolmatik</p>
          </div>
        </div>
      </aside>
    </>
  );
}
