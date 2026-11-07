import { prisma, safeQuery, isDbConfigured } from '@/lib/db';
import { ReportsView } from '@/components/views/ReportsView';
import { LocalView } from '@/components/local/LocalView';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  // Veritabanı yoksa projeler tarayıcıda (localStorage) tutulur
  if (!isDbConfigured) return <LocalView kind="reports" />;

  const { data: rawProjects, dbError } = await safeQuery(() => prisma.project.findMany({
    include: { tableTypes: { include: { parts: true, fasteners: true } }, pricing: true },
    orderBy: { updatedAt: 'desc' },
  }), []);
  return <ReportsView rawProjects={rawProjects} dbError={dbError} />;
}
