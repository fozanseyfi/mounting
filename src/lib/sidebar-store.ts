'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Sidebar state:
 *  - collapsed: desktop'ta sidebar dar (sadece ikon) mu?
 *  - mobileOpen: mobilde drawer açık mı?
 *
 * collapsed localStorage'da saklanır, mobileOpen geçici.
 */
interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (v: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (v) => set({ collapsed: v }),
      openMobile: () => set({ mobileOpen: true }),
      closeMobile: () => set({ mobileOpen: false }),
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
    }),
    {
      name: 'sidebar-state',
      // Sadece collapsed kalıcı, mobileOpen sayfa yeniden açıldığında kapalı başlasın
      partialize: (state) => ({ collapsed: state.collapsed }),
    }
  )
);
