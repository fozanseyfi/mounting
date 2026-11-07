import { prisma, safeQuery, isDbConfigured } from '@/lib/db';
import { ProjectDetailView } from '@/components/views/ProjectDetailView';
import { LocalView } from '@/components/local/LocalView';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  // Veritabanı yoksa projeler tarayıcıda (localStorage) tutulur
  if (!isDbConfigured) return <LocalView kind="project" id={params.id} />;

  const { data: raw, dbError } = await safeQuery(() => prisma.project.findUnique({
    where: { id: params.id },
    include: {
      tableTypes: { include: { parts: true, fasteners: true } },
      pricing: true,
    },
  }), null);
  return <ProjectDetailView raw={raw} dbError={dbError} />;
}
