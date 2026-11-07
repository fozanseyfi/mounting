import { prisma, safeQuery, isDbConfigured } from '@/lib/db';
import { ProjectsView } from '@/components/views/ProjectsView';
import { LocalView } from '@/components/local/LocalView';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  // Veritabanı yoksa projeler tarayıcıda (localStorage) tutulur
  if (!isDbConfigured) return <LocalView kind="projects" />;

  const { data: rawProjects, dbError } = await safeQuery(() => prisma.project.findMany({
    include: { tableTypes: { include: { parts: true, fasteners: true } }, pricing: true },
    orderBy: { updatedAt: 'desc' },
  }), []);
  return <ProjectsView rawProjects={rawProjects} dbError={dbError} />;
}
