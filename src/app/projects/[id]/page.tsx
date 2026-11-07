import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Weight, Zap, Boxes, FileText } from 'lucide-react';
import { prisma, safeQuery } from '@/lib/db';
import { DbWarning } from '@/components/layout/DbWarning';
import { mapProject } from '@/lib/projectMapper';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { PROJECT_STATUS } from '@/lib/constants/steel';
import { formatNumber } from '@/lib/utils';
import { ProjectTabs } from '@/components/projects/ProjectTabs';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: raw, dbError } = await safeQuery(() => prisma.project.findUnique({
    where: { id: params.id },
    include: {
      tableTypes: { include: { parts: true, fasteners: true } },
      pricing: true,
    },
  }), null);
  if (!raw) notFound();
  const project = mapProject(raw);
  const status = PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS] || PROJECT_STATUS.DRAFT;
  const t = project.totals;

  return (
    <>
      <TopBar title={project.name} subtitle={project.customer ? `${project.customer}${project.location ? ' · ' + project.location : ''}` : 'Proje Detayı'} />

      <main className="flex-1 p-6 space-y-6">
        <DbWarning show={dbError} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary">
              <ArrowLeft className="w-4 h-4" /> Projelere Dön
            </Link>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color} ml-2`}>
              {status.label}
            </span>
            <span className="ml-3 text-xs text-slate-500">
              Panel gücü: <b className="text-slate-800">{project.panelWattage} Wp</b> · Eğim: <b className="text-slate-800">{project.tiltAngle}°</b>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SnapshotCard label="Masa Tipi" value={`${project.tableTypes.length} tip`} sub={`Toplam ${t?.totalTables || 0} masa`} icon={<Boxes className="w-5 h-5" />} color="kpi-gradient-green" />
          <SnapshotCard label="Toplam Tonaj" value={`${formatNumber(t?.grandTotal || 0)} ton`} sub="Galvaniz + bağlantı dahil" icon={<Weight className="w-5 h-5" />} color="kpi-gradient-blue" />
          <SnapshotCard label="Kurulu Güç" value={`${formatNumber(t?.totalPowerMW || 0)} MW`} sub={`${formatNumber(t?.totalPanels || 0, 0)} panel`} icon={<Zap className="w-5 h-5" />} color="kpi-gradient-orange" />
          <SnapshotCard label="Verimlilik" value={`${formatNumber(t?.kgPerMW || 0, 1)} kg/MW`} sub="Çelik yoğunluğu" icon={<FileText className="w-5 h-5" />} color="kpi-gradient-purple" />
        </div>

        <ProjectTabs project={project} />
      </main>
    </>
  );
}

function SnapshotCard({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center ${color}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 uppercase font-medium">{label}</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums leading-tight truncate">{value}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">{sub}</p>
    </div>
  );
}
