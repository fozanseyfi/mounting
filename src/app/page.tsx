import { prisma, safeQuery, isDbConfigured } from '@/lib/db';
import { DashboardView } from '@/components/views/DashboardView';
import { LocalView } from '@/components/local/LocalView';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Veritabanı yoksa projeler tarayıcıda (localStorage) tutulur
  if (!isDbConfigured) return <LocalView kind="dashboard" />;

  const { data: rawProjects, dbError } = await safeQuery(() => prisma.project.findMany({
    include: {
      tableTypes: { include: { parts: true, fasteners: true } },
      pricing: true,
    },
    orderBy: { updatedAt: 'desc' },
  }), []);
  return <DashboardView rawProjects={rawProjects} dbError={dbError} />;
}
