'use client';

import { Bell, Search, User, Menu } from 'lucide-react';
import { useSidebarStore } from '@/lib/sidebar-store';

export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const openMobile = useSidebarStore((s) => s.openMobile);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Mobile menu + title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Hamburger — sadece mobilde */}
          <button
            onClick={openMobile}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0"
            aria-label="Menüyü aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            {title && <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">{title}</h1>}
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Arama — sadece lg+ */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-72">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              placeholder="Proje, parça veya malzeme ara..."
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>

          {/* Bildirim */}
          <button
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center"
            aria-label="Bildirimler"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-orange rounded-full" />
          </button>

          {/* Kullanıcı */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary text-white flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
