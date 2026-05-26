import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateFastenerTotal } from '@/lib/calculations/totals';
import { mapFastener } from '@/lib/projectMapper';

export async function POST(req: NextRequest, { params }: { params: { id: string; typeId: string } }) {
  const body = await req.json();
  const unitWeight = Number(body.unitWeight) || 0;
  const quantityPerTable = parseInt(body.quantityPerTable) || 1;
  const spareRatio = Number(body.spareRatio) || 0;
  const totalWeightPerTable = calculateFastenerTotal({ unitWeight, quantityPerTable, spareRatio });

  const count = await prisma.fastener.count({ where: { tableTypeId: params.typeId } });
  const fastener = await prisma.fastener.create({
    data: {
      tableTypeId: params.typeId,
      universalCode: body.universalCode || '',
      detail: body.detail || '',
      size: body.size || '',
      length: body.length || null,
      grade: body.grade || '',
      unitWeight,
      quantityPerTable,
      spareRatio,
      totalWeightPerTable,
      source: body.source === 'MANUAL' ? 'MANUAL' : 'CATALOG',
      order: count,
    },
  });

  if (body.saveToLibrary && body.source === 'MANUAL') {
    try {
      await prisma.customFastenerLibrary.create({
        data: {
          universalCode: body.universalCode || '',
          detail: body.detail || '',
          size: body.size || '',
          length: body.length || null,
          grade: body.grade || '',
          unitWeight,
        },
      });
    } catch {
      // ignore dup
    }
  }

  return NextResponse.json(mapFastener(fastener), { status: 201 });
}
