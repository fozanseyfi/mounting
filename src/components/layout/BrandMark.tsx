/**
 * Platform logosu — "Sehpa": Fizibilite platformuyla aynı lacivert zemin;
 * beyaz eğimli panel + iki kolon (konstrüksiyon), altın zemin çizgisi.
 * Aynı sanat src/app/icon.svg'de favicon olarak kullanılır; birlikte güncelle.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sb-bm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0B2350" />
          <stop offset="1" stopColor="#1A4A94" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#sb-bm-g)" />
      <path d="M22 28 V46 M42 21 V46" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M13 31 L51 18" fill="none" stroke="#FFFFFF" strokeWidth="6.5" strokeLinecap="round" />
      <path d="M13 47 H51" fill="none" stroke="#E8A020" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
