import Link from 'next/link';
import { Plus, FolderKanban, Calendar, ArrowRight, Search, Filter } from 'lucide-react';
import { prisma } from '@/lib/db';
import { mapProject } from '@/lib/projectMapper';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { formatNumber, formatDate } from '@/lib/utils';
import { PROJECT_STATUS } from '@/lib/constants/steel';
import { DeleteProjectButton } from '@/components/projects/DeleteProjectButton';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const rawProjects = await prisma.project.findMany({
    include: { tableTypes: { include: { parts: true, fasteners: true } }, pricing: true },
    orderBy: { updatedAt: 'desc' },
  });
  const projects = rawProjects.map(mapProject);

  return (
    <>
      <TopBar title="Projeler" subtitle={`Toplam ${projects.length} proje yönetiliyor`} />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input placeholder="Proje ara..." className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="default">
              <Filter className="w-4 h-4" />
              Filtre
            </Button>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="w-4 h-4" />
                Yeni Proje
              </Link>
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-9 h-9 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Henüz proje yok</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Yeni bir Solar GES konstrüksiyon projesi oluşturarak başlayın. Parçaları, bağlantı
              elemanlarını ekleyin ve toplam tonajı otomatik hesaplayın.
            </p>
            <Button asChild className="mt-6">
              <Link href="/projects/new">
                <Plus className="w-4 h-4" />
                İlk Projeyi Oluştur
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const status = PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS] || PROJECT_STATUS.DRAFT;
              return (
                <div
                  key={p.id}
                  className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden flex flex-col"
                >
                  <div className="hero-gradient h-2 group-hover:h-3 transition-all" />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link href={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-primary line-clamp-1">
                        {p.name}
                      </Link>
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {p.customer && <p className="text-xs text-slate-500 mb-3">{p.customer}{p.location ? ` · ${p.location}` : ''}</p>}

                    <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 uppercase font-medium">Tonaj</p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                          {formatNumber(p.totals?.grandTotal || 0)} <span className="text-[10px] font-normal text-slate-500">ton</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 uppercase font-medium">Güç</p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                          {formatNumber(p.totals?.totalPowerMW || 0)} <span className="text-[10px] font-normal text-slate-500">MW</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 uppercase font-medium">Masa</p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">{p.totals?.totalTables || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-auto pt-3 border-t border-slate-100">
                      <Calendar className="w-3 h-3" />
                      {formatDate(p.updatedAt)}
                    </div>

                    <div className="flex items-center gap-2 mt-3 -mb-1">
                      <Button asChild size="sm" variant="soft" className="flex-1">
                        <Link href={`/projects/${p.id}`}>
                          Aç <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <DeleteProjectButton id={p.id} name={p.name} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
