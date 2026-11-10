'use client';

import { formatNumber } from '@/lib/utils';
import type { Project } from '@/types';

/** Özet & Rapor — kurumsal, kompakt: tek KPI şeridi + malzeme ve masa tipi tabloları. */
export function SummaryTab({ project }: { project: Project }) {
  const t = project.totals!;
  const c = project.cost;
  const tonPerMWp = t.totalPowerMW > 0 ? t.grandTotal / t.totalPowerMW : 0;

  const kpis: [string, string][] = [
    ['Toplam Masa', `${formatNumber(t.totalTables, 0)}`],
    ['Masa Tipi', `${project.tableTypes.length}`],
    ['Toplam Panel', formatNumber(t.totalPanels, 0)],
    ['Kurulu Güç', `${formatNumber(t.totalPowerMW)} MWp`],
    ['Toplam Tonaj', `${formatNumber(t.grandTotal)} ton`],
    ['Çelik Yoğunluğu', `${formatNumber(tonPerMWp, 1)} Ton / MWp`],
  ];
  if (c) kpis.push(['Toplam Maliyet', `${formatNumber(c.totalCost, 0)} USD`]);

  const materials: [string, number][] = [
    ['Sac (Çelik)', t.totalSteelWeight],
    ['Galvaniz Kaplama', t.totalGalvanizingWeight],
    ['Bağlantı Elemanları', t.totalFastenerWeight],
  ];

  const th = 'px-3 py-1.5 font-semibold';
  const td = 'px-3 py-1.5 tabular-nums';

  return (
    <div className="space-y-3">
      {/* KPI şeridi */}
      <dl className="grid grid-cols-2 divide-x divide-y rounded-md border bg-white sm:grid-cols-4 sm:divide-y-0 lg:grid-cols-7">
        {kpis.map(([label, value], i) => (
          <div key={label} className={`px-3 py-2 ${i === 4 ? 'bg-slate-50' : ''}`}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className={`mt-0.5 text-sm font-bold tabular-nums ${i === 4 ? 'text-primary-dark' : 'text-slate-900'}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        {/* Malzeme dağılımı */}
        <section className="rounded-md border bg-white">
          <h3 className="border-b px-3 py-1.5 text-xs font-semibold text-slate-700">Malzeme Dağılımı</h3>
          <table className="w-full whitespace-nowrap text-[13px]">
            <thead>
              <tr className="bg-slate-100 text-[11px] text-slate-600">
                <th className={`${th} text-left`}>Kalem</th>
                <th className={`${th} text-right`}>Ton</th>
                <th className={`${th} text-right`}>Pay</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(([label, v]) => {
                const pct = t.grandTotal > 0 ? (v / t.grandTotal) * 100 : 0;
                return (
                  <tr key={label} className="border-t border-slate-100">
                    <td className="px-3 py-1.5 text-slate-800">{label}</td>
                    <td className={`${td} text-right`}>{formatNumber(v)}</td>
                    <td className={`${td} text-right text-slate-500`}>{formatNumber(pct, 1)}%</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-primary-dark">
                <td className="px-3 py-1.5">GRAND TOTAL</td>
                <td className={`${td} text-right`}>{formatNumber(t.grandTotal)}</td>
                <td className={`${td} text-right`}>100%</td>
              </tr>
            </tbody>
          </table>
          {c && (
            <dl className="divide-y border-t text-[13px]">
              <div className="flex justify-between px-3 py-1.5">
                <dt className="text-slate-500">Toplam maliyet</dt>
                <dd className="font-semibold tabular-nums">{formatNumber(c.totalCost, 0)} USD</dd>
              </div>
              <div className="flex justify-between px-3 py-1.5">
                <dt className="text-slate-500">Birim maliyet</dt>
                <dd className="font-semibold tabular-nums">{formatNumber(c.costPerMW, 0)} USD / MWp</dd>
              </div>
            </dl>
          )}
        </section>

        {/* Masa tipi bazlı dağılım */}
        <section className="rounded-md border bg-white">
          <h3 className="border-b px-3 py-1.5 text-xs font-semibold text-slate-700">Masa Tipi Bazlı Dağılım</h3>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-[13px]">
              <thead>
                <tr className="bg-slate-100 text-[11px] text-slate-600">
                  <th className={`${th} text-left`}>Tip</th>
                  <th className={`${th} text-right`}>Masa</th>
                  <th className={`${th} text-right`}>Panel/Masa</th>
                  <th className={`${th} text-right`}>Tek Masa (kg)</th>
                  <th className={`${th} text-right`}>Tonaj (ton)</th>
                  <th className={`${th} text-right`}>MWp</th>
                </tr>
              </thead>
              <tbody>
                {project.tableTypes.map((tt) => {
                  const tot = tt.totals!;
                  return (
                    <tr key={tt.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 font-semibold text-slate-900">{tt.name}</td>
                      <td className={`${td} text-right`}>{tt.tableCount}</td>
                      <td className={`${td} text-right`}>{tt.panelsPerTable}</td>
                      <td className={`${td} text-right`}>{formatNumber(tot.totalWeightPerTable, 1)}</td>
                      <td className={`${td} text-right font-semibold`}>{formatNumber(tot.grandTotal, 2)}</td>
                      <td className={`${td} text-right`}>{formatNumber(tot.totalPowerMW, 2)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-primary-dark">
                  <td className="px-3 py-1.5">TOPLAM</td>
                  <td className={`${td} text-right`}>{t.totalTables}</td>
                  <td className={`${td} text-right`}>—</td>
                  <td className={`${td} text-right`}>—</td>
                  <td className={`${td} text-right`}>{formatNumber(t.grandTotal, 2)}</td>
                  <td className={`${td} text-right`}>{formatNumber(t.totalPowerMW, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
