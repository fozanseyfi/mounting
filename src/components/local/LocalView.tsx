'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, FolderX, ArrowLeft } from 'lucide-react';
import {
  listRawProjects,
  getRawProject,
  listCustomFasteners,
  LOCAL_DB_EVENT,
  type RawProject,
  type RawCustomFastener,
} from '@/lib/local-db';
import { DashboardView } from '@/components/views/DashboardView';
import { ProjectsView } from '@/components/views/ProjectsView';
import { ReportsView } from '@/components/views/ReportsView';
import { ProjectDetailView } from '@/components/views/ProjectDetailView';
import { CatalogView } from '@/components/views/CatalogView';
import { ShareLinksClient } from '@/app/share/client';
import { DbWarning } from '@/components/layout/DbWarning';

type Kind = 'dashboard' | 'projects' | 'reports' | 'project' | 'catalog' | 'share';

interface Snapshot {
  projects: RawProject[];
  project: RawProject | null;
  customs: RawCustomFastener[];
}

/**
 * Yerel modda (DATABASE_URL yok) sayfa verisini localStorage'dan okuyup
 * sunucu sayfasının kullandığı aynı görünüm bileşenini render eder.
 */
export function LocalView({ kind, id }: { kind: Kind; id?: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    const load = () =>
      setSnap({
        projects: listRawProjects(),
        project: id ? getRawProject(id) : null,
        customs: listCustomFasteners(),
      });
    load();
    window.addEventListener(LOCAL_DB_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(LOCAL_DB_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, [id]);

  if (!snap) {
    return (
      <main className="flex flex-1 items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </main>
    );
  }

  // Prisma satırıyla aynı şekil; tarihler ISO string olarak tutuluyor.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asRows = (x: unknown) => x as any;

  switch (kind) {
    case 'dashboard':
      return <DashboardView rawProjects={asRows(snap.projects)} localMode />;
    case 'projects':
      return <ProjectsView rawProjects={asRows(snap.projects)} localMode />;
    case 'reports':
      return <ReportsView rawProjects={asRows(snap.projects)} localMode />;
    case 'catalog':
      return <CatalogView customs={asRows(snap.customs)} localMode />;
    case 'share':
      return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <DbWarning show={false} local />
            <ShareLinksClient
              projects={snap.projects.map((p) => ({ id: p.id, name: p.name, customer: p.customer }))}
            />
          </div>
        </main>
      );
    case 'project':
      if (!snap.project) {
        return (
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
              <FolderX className="mx-auto mb-3 size-8 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Proje bulunamadı</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Bu proje bu tarayıcıda kayıtlı değil. Yerel modda projeler sadece oluşturuldukları tarayıcıda görünür.
              </p>
              <Link
                href="/projects"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ArrowLeft className="size-4" /> Projelere Dön
              </Link>
            </div>
          </main>
        );
      }
      return <ProjectDetailView raw={asRows(snap.project)} localMode />;
  }
}
