'use client';

// Teklif platformundaki sidebar + üst bar ile birebir aynı görsel dil.
// Fark: bu platformda henüz giriş/organizasyon sistemi yok; kullanıcı adı
// ve panel adı local profilden (Profilim sayfası) okunur.

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Library,
  FileBarChart,
  MessageCircle,
  HelpCircle,
  Bell,
  Boxes,
  ChevronDown,
  Share2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCircle2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/layout/BrandMark';
import { readProfile, type LocalProfile } from '@/lib/local-profile';
import { logout } from '@/lib/session';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleToggle } from '@/components/LocaleToggle';

interface NavGroup {
  label: string;
  items: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Ana Menü',
    items: [{ href: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Çalışma Alanı',
    items: [
      { href: '/projects', icon: FolderKanban, label: 'Projeler' },
      { href: '/projects/new', icon: Plus, label: 'Yeni Proje' },
      { href: '/catalog', icon: Library, label: 'DIN Katalog' },
      { href: '/reports', icon: FileBarChart, label: 'Raporlar' },
    ],
  },
  {
    label: 'Yönetim',
    items: [
      { href: '/share', icon: Share2, label: 'Paylaşım Linkleri' },
      { href: '/account', icon: UserCircle2, label: 'Profilim' },
      { href: '/notifications', icon: Bell, label: 'Bildirimler' },
    ],
  },
  {
    label: 'Destek',
    items: [
      { href: '/how-it-works', icon: HelpCircle, label: 'Nasıl Çalışır' },
      { href: '/contact', icon: MessageCircle, label: 'İletişime Geç' },
    ],
  },
  {
    label: 'Diğer Platformlar',
    items: [{ href: '/platforms', icon: Boxes, label: 'Diğer Platformlar' }],
  },
];

const STORAGE_KEY = 'solar-sidebar-collapsed';

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/projects') {
    return pathname === '/projects' || (pathname.startsWith('/projects/') && pathname !== '/projects/new');
  }
  return pathname === href || pathname.startsWith(href + '/');
}

function useLocalProfile(): LocalProfile | null {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  useEffect(() => {
    const load = () => setProfile(readProfile());
    load();
    window.addEventListener('profile:updated', load);
    return () => window.removeEventListener('profile:updated', load);
  }, []);
  return profile;
}

interface NavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavLink({ href, icon: Icon, label, active, collapsed, onNavigate }: NavLinkProps) {
  // Sidebar daraltıkken hover'da portal ile tooltip (overflow clip'inden etkilenmez)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  function handleEnter(e: React.MouseEvent<HTMLElement>) {
    if (!collapsed) return;
    if (typeof window === 'undefined' || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
  }

  return (
    <>
      <Link
        href={href}
        onClick={() => {
          setTooltipPos(null);
          onNavigate?.();
        }}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setTooltipPos(null)}
        className={cn(
          'group flex items-center rounded-lg text-[12px] font-medium transition-colors',
          'gap-2 px-2.5 py-1.5',
          collapsed && 'lg:justify-center lg:gap-0 lg:px-2 lg:py-2',
          active
            ? 'bg-sidebar-accent/20 text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-border/40 hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon
          className={cn(
            'size-4 shrink-0 transition-colors',
            active ? 'text-sidebar-accent-foreground' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
          )}
        />
        <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
        {active && (
          <span className={cn('ml-auto size-1.5 rounded-full bg-sidebar-accent-foreground', collapsed && 'lg:hidden')} />
        )}
      </Link>
      {tooltipPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[100] hidden select-none nav-tooltip-enter lg:block"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            <div className="relative rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
              {label}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-r-[5px] border-y-transparent border-r-slate-900" />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function initials(name: string) {
  const p = name.trim().split(/s+/).filter(Boolean);
  return ((p[0]?.[0] || '?') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

/** Hesap menüsü (Fizibilite ile aynı): avatar + ad + e-posta; açılır listede Profilim, Bildirimler, Çıkış Yap. */
function UserMenu({ name, email, compact = false }: { name: string; email: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const item = 'flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted';

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
        aria-label="Hesap menüsü"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar text-[11px] font-semibold text-white">
          {initials(name)}
        </div>
        {!compact && (
          <>
            <div className="min-w-0 leading-tight" data-no-i18n>
              <p className="truncate text-[13px] font-semibold text-foreground">{name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{email}</p>
            </div>
            <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </>
        )}
      </button>
      {open && (
        <div className={cn('absolute top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border bg-card shadow-lg', compact ? 'right-0' : 'left-0')}>
          <div className="border-b bg-muted/40 px-3 py-2">
            <p className="truncate text-sm font-semibold text-foreground" data-no-i18n>{name}</p>
            <p className="truncate text-xs text-muted-foreground"><span data-no-i18n>{email}</span> · Yönetici</p>
          </div>
          <Link href="/account" onClick={() => setOpen(false)} className={item}>
            <UserCircle2 className="size-4 text-muted-foreground" />
            Profilim
          </Link>
          <Link href="/notifications" onClick={() => setOpen(false)} className={item}>
            <Bell className="size-4 text-muted-foreground" />
            Bildirimler
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              router.replace('/login');
            }}
            className={cn(item, 'border-t')}
          >
            <LogOut className="size-4 text-muted-foreground" />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname() ?? '/';
  const profile = useLocalProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let initial = false;
    try {
      initial = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {}
    setCollapsed(initial);
    document.documentElement.style.setProperty('--sidebar-w', initial ? '4rem' : '14rem');
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileOpen]);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {}
      document.documentElement.style.setProperty('--sidebar-w', next ? '4rem' : '14rem');
      return next;
    });
  }

  const userName = profile?.fullName || 'Kullanıcı';
  const userEmail = profile?.email || '';

  return (
    <>
      {/* Sticky top bar — mobil + desktop */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md sm:px-4 lg:px-6">
        <div className="contents lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Menüyü aç"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>
          <Link
            href="/"
            aria-label="Dashboard'a git"
            className="flex min-w-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
          >
            <BrandMark className="size-8 shrink-0 rounded-[22%] ring-1 ring-black/5" />
            <p className="truncate text-sm font-semibold text-foreground">Solar BOM</p>
          </Link>
        </div>

        {/* Masaüstü: hesap menüsü sidebar'ın hemen sağında */}
        <div
          className="hidden min-w-0 items-center lg:flex"
          style={{ marginLeft: 'var(--sidebar-w, 14rem)', transition: 'margin-left 200ms' }}
        >
          <UserMenu name={userName} email={userEmail} />
        </div>

        {/* Sağ: dil + gece modu */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <LocaleToggle />
          <ThemeToggle />
          <div className="lg:hidden">
            <UserMenu name={userName} email={userEmail} compact />
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar — mobilde drawer, desktop'ta fixed */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground',
          'transition-[transform,width] duration-200',
          'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:[width:var(--sidebar-w,14rem)]'
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Menüyü kapat"
          className="absolute right-3 top-3 z-40 flex size-9 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-border/40 hover:text-white lg:hidden"
        >
          <X className="size-5" />
        </button>

        {/* Logo + collapse */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-sidebar-border',
            'max-lg:gap-3 max-lg:px-5',
            collapsed ? 'lg:justify-center lg:px-2' : 'lg:gap-3 lg:pl-5 lg:pr-2'
          )}
        >
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            aria-label="Dashboard'a git"
            title="Dashboard'a git"
            className={cn(
              'flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-80',
              collapsed ? 'lg:flex-none lg:gap-0' : 'flex-1'
            )}
          >
            <BrandMark className="size-9 shrink-0 rounded-[22%] ring-1 ring-white/20" />
            <div className={cn('min-w-0 flex-1', collapsed ? 'lg:hidden' : '')}>
              <p className="truncate text-sm font-semibold tracking-tight text-white">Solar BOM</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleCollapse}
            title={collapsed ? 'Menüyü aç' : 'Menüyü kapat'}
            aria-label={collapsed ? 'Menüyü aç' : 'Menüyü kapat'}
            className={cn(
              'hidden size-7 shrink-0 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-border/50 hover:text-white lg:flex',
              collapsed && 'lg:hidden'
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            title="Menüyü aç"
            aria-label="Menüyü aç"
            className="mx-auto mt-2 hidden size-7 shrink-0 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-border/50 hover:text-white lg:flex"
          >
            <ChevronRight className="size-4" />
          </button>
        )}

        <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'lg:px-2' : 'lg:px-3', 'max-lg:px-3')}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-5' : ''}>
              <p
                className={cn(
                  'mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted/80',
                  collapsed ? 'lg:hidden' : ''
                )}
              >
                {group.label}
              </p>
              {collapsed && gi > 0 && <div className="mx-2 mb-2 hidden h-px bg-sidebar-border lg:block" />}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(pathname, item.href)}
                    collapsed={collapsed}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
