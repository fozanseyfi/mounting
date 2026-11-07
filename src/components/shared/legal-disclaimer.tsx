"use client";

import { useState, useEffect } from "react";
import { Scale, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Yasal uyari + sorumluluk reddi metni — single source of truth.
 *
 * Hem `app/(dashboard)/contact/page.tsx` hem de dashboard hero'sundaki
 * <DisclaimerButton /> ayni icerigi render eder. Maddelerden birini
 * degistirmek istersen tek noktada degistirirsin.
 *
 * Server component'lerden de cagrilabilir; bu dosya 'use client' ama
 * `<LegalDisclaimerContent />` saf JSX, sunucu render edilebilir.
 */

interface LegalDisclaimerContentProps {
  /** Onay banner'ini gosterip gostermeme. Modal icinde mantikli (kapatma
   *  zaten kabul anlamina gelir). Sayfa-icinde gosterirken true verilir. */
  showAcceptanceBanner?: boolean;
}

export function LegalDisclaimerContent({
  showAcceptanceBanner = true,
}: LegalDisclaimerContentProps) {
  const developerEmail = siteConfig.developer.email;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 text-xs leading-relaxed text-foreground/85 sm:grid-cols-2 sm:text-[13px]">
        <Clause number="1" title="Bilgi amaçlı kullanım">
          Bu platform; solar GES projelerinde çelik konstrüksiyon, galvaniz ve
          bağlantı elemanı tonajını tahmin etmek için geliştirilmiş bir{" "}
          <strong>hesaplama ve karar destek aracıdır</strong>. Üretilen BOM,
          tonaj ve maliyet çıktıları <strong>resmi bir teklif, statik hesap
          veya imalat onayı niteliği taşımaz</strong>; herhangi bir tarafa
          karşı bağlayıcı değildir.
        </Clause>

        <Clause number="2" title="Profil, katalog ve fiyat bilgileri">
          Profil kesitleri, DIN katalog ağırlıkları, galvaniz kaplama
          kalınlıkları ve birim fiyatlar{" "}
          <strong>tipik referans değerlerdir</strong>. Üretici toleranslarını,
          güncel çelik/galvaniz fiyatlarını veya döviz kurlarını yansıtma
          garantisi vermez. <strong>İmalat öncesinde üreticiden güncel
          ağırlık ve fiyat teyidi alınması şiddetle önerilir</strong>.
        </Clause>

        <Clause number="3" title="Hesaplama doğruluğu">
          Sac açılımı, birim ağırlık, galvaniz ve fire hesapları kullanıcının
          girdiği ölçülere ve seçtiği varsayımlara dayanır. Hesaplama motorunun
          çıktıları <strong>statik/mühendislik hesabı yerine geçmez</strong>.
          Taşıyıcı sistem tasarımı ve nihai onay için yetkili mühendislere
          başvurulmalıdır.
        </Clause>

        <Clause number="4" title="Kullanıcı sorumluluğu">
          Platform üzerinde oluşturulan BOM listelerinin, tonaj ve maliyet
          raporlarının{" "}
          <strong>içeriği, doğruluğu, güncelliği, üçüncü taraflarla
          paylaşılması ve hukuki sonuçları tamamen kullanıcının
          sorumluluğundadır</strong>.
        </Clause>

        <Clause number="5" title="Sorumluluk sınırlaması">
          Platform sahibi ve geliştiricisi; platformun kullanımından veya
          kullanılamamasından, hesaplama hatalarından, eksik/yanlış katalog
          verilerinden ve paylaşılan çıktıların yarattığı doğrudan veya dolaylı
          zararlardan — kâr kaybı, imalat hataları, sözleşmesel cezalar dâhil —{" "}
          <strong>hiçbir şekilde sorumlu tutulamaz</strong>.
        </Clause>

        <Clause number="6" title="Hizmet sunumu">
          Platform &quot;olduğu gibi&quot; (as-is) sunulur; kesintisiz erişim,
          hatasız çalışma veya belirli bir amaca uygunluk konusunda{" "}
          <strong>hiçbir açık veya zımni garanti verilmez</strong>. Geliştirici,
          platformu önceden bildirimde bulunmaksızın güncelleme, geçici olarak
          durdurma veya tamamen kapatma hakkını saklı tutar.
        </Clause>
      </div>

      {showAcceptanceBanner && (
        <div className="rounded-lg border border-warning/30 bg-warning-soft/40 px-4 py-3 text-[12px] leading-relaxed text-warning-soft-foreground">
          <strong>Onayınız:</strong> Platformu kullanmaya devam etmekle
          yukarıdaki tüm şartları okuduğunuzu, anladığınızı ve kabul ettiğinizi
          beyan etmiş sayılırsınız. Sorularınız için{" "}
          <a
            href={`mailto:${developerEmail}`}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {developerEmail}
          </a>{" "}
          adresinden iletişime geçebilirsiniz.
        </div>
      )}
    </div>
  );
}

function Clause({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-warning-soft-foreground/90">
        {number}) {title}
      </p>
      <p>{children}</p>
    </div>
  );
}

/**
 * Sayfa-icinde tam kart gorunumu (icon + baslik + 6 clause + onay).
 * Contact sayfasi kullanir.
 */
export function LegalDisclaimerCard() {
  return (
    <Card className="border-warning/40 bg-warning-soft/20">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning-soft-foreground">
            <Scale className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-warning-soft-foreground/80">
              Yasal Uyarı &amp; Sorumluluk Reddi
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Lütfen platformu kullanmadan önce okuyun
            </h2>
          </div>
        </div>
        <LegalDisclaimerContent />
      </CardContent>
    </Card>
  );
}

/**
 * Hero'larda yasal uyariyi tetikleyen kompakt buton + modal. Dashboard
 * "Yeni Proje" / "Şablonları Gör" yaninda kullanilir; tiklayinca tam metni
 * acilir pencerede gosterir.
 *
 * Goruntu beyaz/seffaf cizgi — emerald hero uzerinde okunabilir kalir.
 */
export function DisclaimerButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  // ESC ile kapat — UX iyilestirmesi
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "border-white/30 bg-white/10 text-primary-foreground backdrop-blur-sm hover:bg-white/20 hover:text-primary-foreground",
          className,
        )}
      >
        <ShieldCheck className="size-4" />
        Disclaimer
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disclaimer-modal-title"
          onClick={(e) => {
            // Backdrop tikla → kapat (modal icine tiklayinca degil)
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-warning/40 bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-warning/30 bg-warning-soft/40 px-6 py-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning-soft-foreground">
                <Scale className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-warning-soft-foreground/80">
                  Yasal Uyarı &amp; Sorumluluk Reddi
                </p>
                <h2
                  id="disclaimer-modal-title"
                  className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg"
                >
                  Lütfen platformu kullanmadan önce okuyun
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body — scroll edilebilir */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <LegalDisclaimerContent />
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t bg-muted/30 px-6 py-4">
              <Button onClick={() => setOpen(false)}>Anladım, kapat</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
