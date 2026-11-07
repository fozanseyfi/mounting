import Link from 'next/link';
import { FileBarChart, FileSpreadsheet, FileText, ArrowRight } from 'lucide-react';
import { DbWarning } from '@/components/layout/DbWarning';
import { mapProject } from '@/lib/projectMapper';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { formatNumber, formatDate } from '@/lib/utils';

export function ReportsView({
  rawProjects,
  dbError = false,
  localMode = false,
}: {
  rawProjects: Parameters<typeof mapProject>[0][];
  dbError?: boolean;
  localMode?: boolean;
}) {
  const projects = rawProjects.map(mapProject);

  const totalTonnage = projects.reduce((s, p) => s + (p.totals?.grandTotal || 0), 0);
  const totalMW = projects.reduce((s, p) => s + (p.totals?.totalPowerMW || 0), 0);

  return (
    <>
      <TopBar title="Raporlar" subtitle="Tüm projelerin rapor çıktıları" />
      <main className="flex-1 p-6 space-y-6">
        <DbWarning show={dbError} local={localMode} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat icon={FileBarChart} label="Toplam Proje" value={String(projects.length)} />
          <Stat icon={FileSpreadsheet} label="Toplam Tonaj" value={`${formatNumber(totalTonnage)} ton`} />
          <Stat icon={FileText} label="Kurulu Güç" value={`${formatNumber(totalMW)} MW`} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Proje Raporları</h3>
            <p className="text-xs text-slate-500 mt-0.5">Proje detayına gidip Excel veya PDF indirebilirsiniz</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-600 uppercase">
                <th className="text-left px-6 py-3">Proje</th>
                <th className="text-left px-6 py-3">Müşteri</th>
                <th className="text-right px-6 py-3">Tonaj</th>
                <th className="text-right px-6 py-3">Güç (MW)</th>
                <th className="text-left px-6 py-3">Güncellendi</th>
                <th className="text-right px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">Henüz proje yok</td>
                </tr>
              )}
              {projects.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link href={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-primary">{p.name}</Link>
                    {p.location && <p className="text-xs text-slate-500 mt-0.5">{p.location}</p>}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{p.customer || '—'}</td>
                  <td className="px-6 py-3 text-right text-sm font-semibold tabular-nums">{formatNumber(p.totals?.grandTotal || 0)} ton</td>
                  <td className="px-6 py-3 text-right text-sm tabular-nums">{formatNumber(p.totals?.totalPowerMW || 0)}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">{formatDate(p.updatedAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <Button asChild size="sm" variant="soft">
                      <Link href={`/projects/${p.id}`}>Rapor Al <ArrowRight className="w-3.5 h-3.5" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center text-white">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs uppercase font-semibold text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}
