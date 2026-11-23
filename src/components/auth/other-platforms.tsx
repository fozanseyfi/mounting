"use client";

import { Sparkles, ArrowUpRight } from "lucide-react";
import { PlatformLogo, type PlatformId } from "@/components/common/platform-logos";
import { cn } from "@/lib/utils";

interface Platform {
  name: string;
  subtitle: string;
  /** Gerçek logo (kendi projesinden) */
  logo: PlatformId;
  /** Marka rengi (hex) — diğer platformlarla aynı */
  color: string;
  softColor: string;
  href?: string;
  current?: boolean;
  /** Henüz yayında değil */
  soon?: boolean;
}

/** Diğer platformlardaki login şeridiyle aynı sıra ve renkler; "current" bu platform. */
const PLATFORMS: Platform[] = [
  {
    name: "Solar Teklif Platformu",
    subtitle: "Solar EPC fiyatlandırma & kapsam yönetimi",
    logo: "teklif",
    color: "#059669",
    softColor: "#ecfdf5",
    href: "https://teklif.fozanseyfi.com",
  },
  {
    name: "Proje Yönetim Platformu",
    subtitle: "Çoklu proje, ekip ve ilerleme takibi",
    logo: "proje",
    color: "#334155",
    softColor: "#f1f5f9",
    href: "https://pm.fozanseyfi.com",
  },
  {
    name: "Satınalma Karar Destek Platformu",
    subtitle: "Çoklu kriterli skor ile en doğru tedarikçi",
    logo: "karardestek",
    color: "#ca8a04",
    softColor: "#fffbeb",
    href: "https://karardestek.fozanseyfi.com/",
  },
  {
    name: "Solar Fizibilite Platformu",
    subtitle: "GES yatırım & geri ödeme analizi",
    logo: "fizibilite",
    color: "#1A4A94",
    softColor: "#eef3fb",
    href: "https://fizibilite.fozanseyfi.com",
  },
  {
    name: "GES Mühendislik Platformu",
    subtitle: "Tasarım, hesap ve teknik dokümantasyon",
    logo: "ges-muh",
    color: "#e11d48",
    softColor: "#fff1f2",
    soon: true,
  },
  {
    name: "Konstrüksiyon BoM Platformu",
    subtitle: "Solar BOM · Konstrüksiyon tonaj hesabı",
    logo: "bom",
    color: "#1A4A94",
    softColor: "#eef3fb",
    current: true,
  },
];

export function OtherPlatforms() {
  return (
    <section className="border-t border-border/60 bg-gradient-to-b from-primary/[0.05] to-background">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-soft-foreground">
            <Sparkles className="size-3" />
            Geliştirdiğim diğer platformlar
          </div>
          <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Sahadaki ihtiyaçlardan doğan <strong className="text-foreground">bireysel inisiyatif</strong>{" "}
            projeleri. Kart üzerine tıklayarak ilgili platforma geçebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PLATFORMS.map((p) => {
            const Inner = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <PlatformLogo id={p.logo} size={44} className="shrink-0 rounded-xl shadow-sm transition-transform group-hover:scale-105" />
                  {p.current && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: p.softColor, color: p.color }}
                    >
                      Buradasın
                    </span>
                  )}
                  {p.soon && (
                    <span className="shrink-0 rounded-full border border-warning/30 bg-warning-soft/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning-soft-foreground">
                      Yakında
                    </span>
                  )}
                  {!p.current && p.href && (
                    <ArrowUpRight
                      className="size-4 shrink-0 opacity-30 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      style={{ color: p.color }}
                    />
                  )}
                </div>
                <div className="mt-3 min-w-0">
                  <p className="text-[13px] font-bold leading-tight tracking-tight text-foreground sm:text-[13.5px]">
                    {p.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                    {p.subtitle}
                  </p>
                </div>
              </>
            );

            const base = "group flex h-full flex-col rounded-2xl border bg-card p-3.5 shadow-sm transition-all sm:p-4";

            if (p.current) {
              return (
                <div
                  key={p.name}
                  className={base}
                  style={{ borderColor: p.color, boxShadow: `0 0 0 1px ${p.color}22` }}
                  title="Bu platformdasın"
                >
                  {Inner}
                </div>
              );
            }
            if (p.href) {
              return (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(base, "border-border/60 hover:-translate-y-0.5 hover:shadow-md")}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                  title={p.name}
                >
                  {Inner}
                </a>
              );
            }
            return (
              <div
                key={p.name}
                className={cn(base, "cursor-not-allowed border-dashed border-border/60 opacity-80")}
                title="Yakında"
              >
                {Inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
