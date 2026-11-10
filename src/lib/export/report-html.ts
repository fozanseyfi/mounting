/**
 * Kurumsal PDF raporu (Fizibilite platformu ile aynı şablon).
 * HTML olarak üretilir, tarayıcının yazdır → "PDF olarak kaydet" çıktısıyla alınır;
 * böylece Türkçe karakterler ve tipografi bozulmaz. Stiller: src/styles/report.css (#bom-report).
 */
import type { Project, TableType } from '@/types';
import { PROFILE_TYPES } from '@/types';
import { formatNumber } from '@/lib/utils';
import { numLocale } from '@/lib/i18n';

export interface ReportMeta {
  preparedBy?: string;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const n = (v: number, d = 2) => formatNumber(v || 0, d);
const usd = (v: number, d = 0) => `${formatNumber(v || 0, d)} USD`;
const pct = (v: number, total: number) => (total > 0 ? `${formatNumber((v / total) * 100, 1)}%` : '—');
const profileLabel = (t: string) => (PROFILE_TYPES.find((p) => p.value === t)?.label || t).replace(/ — [^)]*\)/, ')');

const h2 = (no: string, title: string) => `<h2><span class="rn">${no}</span>${title}</h2>`;

const table = (head: string[], rows: string[][], opts: { total?: string[]; left?: number } = {}) => {
  const left = opts.left ?? 1;
  const cell = (tag: 'th' | 'td', c: string, i: number) => `<${tag}${i < left ? ' class="l"' : ''}>${c}</${tag}>`;
  return (
    `<table><thead><tr>${head.map((h, i) => cell('th', h, i)).join('')}</tr></thead><tbody>` +
    rows.map((r) => `<tr>${r.map((c, i) => cell('td', c, i)).join('')}</tr>`).join('') +
    (opts.total ? `<tr class="tot">${opts.total.map((c, i) => cell('td', c, i)).join('')}</tr>` : '') +
    `</tbody></table>`
  );
};

const kpis = (items: [string, string][]) =>
  `<div class="r-kpis">${items.map(([l, v]) => `<div class="r-kpi"><div class="l">${l}</div><div class="v">${v}</div></div>`).join('')}</div>`;

function typeSection(no: string, tt: TableType): string {
  const t = tt.totals!;
  const parts = tt.parts;
  const fas = tt.fasteners;
  const partsKg = parts.reduce((s, p) => s + p.totalWeightPerTable, 0);
  const galvKg = parts.reduce((s, p) => s + p.galvanizingWeight, 0);
  const fasKg = fas.reduce((s, f) => s + f.totalWeightPerTable, 0);

  return (
    `<div class="r-type">` +
    h2(no, `${esc(tt.name)} — Malzeme Listesi (BOM)`) +
    `<div class="r-line">${[
      tt.description ? esc(tt.description) : '',
      `${tt.tableCount} masa`,
      `${tt.panelsPerTable} panel/masa`,
      `${n(t.totalPowerMW)} MWp`,
      `Tek masa ${n(t.totalWeightPerTable)} kg`,
      `Toplam ${n(t.grandTotal)} ton`,
    ]
      .filter(Boolean)
      .join(' · ')}</div>` +
    `<div class="r-cap">Sehpa parçaları (tek masa)</div>` +
    (parts.length
      ? table(
          ['Kod', 'Parça', 'Profil', 't (mm)', 'Kenarlar (mm)', 'Açılım (mm)', 'Uzunluk (mm)', 'Adet', 'Fire %', 'Birim (kg)', 'Toplam (kg)', 'Galv. (kg)'],
          parts.map((p) => [
            esc(p.code),
            esc(p.name),
            esc(profileLabel(p.profileType)),
            n(p.thickness, 1),
            esc(p.edges.join('-')),
            n(p.developedWidth, 1),
            n(p.length, 0),
            String(p.quantityPerTable),
            n(p.spareRatio, 1),
            n(p.unitWeight, 3),
            n(p.totalWeightPerTable, 2),
            n(p.galvanizingWeight, 2),
          ]),
          { left: 3, total: ['Tek masa toplam', '', '', '', '', '', '', '', '', '', n(partsKg), n(galvKg)] }
        )
      : `<div class="tsub">Parça girilmemiş.</div>`) +
    `<div class="r-cap">Bağlantı elemanları (tek masa)</div>` +
    (fas.length
      ? table(
          ['Kod', 'Detay', 'Ölçü', 'Uzunluk', 'Kalite', 'Birim (kg)', 'Adet', 'Fire %', 'Toplam (kg)'],
          fas.map((f) => [
            esc(f.universalCode),
            esc(f.detail),
            esc(f.size),
            esc(f.length || '—'),
            esc(f.grade),
            n(f.unitWeight, 4),
            String(f.quantityPerTable),
            n(f.spareRatio, 1),
            n(f.totalWeightPerTable, 3),
          ]),
          { left: 2, total: ['Tek masa toplam', '', '', '', '', '', '', '', n(fasKg, 3)] }
        )
      : `<div class="tsub">Bağlantı elemanı girilmemiş.</div>`) +
    `</div>`
  );
}

export function buildBomReportHtml(project: Project, meta: ReportMeta = {}): string {
  const t = project.totals!;
  const c = project.cost && project.cost.totalCost > 0 ? project.cost : null;
  const pr = project.pricing;
  const date = new Date().toLocaleDateString(numLocale(), { day: 'numeric', month: 'long', year: 'numeric' });
  const tonPerMWp = t.totalPowerMW > 0 ? t.grandTotal / t.totalPowerMW : 0;

  // ---------- Kapak ----------
  const facts: [string, string][] = [
    ...(project.customer ? ([['Müşteri', project.customer]] as [string, string][]) : []),
    ...(project.location ? ([['Lokasyon', project.location]] as [string, string][]) : []),
    ['Tarih', date],
    ...(meta.preparedBy ? ([['Hazırlayan', meta.preparedBy]] as [string, string][]) : []),
    ['Panel gücü', `${project.panelWattage} Wp`],
    ['Eğim', `${project.tiltAngle}°`],
  ];
  const stats: [string, string][] = [
    ['Kurulu güç', `${n(t.totalPowerMW)} MWp`],
    ['Toplam tonaj', `${n(t.grandTotal)} ton`],
    ['Çelik yoğunluğu', `${n(tonPerMWp, 1)} Ton / MWp`],
    ['Toplam maliyet', c ? usd(c.totalCost) : '—'],
    ['Birim maliyet', c ? `${n(c.costPerMW, 0)} USD / MWp` : '—'],
  ];
  const cover =
    `<div class="r-cover"><div class="r-eyebrow">Solar BOM · Konstrüksiyon tonaj ve maliyet raporu</div>` +
    `<h1>${esc(project.name)}</h1>` +
    `<div class="r-sub">Solar GES sehpa konstrüksiyonu — malzeme listesi (BOM), tonaj ve maliyet özeti</div>` +
    `<div class="r-facts">${facts.map(([k, v]) => `<div class="r-fact"><b>${k}</b><span>${esc(v)}</span></div>`).join('')}</div>` +
    `<div class="r-stats">${stats.map(([k, v]) => `<div class="r-stat"><div class="l">${k}</div><div class="v">${v}</div></div>`).join('')}</div></div>`;

  // ---------- 1. Özet ----------
  const summary =
    h2('01', 'Proje Özeti') +
    kpis([
      ['Masa tipi', String(project.tableTypes.length)],
      ['Toplam masa', n(t.totalTables, 0)],
      ['Toplam panel', n(t.totalPanels, 0)],
      ['Kurulu güç', `${n(t.totalPowerMW)} MWp`],
    ]) +
    `<div class="r-verdict">Proje ${n(t.totalPowerMW)} MWp kurulu güç için toplam ${n(t.grandTotal)} ton çelik konstrüksiyon gerektiriyor ` +
    `(${n(tonPerMWp, 1)} Ton / MWp; galvaniz ve bağlantı elemanları dahil)` +
    (c ? `. Toplam maliyet ${usd(c.totalCost)}, birim maliyet ${n(c.costPerMW, 0)} USD / MWp.` : '.') +
    `</div>`;

  // ---------- 2. Malzeme dağılımı ----------
  const materials =
    h2('02', 'Malzeme Dağılımı') +
    table(
      ['Kalem', 'Miktar (ton)', 'Pay'],
      [
        ['Sac (çelik)', n(t.totalSteelWeight), pct(t.totalSteelWeight, t.grandTotal)],
        ['Galvaniz kaplama', n(t.totalGalvanizingWeight), pct(t.totalGalvanizingWeight, t.grandTotal)],
        ['Bağlantı elemanları', n(t.totalFastenerWeight), pct(t.totalFastenerWeight, t.grandTotal)],
      ],
      { total: ['Genel toplam', n(t.grandTotal), '100%'] }
    );

  // ---------- 3. Masa tipleri ----------
  const types =
    h2('03', 'Masa Tipleri') +
    table(
      ['Tip', 'Açıklama', 'Masa', 'Panel/masa', 'Güç (MWp)', 'Tek masa (kg)', 'Tonaj (ton)', 'Pay'],
      project.tableTypes.map((tt) => [
        esc(tt.name),
        esc(tt.description || '—'),
        String(tt.tableCount),
        String(tt.panelsPerTable),
        n(tt.totals!.totalPowerMW),
        n(tt.totals!.totalWeightPerTable, 1),
        n(tt.totals!.grandTotal),
        pct(tt.totals!.grandTotal, t.grandTotal),
      ]),
      { left: 2, total: ['Toplam', '', String(t.totalTables), '', n(t.totalPowerMW), '', n(t.grandTotal), '100%'] }
    );

  // ---------- 4. Maliyet ----------
  const cost = c
    ? h2('04', 'Maliyet Analizi') +
      table(
        ['Kalem', 'Birim fiyat', 'Miktar', 'Tutar', 'Pay'],
        [
          ['Çelik sac', `${n(pr?.steelPricePerKg || 0)} USD / kg`, `${n(t.totalSteelWeight * 1000, 0)} kg`, usd(c.steelCost), pct(c.steelCost, c.totalCost)],
          ['Galvaniz kaplama', `${n(pr?.galvanizingPricePerKg || 0)} USD / kg`, `${n(t.totalGalvanizingWeight * 1000, 0)} kg`, usd(c.galvanizingCost), pct(c.galvanizingCost, c.totalCost)],
          ['Büküm + işçilik', `${n(pr?.bendLaborPerKg || 0)} USD / kg`, `${n(t.totalSteelWeight * 1000, 0)} kg`, usd(c.bendLaborCost), pct(c.bendLaborCost, c.totalCost)],
          ['Bağlantı elemanları', `${n(pr?.fastenerPricePerKg || 0)} USD / kg`, `${n(t.totalFastenerWeight * 1000, 1)} kg`, usd(c.fastenerCost), pct(c.fastenerCost, c.totalCost)],
          ['Nakliye', 'Sabit', '—', usd(c.transportationCost), pct(c.transportationCost, c.totalCost)],
          ['Diğer giderler', 'Sabit', '—', usd(c.otherCosts), pct(c.otherCosts, c.totalCost)],
        ],
        { total: ['Toplam maliyet', '', '', usd(c.totalCost), '100%'] }
      ) +
      kpis([
        ['Toplam maliyet', usd(c.totalCost)],
        ['Birim maliyet', `${n(c.costPerMW, 0)} USD / MWp`],
        ['Ton başına maliyet', `${n(c.costPerTon, 0)} USD / ton`],
        ['Çelik yoğunluğu', `${n(tonPerMWp, 1)} Ton / MWp`],
      ]) +
      (pr?.notes ? `<div class="r-note">${esc(pr.notes)}</div>` : '')
    : '';

  // ---------- 5. Tip bazlı BOM ----------
  const bomNo = c ? '05' : '04';
  const bom =
    `<div class="pagebreak"></div>` +
    project.tableTypes.map((tt, i) => typeSection(`${bomNo}.${i + 1}`, tt)).join('');

  // ---------- Notlar ----------
  const notesNo = c ? '06' : '05';
  const notes =
    h2(notesNo, 'Hesap Esasları ve Notlar') +
    `<div class="r-note">` +
    `Sac açılımı = Σ kenarlar − büküm sayısı × (2 × kalınlık − büküm payı). ` +
    `Birim ağırlık = açılım × uzunluk × kalınlık × 7,85 g/cm³. ` +
    `Galvaniz = 2 × açılım × uzunluk × kaplama ağırlığı (sıcak daldırma, EN ISO 1461). ` +
    `Masa toplamı = Σ (birim ağırlık × adet × (1 + fire / 100)); proje toplamı = Σ (masa toplamı × masa adedi). ` +
    `Değerler kullanıcının girdiği ölçü ve birim fiyatlara dayanır; statik hesap veya imalat onayı yerine geçmez. ` +
    `İmalat öncesinde güncel ağırlık ve fiyatların üreticiden teyit edilmesi önerilir.` +
    `</div>`;

  const foot = `<div class="r-foot"><span><b>Solar BOM</b> · Konstrüksiyon tonaj tahmini — statik hesap yerine geçmez</span><span>${esc(date)}</span></div>`;

  return cover + summary + materials + types + cost + bom + notes + foot;
}
