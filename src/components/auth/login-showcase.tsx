"use client";

import { Weight, Layers, Grid3x3, Bolt } from "lucide-react";

/**
 * Login sağ paneli — platformun ne ürettiğini gösteren örnek önizleme.
 * (Teklif platformundaki LoginDemo'nun Solar BOM karşılığı.)
 * Değerler ÖRNEK'tir; gerçek bir projeye ait değildir.
 */

const KPIS = [
  { label: "Toplam Tonaj", value: "412,8 t", icon: Weight },
  { label: "Masa Sayısı", value: "1.240", icon: Grid3x3 },
  { label: "t / MWp", value: "41,3", icon: Layers },
  { label: "Bağlantı El.", value: "186.400 ad", icon: Bolt },
];

// Malzeme kırılımı (ton) — örnek 10 MWp sabit sehpa projesi
const BREAKDOWN = [
  { label: "Kolon", value: 148.6, color: "#0B2350" },
  { label: "Kiriş", value: 96.2, color: "#1A4A94" },
  { label: "Aşık (Purlin)", value: 112.4, color: "#0d9488" },
  { label: "Çapraz / Destek", value: 31.5, color: "#10b981" },
  { label: "Bağlantı Elemanı", value: 9.8, color: "#E8A020" },
  { label: "Galvaniz", value: 14.3, color: "#94a3b8" },
];

const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Basit sehpa çizimi: eğimli panel, ön/arka kolon, aşıklar ve çapraz. */
function TableSketch() {
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" role="img" aria-label="Örnek konstrüksiyon masası kesiti">
      <line x1="8" y1="108" x2="212" y2="108" stroke="#E8A020" strokeWidth="3" strokeLinecap="round" />
      {/* kolonlar */}
      <line x1="62" y1="108" x2="62" y2="70" className="stroke-[#0B2350] dark:stroke-sky-300" strokeWidth="5" strokeLinecap="round" />
      <line x1="158" y1="108" x2="158" y2="38" className="stroke-[#0B2350] dark:stroke-sky-300" strokeWidth="5" strokeLinecap="round" />
      {/* çapraz */}
      <line x1="62" y1="100" x2="158" y2="52" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 0" />
      {/* kiriş */}
      <line x1="28" y1="82" x2="196" y2="26" stroke="#1A4A94" strokeWidth="6" strokeLinecap="round" />
      {/* aşıklar */}
      {[0.12, 0.38, 0.62, 0.88].map((t) => {
        const x = 28 + t * 168;
        const y = 82 - t * 56;
        return <rect key={t} x={x - 4} y={y - 10} width="8" height="8" rx="1.5" fill="#0d9488" />;
      })}
      {/* panel */}
      <line x1="24" y1="70" x2="200" y2="11" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function LoginShowcase() {
  const total = BREAKDOWN.reduce((s, b) => s + b.value, 0);
  const max = Math.max(...BREAKDOWN.map((b) => b.value));

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-large animate-in-up">
      <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          Örnek proje · 10 MWp Arazi GES · Sabit sehpa 2P
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border border-border/60 bg-background p-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                <k.icon className="size-3 text-primary" />
                {k.label}
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,7fr)_5fr]">
          <div className="rounded-xl border border-border/60 bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-foreground">Malzeme kırılımı</p>
              <span className="text-[11px] tabular-nums text-muted-foreground">{fmt(total)} t</span>
            </div>
            <ul className="space-y-2">
              {BREAKDOWN.map((b) => (
                <li key={b.label} className="grid grid-cols-[110px_minmax(0,1fr)_52px] items-center gap-2 text-[11.5px]">
                  <span className="truncate text-muted-foreground">{b.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-secondary">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color }}
                    />
                  </span>
                  <span className="text-right font-semibold tabular-nums text-foreground">{fmt(b.value)} t</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col rounded-xl border border-border/60 bg-background p-4">
            <p className="text-[13px] font-bold text-foreground">Masa tipi · T-28</p>
            <p className="text-[11px] text-muted-foreground">2×14 modül · 25° eğim · 332,9 kg/masa</p>
            <div className="mt-2 min-h-[110px] flex-1">
              <TableSketch />
            </div>
          </div>
        </div>

        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Masa tiplerini tanımlayın; kolon, kiriş, aşık, çapraz ve bağlantı elemanlarının{" "}
          <strong className="text-foreground">ağırlığı ve galvaniz payı otomatik</strong> hesaplansın.
          Proje tonajı, sevk listesi, Excel/PDF rapor ve 3D önizleme tek ekranda.
        </p>
      </div>
    </div>
  );
}
