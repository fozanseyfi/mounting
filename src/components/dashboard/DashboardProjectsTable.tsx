'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import type { Project } from '@/types';
import { formatNumber, formatDate } from '@/lib/utils';
import { PROJECT_STATUS } from '@/lib/constants/steel';
import { useToast } from '@/components/ui/toast';

/** Dashboard proje listesi: her proje tek satır, satırda Rapor Al (PDF) ve Excel Al. */
export function DashboardProjectsTable({ projects }: { projects: Project[] }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(p: Project, kind: 'pdf' | 'xlsx') {
    setBusy(`${p.id}:${kind}`);
    try {
      if (kind === 'pdf') {
        const { downloadPDF } = await import('@/lib/export/pdf');
        await downloadPDF(p);
        toast('PDF raporu indirildi', 'success');
      } else {
        const { downloadExcel } = await import('@/lib/export/excel');
        await downloadExcel(p);
        toast('Excel raporu indirildi', 'success');
      }
    } catch {
      toast(kind === 'pdf' ? 'PDF oluşturulamadı' : 'Excel oluşturulamadı', 'error');
    } finally {
      setBusy(null);
    }
  }

  const btn =
    'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:opacity-50';

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-semibold">Projeler</h2>
        <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          Tümünü gör <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-left text-xs text-muted-foreground">
              <th className="px-5 py-2.5 font-medium">Proje</th>
              <th className="px-3 py-2.5 font-medium">Durum</th>
              <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Kurulu Güç</th>
              <th className="px-3 py-2.5 text-right font-medium">Tonaj</th>
              <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">kg/MW</th>
              <th className="hidden px-3 py-2.5 text-right font-medium lg:table-cell">Güncellendi</th>
              <th className="px-5 py-2.5 text-right font-medium">Rapor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.map((p) => {
              const t = p.totals;
              const st = PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS] || PROJECT_STATUS.DRAFT;
              const ready = (t?.grandTotal || 0) > 0;
              return (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-2.5">
                    <Link href={`/projects/${p.id}`} className="font-medium text-foreground hover:underline" data-no-i18n>
                      {p.name}
                    </Link>
                    {(p.customer || p.location) && (
                      <p className="mt-0.5 text-xs text-muted-foreground" data-no-i18n>
                        {[p.customer, p.location].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[11px] font-semibold ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 text-right tabular-nums md:table-cell">{formatNumber(t?.totalPowerMW || 0)} MW</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatNumber(t?.grandTotal || 0)} t</td>
                  <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">{formatNumber(t?.kgPerMW || 0, 0)}</td>
                  <td className="hidden px-3 py-2.5 text-right text-xs text-muted-foreground lg:table-cell">{formatDate(p.updatedAt)}</td>
                  <td className="px-5 py-2 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        className={`${btn} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}
                        disabled={!ready || busy !== null}
                        title={ready ? 'PDF rapor indir' : 'Önce masa tipi ve parça girin'}
                        onClick={() => run(p, 'pdf')}
                      >
                        {busy === `${p.id}:pdf` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                        Rapor Al
                      </button>
                      <button
                        type="button"
                        className={`${btn} border-border bg-card text-foreground hover:bg-secondary`}
                        disabled={!ready || busy !== null}
                        title={ready ? 'Excel indir' : 'Önce masa tipi ve parça girin'}
                        onClick={() => run(p, 'xlsx')}
                      >
                        {busy === `${p.id}:xlsx` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                        Excel Al
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
