import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DbWarning } from '@/components/layout/DbWarning';
import { mapProject } from '@/lib/projectMapper';
import { PROJECT_STATUS } from '@/lib/constants/steel';
import { formatNumber } from '@/lib/utils';
import { ProjectTabs } from '@/components/projects/ProjectTabs';

export function ProjectDetailView({
  raw,
  dbError = false,
  localMode = false,
}: {
  raw: Parameters<typeof mapProject>[0] | null;
  dbError?: boolean;
  localMode?: boolean;
}) {
  if (!raw) notFound();
  const project = mapProject(raw);
  const status = PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS] || PROJECT_STATUS.DRAFT;
  const t = project.totals;
  const meta = [project.customer, project.location].filter(Boolean).join(' · ');

  return (
    <main className="flex-1 space-y-3 p-3 sm:p-4 lg:px-6 lg:py-4">
      <DbWarning show={dbError} local={localMode} />

      {/* Kompakt başlık: üstte geri + ad + özellikler, altta eşit dağılmış KPI şeridi */}
      <div className="rounded-md border bg-card">
        <div className="flex min-w-0 items-center gap-2 px-3 py-2">
          <Link
            href="/projects"
            title="Projelere Dön"
            aria-label="Projelere Dön"
            className="flex size-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="truncate text-base font-bold leading-tight text-slate-900" data-no-i18n>
            {project.name}
          </h1>
          <span className={`shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold ${status.color}`}>{status.label}</span>
          <p className="ml-1 hidden truncate text-xs text-muted-foreground sm:block">
            {meta && <span data-no-i18n>{meta} · </span>}
            {project.panelWattage} Wp · {project.tiltAngle}°
          </p>
        </div>
        <dl className="grid grid-cols-3 divide-x border-t md:grid-cols-6">
          <Kpi label="Masa Tipi" value={String(project.tableTypes.length)} />
          <Kpi label="Toplam Masa" value={formatNumber(t?.totalTables || 0, 0)} />
          <Kpi label="Toplam Panel" value={formatNumber(t?.totalPanels || 0, 0)} />
          <Kpi label="Kurulu Güç" value={`${formatNumber(t?.totalPowerMW || 0)} MWp`} />
          <Kpi label="Toplam Tonaj" value={`${formatNumber(t?.grandTotal || 0)} ton`} strong />
          <Kpi label="Çelik Yoğunluğu" value={`${formatNumber(t && t.totalPowerMW > 0 ? t.grandTotal / t.totalPowerMW : 0, 1)} Ton / MWp`} />
        </dl>
      </div>

      <ProjectTabs project={project} />
    </main>
  );
}

function Kpi({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="px-3 py-1.5 leading-tight max-md:[&:nth-child(n+4)]:border-t">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`text-sm tabular-nums ${strong ? 'font-bold text-primary-dark' : 'font-semibold text-slate-800'}`}>{value}</dd>
    </div>
  );
}
