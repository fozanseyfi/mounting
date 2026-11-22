"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Heart, ShieldCheck, Check } from "lucide-react";

/**
 * Login sayfasında formun altındaki "Bilgi Paylaşımı" notu ve sağdaki
 * "Veri Gizliliği" kartı — Teklif / Fizibilite platformlarıyla ortak içerik.
 */

export function PlatformNoteCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0B2350] text-white shadow-sm">
          <Heart className="size-4" />
        </div>
        <p className="text-[13.5px] font-bold tracking-tight text-foreground">
          Bireysel İnisiyatifle Geliştirilmiş Bir Araç
        </p>
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
        Bu platform bir satış aracı değil; sahadaki günlük ihtiyaçlardan doğan,{" "}
        <strong className="text-foreground">kişisel kullanım için geliştirilmiş</strong> ve sektör
        paydaşlarıyla <strong className="text-foreground">iyi niyetle paylaşılan</strong> bir araçtır.
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/15 bg-background/70 px-3 py-1.5 text-[12.5px] font-semibold text-foreground/80 transition-colors hover:bg-background"
      >
        {open ? (
          <>
            Notu kapat <ChevronUp className="size-3.5" />
          </>
        ) : (
          <>
            Notu aç <ChevronDown className="size-3.5" />
          </>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-muted-foreground animate-in-up">
          <p>
            Bu platform,{" "}
            <strong className="text-foreground">uzun yıllar boyunca yürüttüğüm operasyonlarda</strong>{" "}
            verimliliği artırmak adına{" "}
            <strong className="text-foreground">kendi kullanımım için geliştirdiğim yapının</strong>,
            modern bir arayüzle sektöre kazandırılmış halidir.
          </p>
          <p>
            Sahadaki ihtiyaçları ve yönetimsel zorlukları bizzat deneyimlemiş bir mühendis olarak; bu
            projeyi <strong className="text-foreground">hiçbir ticari beklenti gütmeksizin</strong>,
            tamamen bireysel bir katkı ve sektör paydaşlarımıza pratik bir çözüm desteği olarak
            sunuyorum.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary-soft-foreground dark:text-primary">
              ✦ Bireysel katkı
            </span>
            <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-[11px] font-semibold text-success-soft-foreground dark:text-emerald-400">
              ✦ Veri sizin
            </span>
            <span className="rounded-full border border-info/25 bg-info/10 px-3 py-1 text-[11px] font-semibold text-info-soft-foreground dark:text-sky-400">
              ✦ Geri bildirim açık
            </span>
          </div>
          <p>
            Sizlerin tecrübeleriyle şekillenecek{" "}
            <strong className="text-foreground">
              her türlü geri bildirim ve görüş benim için çok kıymetli.
            </strong>{" "}
            Platformu daha işlevsel hale getirecek fikir ve önerilerinizi paylaşmanızdan memnuniyet
            duyarım.
          </p>
        </div>
      )}
    </div>
  );
}

export function PrivacyCard() {
  // NOT: Yerel profil girişi için doğru olan maddeler.
  // Supabase girişi geldiğinde RLS / hesap izolasyonu maddeleriyle güncellenecek.
  const items = [
    "Giriş profiliniz yalnızca bu tarayıcıda tutulur",
    "Yerel modda projeler tarayıcıda saklanır",
    "Üçüncü taraf izleme veya analitik yok",
    "Şifreli giriş yakında (Supabase)",
  ];
  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2350] text-white shadow-sm">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-soft-foreground dark:text-primary">
            VERİ GİZLİLİĞİ
          </p>
          <p className="mt-0.5 text-[13px] font-bold text-foreground">
            Verileriniz size aittir; satılmaz, paylaşılmaz.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-1.5 text-[11.5px] text-muted-foreground sm:grid-cols-2">
            {items.map((it) => (
              <li key={it} className="flex items-start gap-1.5">
                <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
