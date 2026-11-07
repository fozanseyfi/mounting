import { prisma, safeQuery, isDbConfigured } from '@/lib/db';
import { DbWarning } from '@/components/layout/DbWarning';
import { LocalView } from '@/components/local/LocalView';
import { ShareLinksClient } from './client';

export const dynamic = 'force-dynamic';

export default async function SharePage() {
  if (!isDbConfigured) return <LocalView kind="share" />;

  const { data: projects, dbError } = await safeQuery(
    () =>
      prisma.project.findMany({
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, customer: true },
      }),
    []
  );

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <DbWarning show={dbError} />
        <ShareLinksClient projects={projects} />
      </div>
    </main>
  );
}
