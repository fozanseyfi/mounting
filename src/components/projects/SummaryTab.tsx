'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import type { Project } from '@/types';
import { MaterialBreakdownChart } from '@/components/dashboard/DashboardCharts';
import { useToast } from '@/components/ui/toast';
import { downloadExcel } from '@/lib/export/excel';
import { downloadPDF } from '@/lib/export/pdf';

const CUR_SYM = (c?: string) => (c === 'USD' ? '$' : c === 'EUR' ? '€' : '₺');

export function SummaryTab({ project }: { project: Project }) {
  const [busy, setBusy] = useState<'excel' | 'pdf' | null>(null);
  const { toast } = useToast();

  const t = project.totals!;
  const c = project.cost;
  const sym = CUR_SYM(project.pricing?.currency);

  const pieData = [
    { name: 'Sac (Çelik)', value: t.totalSteelWeight },
    { name: 'Galvaniz', value: t.totalGalvanizingWeight },
    { name: 'Bağlantı', value: t.totalFastenerWeight },
  ];

  async function handleExcel() {
    setBusy('excel');
    try { await downloadExcel(project); toast('Excel raporu indirildi', 'success'); }
    catch { toast('Excel oluşturulamadı', 'error'); }
    setBusy(null);
  }

  async function handlePDF() {
    setBusy('pdf');
    try { await downloadPDF(project); toast('PDF raporu indirildi', 'success'); }
    catch { toast('PDF oluşturulamadı', 'error'); }
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      {/* Top: KPI band */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KPIBlock label="Toplam Masa" value={`${formatNumber(t.totalTables, 0)} adet`} note={`${project.tableTypes.length} farklı tip`} />
        <KPIBlock label="Toplam Tonaj" value={`${formatNumber(t.grandTotal)} ton`} note="Galvaniz + bağlantı dahil" />
        <KPIBlock label="Kurulu Güç" value={`${formatNumber(t.totalPowerMW)} MW`} note={`${formatNumber(t.totalPanels, 0)} panel`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Proje Toplamları</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BigKPI label="Toplam Çelik (Sac)" value={`${formatNumber(t.totalSteelWeight)} ton`} color="bg-emerald-50 text-emerald-700 border-emerald-200" />
            <BigKPI label="Toplam Galvaniz" value={`${formatNumber(t.totalGalvanizingWeight)} ton`} color="bg-amber-50 text-amber-700 border-amber-200" />
            <BigKPI label="Toplam Bağlantı Elemanı" value={`${formatNumber(t.totalFastenerWeight)} ton`} color="bg-blue-50 text-blue-700 border-blue-200" />
            <BigKPI label="GRAND TOTAL" value={`${formatNumber(t.grandTotal)} ton`} color="bg-primary text-white border-primary-dark" highlight />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
            <SmallStat label="Toplam Panel" value={formatNumber(t.totalPanels, 0)} />
            <SmallStat label="Toplam Güç" value={`${formatNumber(t.totalPowerMW)} MW`} />
            <SmallStat label="kg / MW" value={formatNumber(t.kgPerMW, 1)} />
          </div>

          {c && (
            <div className="mt-4 pt-4 border-t border-slate-100 bg-primary-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
              <p className="text-xs uppercase font-semibold text-primary-dark">Toplam Maliyet</p>
              <p className="text-2xl font-bold text-primary-dark tabular-nums mt-1">{formatNumber(c.totalCost, 0)} {sym}</p>
              <div className="flex gap-4 text-xs mt-2 text-slate-600">
                <span>{formatNumber(c.costPerMW, 0)} {sym}/MW</span>
                <span>·</span>
                <span>{formatNumber(c.costPerTon, 0)} {sym}/ton</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Malzeme Dağılımı</h3>
          <MaterialBreakdownChart data={pieData} />
        </div>
      </div>

      {/* Per-table-type breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Masa Tipi Bazlı Dağılım
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-600 uppercase">
                <th className="text-left px-3 py-2">Tip</th>
                <th className="text-right px-3 py-2">Adet</th>
                <th className="text-right px-3 py-2">Panel/Masa</th>
                <th className="text-right px-3 py-2">Tek Masa (kg)</th>
                <th className="text-right px-3 py-2">Toplam Tonaj</th>
                <th className="text-right px-3 py-2">MW</th>
              </tr>
            </thead>
            <tbody>
              {project.tableTypes.map((tt) => {
                const tot = tt.totals!;
                return (
                  <tr key={tt.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">{tt.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{tt.tableCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{tt.panelsPerTable}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatNumber(tot.totalWeightPerTable, 1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-primary-dark">{formatNumber(tot.grandTotal, 2)} ton</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatNumber(tot.totalPowerMW, 2)}</td>
                  </tr>
                );
              })}
              <tr className="bg-primary-50 border-t-2 border-primary/30">
                <td className="px-3 py-3 font-bold text-primary-dark">TOPLAM</td>
                <td className="px-3 py-3 text-right tabular-nums font-bold">{t.totalTables}</td>
                <td className="px-3 py-3 text-right tabular-nums">—</td>
                <td className="px-3 py-3 text-right tabular-nums">—</td>
                <td className="px-3 py-3 text-right tabular-nums font-bold text-primary-dark">{formatNumber(t.grandTotal, 2)} ton</td>
                <td className="px-3 py-3 text-right tabular-nums font-bold">{formatNumber(t.totalPowerMW, 2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Rapor Çıktıları</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tüm masa tipleri ve maliyet kalemleri raporda yer alır</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExcel} disabled={busy !== null}>
              {busy === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel (.xlsx)
            </Button>
            <Button onClick={handlePDF} disabled={busy !== null}>
              {busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              PDF Rapor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIBlock({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <p className="text-xs uppercase font-semibold text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{note}</p>
    </div>
  );
}

function BigKPI({ label, value, color, highlight }: { label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${color} ${highlight ? 'shadow-md' : ''}`}>
      <p className={`text-xs font-semibold uppercase ${highlight ? 'text-white/80' : ''}`}>{label}</p>
      <p className={`${highlight ? 'text-3xl' : 'text-xl'} font-bold mt-1 tabular-nums`}>{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-bold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}
