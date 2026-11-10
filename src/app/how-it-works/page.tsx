import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Lightbulb,
  ChevronDown,
  HelpCircle,
  Layers,
  Boxes,
  Sun,
  Hammer,
  Wallet,
  FileBarChart,
  Box,
  Ruler,
  Library,
  Calculator,
  Cog,
  Droplets,
  FlaskConical,
  ArrowRight,
} from 'lucide-react';

interface Step {
  num: string;
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  details: {
    intro: string;
    bullets: { label: string; value: string }[];
    tip?: string;
  };
}

const STEPS: Step[] = [
  {
    num: '01',
    title: 'Proje Oluştur',
    summary: 'Müşteri, lokasyon, panel gücü ve eğim açısı bilgilerini gir.',
    icon: Sparkles,
    details: {
      intro:
        'Yeni proje wizard\'ı 2 adımda tamamlanır: proje meta bilgileri (ad, müşteri, lokasyon, açıklama) ve panel spesifikasyonu (tek panel gücü Wp + sehpa eğim açısı). Toplam MW hesabı panel gücünden otomatik üretilir.',
      bullets: [
        { label: 'Adım 1', value: 'Ad · Müşteri · Lokasyon · Açıklama' },
        { label: 'Adım 2', value: 'Panel Wp · Eğim açısı (°)' },
        { label: 'Sonraki', value: 'Masa tipi ekleme' },
      ],
      tip: 'Panel uzunluk/genişlik sorulmaz — gerekirse 3D önizleme için varsayılan değer kullanılır.',
    },
  },
  {
    num: '02',
    title: 'Masa Tipleri Tanımla',
    summary: 'Sahanızda kaç farklı sehpa konfigürasyonu varsa her birini "Tip-1, Tip-2..." olarak ekleyin.',
    icon: Layers,
    details: {
      intro:
        'Bir projede birden fazla masa tipi olabilir — örn. düz arazide 28 panel × 80 adet (Tip-1) + eğimli arazide 32 panel × 20 adet (Tip-2). Her tipin kendi panel sayısı, masa adedi ve parça/bağlantı elemanları olur.',
      bullets: [
        { label: 'Tip başına', value: 'Ad · Panel/masa · Masa adedi' },
        { label: 'Otomatik gelen', value: '7 standart parça (boş şablon)' },
        { label: 'Proje toplamı', value: 'Tüm tiplerin tonajı toplanır' },
      ],
      tip: 'Tek tip yeterli olabilir — küçük projelerde "Tip-1" altında her şeyi girersiniz.',
    },
  },
  {
    num: '03',
    title: 'Standart Parçaları Doldur',
    summary: 'Yeni tipte 7 standart parça hazır gelir (Ön Kolon, Arka Kolon, Kiriş, Aşık, Çapraz, Payanda, Ek Elemanı).',
    icon: Boxes,
    details: {
      intro:
        'Her yeni masa tipi oluşturulduğunda 7 standart parça boş şablon olarak gelir. Parça satırına veya adına tıklayarak detay formunu açıp profil tipini (C, U, Z, L, Sigma, Omega, I, H, C-Lipli), kalınlığı, kenar ölçülerini, uzunluğu ve adet sayısını girersiniz.',
      bullets: [
        { label: 'Profil tipi', value: '10 hazır profil + Özel (Custom)' },
        { label: 'Şema', value: 'Mühendislik dim. çizimi · a, b, c…' },
        { label: 'Otomatik', value: 'Sac açılımı · birim ağırlık · galvaniz' },
      ],
      tip: 'Profil şemasında bir kenar etiketine fareyle yaklaşınca o kenar vurgulanır.',
    },
  },
  {
    num: '04',
    title: 'Bağlantı Elemanlarını Gir',
    summary: 'DIN katalogtan seç ya da manuel gir; manuel kayıtlar kütüphaneye eklenir.',
    icon: Hammer,
    details: {
      intro:
        '40+ DIN standardı (DIN933 cıvata, DIN934 somun, DIN127 yaylı rondela, DIN125A düz rondela, DIN912 imbus, klemp vb.) hazır gelir. Dropdown\'dan seçtiğinizde tüm bilgiler otomatik dolar. Manuel girdiyseniz "Kütüphaneye kaydet" ile sonraki projelerinizde tekrar kullanabilirsiniz.',
      bullets: [
        { label: 'Katalog', value: '40+ DIN standardı hazır' },
        { label: 'Manuel ekleme', value: 'Üretici özel kalemler' },
        { label: 'Hibrit kullanım', value: 'Catalog + kendi kütüphanesi' },
      ],
      tip: 'Aynı bağlantı elemanını birden fazla masa tipinde kullanırsanız, her tipte ayrıca eklemeniz gerekir.',
    },
  },
  {
    num: '05',
    title: 'Tonaj Otomatik Hesaplansın',
    summary: 'Sac açılımı + birim ağırlık + galvaniz + bağlantı = tek masa kg → toplam ton.',
    icon: Ruler,
    details: {
      intro:
        'Hesaplama akışı: sac açılımı = Σ kenarlar - büküm sayısı × (2 × kalınlık - büküm payı). Birim ağırlık = açılım × uzunluk × kalınlık × 7,85 g/cm³. Galvaniz = 2 × açılım × uzunluk / 1.000.000 × 0,6 kg/m². Fire dahil toplam masa = Σ parçalar × adet × (1 + fire/100). Proje toplamı = tüm tiplerin tonajı.',
      bullets: [
        { label: 'Çelik yoğunluğu', value: '7,85 g/cm³' },
        { label: 'Galvaniz', value: '600 g/m² (sıcak daldırma)' },
        { label: 'Fire', value: 'Varsayılan %2 — kalem bazında ayarlanır' },
      ],
      tip: 'Verimlilik metriği Ton / MWp — sektör ortalaması 15-25 Ton / MWp arasıdır.',
    },
  },
  {
    num: '06',
    title: 'Maliyet Hesabını Gir',
    summary: 'Sac fiyatı + galvaniz + işçilik + bağlantı + nakliye + diğer = toplam çelik maliyeti.',
    icon: Wallet,
    details: {
      intro:
        '"Maliyet" sekmesinde birim fiyatları girersiniz (tüm birimler USD): Sac fiyatı (USD/kg), galvaniz kaplama (USD/kg), büküm + işçilik (USD/kg çelik), bağlantı elemanları (USD/kg), nakliye (sabit USD), diğer giderler (sabit USD). Toplam maliyet ve USD / MWp anlık hesaplanır.',
      bullets: [
        { label: 'Para birimi', value: 'USD' },
        { label: 'Anlık', value: 'Form değişince hesap güncel' },
        { label: 'Görselleştirme', value: 'Kalem dağılımı %\'li progress bar' },
      ],
      tip: 'Maliyet bilgilerini "Kaydet" ile DB\'ye yazarsanız, raporlarda da yer alır.',
    },
  },
  {
    num: '07',
    title: '3D Önizleme · Excel · PDF',
    summary: 'Sehpayı 3D olarak görüntüleyin, Excel/PDF rapor indirin.',
    icon: FileBarChart,
    details: {
      intro:
        '3D sekmesinde masa tipini seçerek Three.js sahnesinde gerçekçi önizleme görürsünüz (panel, kolon, aşık, çapraz). Excel raporu her masa tipi için ayrı BOM sayfası ile birlikte özet/maliyet sayfası içerir. PDF kapakta GRAND TOTAL ton + toplam maliyet banner\'ı, her tip için detay sayfa.',
      bullets: [
        { label: '3D', value: 'Döndür · zoom · etiket · panel toggle' },
        { label: 'Excel', value: 'Özet · Masa Tipleri · Her tip için BOM' },
        { label: 'PDF', value: 'Kapak · KPI · Maliyet analizi · Detaylar' },
      ],
      tip: '3D sahne tip bazlı — istediğiniz tipi seçip görüntüleyebilirsiniz.',
    },
  },
];

const STATS = [
  { icon: Sun, value: '10', label: 'Profil Tipi' },
  { icon: Library, value: '40+', label: 'DIN Bağlantı Standardı' },
  { icon: Box, value: '7 adım', label: 'Uygulama Akışı' },
  { icon: Layers, value: 'Çoklu', label: 'Masa Tipi Desteği' },
];

export default function HowItWorksPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero — teklif platformu ile aynı */}
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-slate-50 shadow-sm">
          <div className="flex items-start gap-4 p-6 sm:items-center sm:p-8">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:size-14">
              <HelpCircle className="size-6 sm:size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-soft-foreground">
                <Sparkles className="size-3" />
                Nasıl Çalışır
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Solar BOM Platformunu Adım Adım Tanıyın
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Proje oluşturmaktan Excel/PDF rapora kadar tüm akışı {STEPS.length} adımda inceleyin.
                Her adımda ne yapılır, hangi değer otomatik hesaplanır, ne tip pratikler işinizi
                kolaylaştırır — burada yazılı.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t bg-white/60 p-4 sm:grid-cols-4 sm:p-6">
            {STATS.map((s) => (
              <Stat key={s.label} icon={s.icon} label={s.value} caption={s.label} />
            ))}
          </div>
        </div>

        {/* İpucu */}
        <div className="rounded-2xl border border-info/30 bg-info-soft/40 p-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-info-soft-foreground" />
            <div>
              <p className="text-sm font-bold text-info-soft-foreground">İpucu</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-info-soft-foreground/90">
                Parça ölçülerini girdiğiniz anda sac açılımı, birim ağırlık, galvaniz ve fire dahil
                masa tonajı otomatik hesaplanır. Masa adedini değiştirdiğinizde proje toplamı anında
                güncellenir.
              </p>
            </div>
          </div>
        </div>

        {/* Adımlar — her adım açılır/kapanır */}
        <div className="relative">
          <div className="pointer-events-none absolute bottom-0 left-[27px] top-0 hidden w-px bg-gradient-to-b from-primary/30 via-border to-transparent sm:block" />
          <div className="space-y-2.5">
            {STEPS.map((step, idx) => (
              <StepCard key={step.num} step={step} first={idx === 0} />
            ))}
          </div>
        </div>

        {/* Teknik açıklamalar — formüller */}
        <TechnicalExplanations />

        {/* Alt CTA */}
        <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
          <h3 className="text-lg font-bold tracking-tight text-foreground">Hazır olduğunda yeni bir proje aç</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Masa tiplerini tanımlayıp tonaj hesabına hemen başlayabilirsin.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary-soft-foreground"
            >
              <Library className="size-4" />
              DIN Kataloğu İncele
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Sparkles className="size-4" />
              Yeni Proje Oluştur
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  caption,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card p-2.5 shadow-sm">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold leading-none tabular-nums text-foreground">{label}</p>
        <p className="mt-0.5 text-[10.5px] text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
}

/* ============================================================
   TEKNİK AÇIKLAMALAR — Hesaplar nasıl yapılıyor?
   - Sac açılımı (büküm payı / K-faktörü)
   - Sac ağırlığı (yoğunluk × hacim)
   - Galvaniz kaplama (70 µm sıcak daldırma)
============================================================ */

function TechnicalExplanations() {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand/8 via-white to-white p-5 sm:p-6 animate-slide-up">
        <div className="flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand text-white shadow-soft shrink-0">
            <Calculator size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-[1.5px]">
              <FlaskConical size={11} /> TEKNİK AÇIKLAMALAR
            </span>
            <h2 className="font-display text-2xl sm:text-[26px] font-extrabold text-text leading-tight tracking-tight mt-2">
              Hesaplar Nasıl Yapılır?
            </h2>
            <p className="text-sm text-text2 mt-2 max-w-3xl leading-relaxed">
              Bu bölümde tonaj hesabının arka planında çalışan üç temel formülü açıklıyoruz:
              <strong className="text-text"> sac açılımı (büküm payı)</strong>,
              <strong className="text-text"> çelik sac birim ağırlığı</strong> ve
              <strong className="text-text"> sıcak daldırma galvaniz kaplama (70 µm) ağırlığı.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 1. SAC AÇILIMI */}
      <ExplainCard
        num="1"
        icon={Ruler}
        title="Sac Açılımı (Developed Width)"
        subtitle="Bükümlü profili düz sac genişliğine çevirme"
      >
        <p>
          C, U, Z gibi profiller önce <strong className="text-text">düz bir sac</strong> halinde
          kesilir, sonra abkant preste bükülerek nihai forma kavuşur. Hesabın doğru olabilmesi için
          bükümlü parçanın <strong className="text-text">düz açılımının</strong> bilinmesi gerekir.
        </p>

        <p className="mt-2">
          Bir saç büküldüğünde dış yüzey gerilir, iç yüzey sıkışır; arada bir{' '}
          <strong className="text-text">tarafsız eksen (neutral axis)</strong> kalır. Bu eksen,
          malzemenin kalınlığı içinde belirli bir konumda durur ve düz açılım hesabı bu eksen
          üzerinden yapılır.
        </p>

        <FormulaBlock title="Pratik formül (90° büküm, yumuşak çelik)">
          {`developed_width = Σ(kenarlar) − bend_count × (2t − BA)

burada:
  Σ(kenarlar)  = dış kenar ölçülerinin toplamı (mm)
  bend_count   = büküm adedi
  t            = malzeme kalınlığı (mm)
  BA           = büküm payı (Bend Allowance, mm)
  BA ≈ t × K   (K-faktörü, yumuşak çelik için 0.41–0.50)`}
        </FormulaBlock>

        <p className="mt-3">
          Uygulamada <strong className="text-text">K-faktörü varsayılan olarak 0.50</strong> alınır
          (basit, pratik yaklaşım). Yani <code className="font-mono bg-bg2 px-1 rounded">BA = t × 0.5</code>.
          Mühendislik gerektiren projelerde K-faktörünü malzeme/iç bükme yarıçapına göre
          (0.33–0.50 arası) düzenleyebilirsiniz.
        </p>

        <WorkedExample title="Örnek — C profili (2 mm × 70-120-70)">
          <table className="w-full text-[12.5px] mt-2">
            <tbody className="divide-y divide-slate-100">
              <ExRow label="Kalınlık" value="t = 2 mm" />
              <ExRow label="Kenarlar" value="a = 70, b = 120, c = 70 mm" />
              <ExRow label="Büküm adedi (C profil)" value="bend_count = 2" />
              <ExRow label="Büküm payı (K=0.5)" value="BA = 2 × 0.5 = 1 mm" />
              <ExRow label="Düzeltme" value="2 × (2t − BA) = 2 × (4 − 1) = 6 mm" />
              <ExRow label="Σ kenarlar" value="70 + 120 + 70 = 260 mm" />
              <ExRow label="Açılım" value="260 − 6 = 254 mm" highlight />
            </tbody>
          </table>
          <p className="mt-2 text-[12px] text-text3">
            Yani 70-120-70 mm dış ölçülerinde bir C profili kesmek için{' '}
            <strong className="text-text">254 mm</strong> genişlikte sac kullanılır.
          </p>
        </WorkedExample>

        <Tip>
          Sigma (Σ), Omega (Ω) gibi çok bükümlü profiller için aynı formül geçerlidir; sadece
          <strong> büküm adedi</strong> ve kenar sayısı artar.
        </Tip>
      </ExplainCard>

      {/* 2. SAÇ AĞIRLIĞI */}
      <ExplainCard
        num="2"
        icon={Cog}
        title="Çelik Sac Birim Ağırlığı"
        subtitle="Hacim × yoğunluk = ağırlık"
      >
        <p>
          Açılımı bulduktan sonra bir parçanın ağırlığı, <strong className="text-text">hacim ×
          yoğunluk</strong> formülüyle hesaplanır. Düz sac dikdörtgen prizma olarak modellenir:
        </p>

        <FormulaBlock title="Sac birim ağırlığı (1 adet için)">
          {`unit_weight (kg) = açılım × uzunluk × kalınlık × ρ_çelik

birim:  mm × mm × mm × (kg/mm³)

ρ_çelik = 7.85 g/cm³ = 7850 kg/m³ = 7.85 × 10⁻⁶ kg/mm³`}
        </FormulaBlock>

        <p className="mt-3">
          Çelik yoğunluğu sektörde sabit kabul edilir (yumuşak yapı çeliği S235/S275 için 7.85
          g/cm³). Stoklanan malzemenin gerçek yoğunluğu ±%0.5 değişebilir; bu hesabı pratikte
          etkilemez.
        </p>

        <WorkedExample title="Örnek — Aşık parçası (P3) devamı">
          <table className="w-full text-[12.5px] mt-2">
            <tbody className="divide-y divide-slate-100">
              <ExRow label="Açılım (önceki adım)" value="254 mm" />
              <ExRow label="Uzunluk" value="3890 mm" />
              <ExRow label="Kalınlık" value="2 mm" />
              <ExRow label="Yoğunluk" value="7.85 × 10⁻⁶ kg/mm³" />
              <ExRow label="Hesap" value="254 × 3890 × 2 × 7.85e-6" />
              <ExRow label="Birim ağırlık" value="≈ 15.51 kg/adet" highlight />
              <ExRow label="Masada 12 adet × %2 fire" value="≈ 189.84 kg" />
            </tbody>
          </table>
          <p className="mt-2 text-[12px] text-text3">
            Tek bir aşık parçası ~15.5 kg ağırlığında. Bir masada 12 adet × fire ile{' '}
            <strong className="text-text">~190 kg</strong> sadece aşık olarak.
          </p>
        </WorkedExample>

        <Tip>
          Toplam = Σ(her parça için unit_weight × adet × (1 + fire/100)). Fire oranı uygulamada
          varsayılan <strong>%2</strong>'dir; her parça için ayrı belirleyebilirsiniz.
        </Tip>
      </ExplainCard>

      {/* 3. GALVANİZ KAPLAMA */}
      <ExplainCard
        num="3"
        icon={Droplets}
        title="Sıcak Daldırma Galvaniz (70 µm)"
        subtitle="Çinko kaplamanın ağırlığa katkısı"
      >
        <p>
          Solar GES konstrüksiyonu sahada 25+ yıl korozyon görmemesi için{' '}
          <strong className="text-text">sıcak daldırma galvaniz</strong> kaplanır. EN ISO 1461
          standardına göre malzeme kalınlığına bağlı minimum kaplama kalınlıkları vardır:
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[12px] border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-bg2 text-text2 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Malzeme kalınlığı</th>
                <th className="text-left px-3 py-2 font-semibold">Min. kaplama</th>
                <th className="text-left px-3 py-2 font-semibold">Ort. kaplama</th>
                <th className="text-left px-3 py-2 font-semibold">≈ g/m²</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr><td className="px-3 py-1.5">t &lt; 1.5 mm</td><td className="px-3 py-1.5">45 µm</td><td className="px-3 py-1.5">55 µm</td><td className="px-3 py-1.5 font-mono">~390</td></tr>
              <tr><td className="px-3 py-1.5">1.5 ≤ t &lt; 3 mm</td><td className="px-3 py-1.5">55 µm</td><td className="px-3 py-1.5">65 µm</td><td className="px-3 py-1.5 font-mono">~465</td></tr>
              <tr className="bg-brand/5"><td className="px-3 py-1.5 font-semibold">3 ≤ t ≤ 6 mm</td><td className="px-3 py-1.5 font-semibold">70 µm</td><td className="px-3 py-1.5">85 µm</td><td className="px-3 py-1.5 font-mono font-bold text-brand">~500</td></tr>
              <tr><td className="px-3 py-1.5">t &gt; 6 mm</td><td className="px-3 py-1.5">85 µm</td><td className="px-3 py-1.5">100 µm</td><td className="px-3 py-1.5 font-mono">~605</td></tr>
            </tbody>
          </table>
          <p className="text-[11px] text-text3 mt-1.5">
            Tablo: EN ISO 1461. Solar konstrüksiyon parçaları (2–4 mm) için tipik kalınlık{' '}
            <strong className="text-text">70 µm civarındadır</strong>.
          </p>
        </div>

        <FormulaBlock title="Galvaniz birim ağırlığı (kg/m²)">
          {`coating_weight = thickness_µm × ρ_çinko × 10⁻³

ρ_çinko = 7.14 g/cm³

Örnek (70 µm):
  = 70 × 7.14 × 10⁻³  →  0.500 kg/m²  (500 g/m²)

Yaygın kullanılan değerler:
   60 µm  →  428 g/m²  (yumuşak kullanım — ince sac)
   70 µm  →  500 g/m²  (solar GES standardı — DEFAULT)
   85 µm  →  600 g/m²  (ağır endüstri / yer altı)
  100 µm  →  714 g/m²  (offshore / korozif ortam)`}
        </FormulaBlock>

        <p className="mt-3">
          Galvaniz kaplama parçanın <strong className="text-text">iki yüzeyini birden</strong>{' '}
          kaplar — daldırma tankında her yüzey çinkoya temas eder. Bu yüzden yüzey alanı hesabında
          iki yüz çarpan olarak girer:
        </p>

        <FormulaBlock title="Galvaniz toplam ağırlığı">
          {`surface_area (m²) = 2 × açılım × uzunluk / 1.000.000

galvanizing_weight (kg) = surface_area × coating_weight

  = 2 × açılım[mm] × uzunluk[mm] / 10⁶ × 0.5 kg/m²  (70 µm için)`}
        </FormulaBlock>

        <WorkedExample title="Örnek — Aynı aşık (P3) için galvaniz katkısı">
          <table className="w-full text-[12.5px] mt-2">
            <tbody className="divide-y divide-slate-100">
              <ExRow label="Açılım × Uzunluk" value="254 mm × 3890 mm" />
              <ExRow label="Yüzey alanı (iki yüz)" value="2 × 254 × 3890 / 10⁶ = 1.976 m²" />
              <ExRow label="Kaplama (70 µm)" value="500 g/m² = 0.5 kg/m²" />
              <ExRow label="Tek parça galvaniz" value="1.976 × 0.5 = 0.988 kg/adet" highlight />
              <ExRow label="Masada 12 adet" value="≈ 11.86 kg galvaniz" />
            </tbody>
          </table>
          <p className="mt-2 text-[12px] text-text3">
            Yani aşık parçaları toplamda <strong className="text-text">~190 kg çelik + ~12 kg
            galvaniz</strong> kütlesi ekler — galvaniz, çelik kütlesinin yaklaşık{' '}
            <strong className="text-text">%6-7'si</strong> kadardır.
          </p>
        </WorkedExample>

        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          <Tip variant="info">
            Galvaniz fiyatı ton başına çelikten daha yüksektir; bu yüzden ayrı bir maliyet kalemi
            olarak <strong>"Maliyet" sekmesinde</strong> birim fiyatını girersiniz.
          </Tip>
          <Tip variant="warning">
            70 µm değeri tipik. Daha agresif korozyon ortamlarında (deniz kıyısı, endüstriyel hava)
            85-100 µm seçilmelidir — kaplama ağırlığı buna bağlı %25 artabilir.
          </Tip>
        </div>
      </ExplainCard>

      {/* TOPLAM ÖZET */}
      <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/8 via-white to-white p-5 sm:p-6 animate-slide-up">
        <div className="flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand text-white shadow-soft shrink-0">
            <Boxes size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-extrabold text-text leading-tight tracking-tight">
              Tek Bir Parçanın Toplam Ağırlığı
            </h3>
            <p className="text-sm text-text2 mt-2 leading-relaxed">
              Yukarıdaki üç hesabı birleştirirsek, her parçanın <strong className="text-text">tek
              masaya katkısı</strong> şudur:
            </p>
            <div className="mt-3 rounded-lg bg-slate-900 text-slate-100 px-4 py-3 font-mono text-[12.5px] leading-relaxed overflow-x-auto">
              <span className="text-slate-400"># Tek parça</span>
              <br />
              <span className="text-emerald-300">unit_weight</span>     = açılım × uzunluk × kalınlık × 7.85e-6
              <br />
              <span className="text-emerald-300">galv_per_unit</span>   = 2 × açılım × uzunluk / 10⁶ × 0.5
              <br />
              <br />
              <span className="text-slate-400"># Tek masada N adet, fire %S</span>
              <br />
              <span className="text-emerald-300">total_steel</span>     = unit_weight × N × (1 + S/100)
              <br />
              <span className="text-emerald-300">total_galv</span>      = galv_per_unit × N × (1 + S/100)
              <br />
              <br />
              <span className="text-slate-400"># Proje toplamı (tüm masalar tüm tipler)</span>
              <br />
              <span className="text-amber-300">GRAND_TOTAL</span>     = Σ((total_steel + total_galv + total_fastener) × tableCount) / 1000  ton
            </div>
            <p className="text-[12.5px] text-text3 mt-3">
              Tüm bu hesaplar uygulama içinde otomatik yapılır — siz sadece <strong className="text-text">profil,
              kalınlık, kenar ölçüleri, uzunluk ve adet</strong> bilgilerini girersiniz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Sub-components for technical section ---------- */

function ExplainCard({
  num,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  num: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-soft animate-slide-up">
      <div className="bg-gradient-to-r from-brand/8 to-white border-b border-slate-200 px-5 py-4 flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand text-white shrink-0 shadow-sm">
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[1.5px] font-bold text-brand">
            FORMÜL {num}
          </div>
          <div className="font-display font-extrabold text-[15px] sm:text-base text-text tracking-tight leading-tight mt-0.5">
            {title}
          </div>
          <div className="text-[12px] text-text2 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="px-5 py-4 text-[13px] text-text leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

function FormulaBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-900 overflow-hidden">
      <div className="bg-slate-800 px-3 py-1.5 border-b border-slate-700 text-[10px] uppercase tracking-wider font-bold text-slate-400">
        {title}
      </div>
      <pre className="px-4 py-3 text-[12.5px] text-emerald-200 font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

function WorkedExample({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-blue/25 bg-blue/5 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-blue mb-1.5 inline-flex items-center gap-1.5">
        <Calculator size={12} />
        ÖRNEK HESAP
      </div>
      <div className="text-[13px] font-semibold text-text">{title}</div>
      {children}
    </div>
  );
}

function ExRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? 'bg-brand/8' : ''}>
      <td className="px-2 py-1 text-text2">{label}</td>
      <td className={`px-2 py-1 text-right font-mono tabular-nums ${highlight ? 'font-bold text-brand' : 'text-text'}`}>
        {value}
      </td>
    </tr>
  );
}

function Tip({ children, variant = 'warning' }: { children: React.ReactNode; variant?: 'info' | 'warning' }) {
  const color = variant === 'info'
    ? { border: 'border-blue/30', bg: 'bg-blue/5', icon: 'text-blue', label: 'text-blue', tag: 'NOT' }
    : { border: 'border-yellow/30', bg: 'bg-yellow/10', icon: 'text-yellow', label: 'text-yellow', tag: 'İPUCU' };

  return (
    <div className={`mt-3 rounded-lg border ${color.border} ${color.bg} px-3 py-2 flex items-start gap-2`}>
      <Lightbulb size={14} className={`${color.icon} shrink-0 mt-0.5`} />
      <span className="text-[12.5px] text-text2 leading-relaxed">
        <strong className={`${color.label} font-bold mr-1`}>{color.tag}:</strong> {children}
      </span>
    </div>
  );
}

function StepCard({ step, first = false }: { step: Step; first?: boolean }) {
  const Icon = step.icon;
  return (
    <details
      className={cn(
        'group/step relative overflow-hidden rounded-xl border border-l-2 bg-card shadow-sm transition-all open:shadow-md',
        first ? 'border-l-primary' : 'border-l-border'
      )}
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:p-5 [&::-webkit-details-marker]:hidden">
        <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-center sm:gap-2">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Icon className="size-5" />
          </div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Adım {step.num}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">{step.title}</h3>
            <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <span className="hidden sm:inline">Detaylar</span>
              <ChevronDown className="size-4 transition-transform group-open/step:rotate-180" />
            </div>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">{step.summary}</p>
        </div>
      </summary>

      <div className="border-t bg-muted/20 p-4 sm:p-5 sm:pl-[88px]">
        <p className="text-[13px] leading-relaxed text-foreground">{step.details.intro}</p>
        {step.details.bullets.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {step.details.bullets.map((b) => (
              <li key={b.label} className="flex items-start gap-2 text-[13px] leading-relaxed text-foreground">
                <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>
                  <strong className="font-semibold">{b.label}:</strong> {b.value}
                </span>
              </li>
            ))}
          </ul>
        )}
        {step.details.tip && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-soft/40 px-3 py-2 text-[12px] leading-relaxed text-primary-soft-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
            <span>{step.details.tip}</span>
          </div>
        )}
      </div>
    </details>
  );
}
