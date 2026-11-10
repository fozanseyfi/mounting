'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Calendar, ArrowRight, Search } from 'lucide-react';
import { DbWarning } from '@/components/layout/DbWarning';
import { mapProject } from '@/lib/projectMapper';
import { Button } from '@/components/ui/button';
import { formatNumber, formatDate } from '@/lib/utils';
import { PROJECT_STATUS } from '@/lib/constants/steel';
import { DeleteProjectButton } from '@/components/projects/DeleteProjectButton';

export function ProjectsView({
  rawProjects,
  dbError = false,
  localMode = false,
}: {
  rawProjects: Parameters<typeof mapProject>[0][];
  dbError?: boolean;
  localMode?: boolean;
}) {
  const all = rawProjects.map(mapProject);
  const [q, setQ] = useState('');
  const needle = q.trim().toLocaleLowerCase('tr');
  const projects = needle
    ? all.filter((p) => [p.name, p.customer, p.location].some((x) => (x || '').toLocaleLowerCase('tr').includes(needle)))
    : all;

  return (
    <>
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <DbWarning show={dbError} local={localMode} />
        {/* Başlık + arama + yeni proje: hepsi en üstte tek satır */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-2xl font-semibold tracking-tight">Projeler</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Toplam {all.length} proje yönetiliyor</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="flex h-9 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 sm:w-72 sm:flex-none">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Proje ara..."
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none"
              />
            </label>
            <Button asChild size="sm" className="h-9">
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Yeni Proje
              </Link>
            </Button>
          </div>
        </div>

        {all.length > 0 && projects.length === 0 ? (
          <p className="rounded-md border bg-white py-10 text-center text-sm text-slate-500">Aramaya uyan proje bulunamadı</p>
        ) : projects.length === 0 ? (
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
                      <Link href={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-primary line-clamp-1" data-no-i18n>
                        {p.name}
                      </Link>
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {p.customer && <p className="text-xs text-slate-500 mb-3" data-no-i18n>{p.customer}{p.location ? ` · ${p.location}` : ''}</p>}

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
                          {formatNumber(p.totals?.totalPowerMW || 0)} <span className="text-[10px] font-normal text-slate-500">MWp</span>
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
