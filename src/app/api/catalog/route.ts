import { NextResponse } from 'next/server';
import { DIN_CATALOG } from '@/lib/constants/din-catalog';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET() {
  const customs = await prisma.customFastenerLibrary.findMany({ orderBy: { createdAt: 'desc' } });
  const customMapped = customs.map((c) => ({
    code: c.universalCode,
    detail: c.detail,
    size: c.size,
    length: c.length || undefined,
    grade: c.grade,
    weight: c.unitWeight,
    custom: true,
  }));
  return NextResponse.json({
    catalog: DIN_CATALOG.map((c) => ({ ...c, custom: false })),
    custom: customMapped,
  });
}
