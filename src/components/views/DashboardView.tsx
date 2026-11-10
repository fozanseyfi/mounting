import Link from 'next/link';
import { Plus, FolderOpen } from 'lucide-react';
import { DbWarning } from '@/components/layout/DbWarning';
import { mapProject } from '@/lib/projectMapper';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { DashboardProjectsTable } from '@/components/dashboard/DashboardProjectsTable';

/** Dashboard — Fizibilite platformundaki gibi sade: başlık + tek satırlık proje listesi (Rapor / Excel). */
export function DashboardView({
  rawProjects,
  dbError = false,
  localMode = false,
}: {
  rawProjects: Parameters<typeof mapProject>[0][];
  dbError?: boolean;
  localMode?: boolean;
}) {
  const projects = rawProjects.map(mapProject);
  const tonnage = projects.reduce((s, p) => s + (p.totals?.grandTotal || 0), 0);
  const mw = projects.reduce((s, p) => s + (p.totals?.totalPowerMW || 0), 0);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <DbWarning show={dbError} local={localMode} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {projects.length > 0 ? (
                <>
                  {projects.length} proje kayıtlı · <span className="tabular-nums">{formatNumber(tonnage)} ton</span> ·{' '}
                  <span className="tabular-nums">{formatNumber(mw)} MWp</span>
                </>
              ) : (
                'Henüz proje yok'
              )}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/projects/new">
              <Plus className="h-4 w-4" /> Yeni Proje
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border bg-card py-14 text-center">
            <FolderOpen className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">İlk konstrüksiyon projenizi oluşturun.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/projects/new">
                <Plus className="h-4 w-4" /> Yeni Proje
              </Link>
            </Button>
          </div>
        ) : (
          <DashboardProjectsTable projects={projects} />
        )}
      </div>
    </main>
  );
}
