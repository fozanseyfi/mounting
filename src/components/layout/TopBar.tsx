/**
 * Sayfa başlığı şeridi. Global üst bar (hamburger, panel adı, kullanıcı
 * menüsü) artık Sidebar içinde render ediliyor — teklif platformuyla aynı.
 */
export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  if (!title && !subtitle) return null;
  return (
    <div className="px-4 pt-5 sm:px-6 lg:px-8">
      {title && <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>}
      {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
