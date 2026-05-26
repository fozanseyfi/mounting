import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateFastenerTotal } from '@/lib/calculations/totals';
import { mapFastener } from '@/lib/projectMapper';

export async function PUT(req: NextRequest, { params }: { params: { id: string; typeId: string; fastenerId: string } }) {
  const body = await req.json();
  const unitWeight = Number(body.unitWeight) || 0;
  const quantityPerTable = parseInt(body.quantityPerTable) || 1;
  const spareRatio = Number(body.spareRatio) || 0;
  const totalWeightPerTable = calculateFastenerTotal({ unitWeight, quantityPerTable, spareRatio });

  const fastener = await prisma.fastener.update({
    where: { id: params.fastenerId },
    data: {
      universalCode: body.universalCode,
      detail: body.detail,
      size: body.size,
      length: body.length || null,
      grade: body.grade,
      unitWeight,
      quantityPerTable,
      spareRatio,
      totalWeightPerTable,
      source: body.source === 'MANUAL' ? 'MANUAL' : 'CATALOG',
    },
  });
  return NextResponse.json(mapFastener(fastener));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; typeId: string; fastenerId: string } }) {
  await prisma.fastener.delete({ where: { id: params.fastenerId } });
  return NextResponse.json({ ok: true });
}
