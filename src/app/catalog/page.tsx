import { prisma, safeQuery, isDbConfigured } from '@/lib/db';
import { CatalogView } from '@/components/views/CatalogView';
import { LocalView } from '@/components/local/LocalView';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  // Veritabanı yoksa projeler tarayıcıda (localStorage) tutulur
  if (!isDbConfigured) return <LocalView kind="catalog" />;

  const { data: customs, dbError } = await safeQuery(() => prisma.customFastenerLibrary.findMany({ orderBy: { createdAt: 'desc' } }), []);
  return <CatalogView customs={customs} dbError={dbError} />;
}
