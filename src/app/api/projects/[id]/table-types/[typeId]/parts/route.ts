import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculatePart } from '@/lib/calculations/profiles';
import { mapSehpaPart } from '@/lib/projectMapper';
import type { ProfileType } from '@/types';

export async function POST(req: NextRequest, { params }: { params: { id: string; typeId: string } }) {
  const body = await req.json();
  const edges: number[] = Array.isArray(body.edges) ? body.edges.map((n: unknown) => Number(n) || 0) : [];
  const profileType = (body.profileType as ProfileType) || 'C';
  const thickness = Number(body.thickness) || 0;
  const length = Number(body.length) || 0;
  const quantityPerTable = parseInt(body.quantityPerTable) || 1;
  const spareRatio = Number(body.spareRatio) || 0;

  const calc = calculatePart({
    profileType,
    thickness,
    edges,
    length,
    quantityPerTable,
    spareRatio,
    bendAllowance: body.bendAllowance !== undefined ? Number(body.bendAllowance) : undefined,
  });

  const count = await prisma.sehpaPart.count({ where: { tableTypeId: params.typeId } });
  const part = await prisma.sehpaPart.create({
    data: {
      tableTypeId: params.typeId,
      code: body.code || `P${count + 1}`,
      name: body.name || 'Parça',
      profileType,
      thickness,
      edgesJson: JSON.stringify(edges),
      bendCount: calc.bendCount,
      bendAllowance: calc.bendAllowance,
      developedWidth: calc.developedWidth,
      length,
      quantityPerTable,
      spareRatio,
      unitWeight: calc.unitWeight,
      totalWeightPerTable: calc.totalWeightPerTable,
      surfaceArea: calc.surfaceArea,
      galvanizingWeight: calc.galvanizingWeight,
      order: count,
    },
  });

  return NextResponse.json(mapSehpaPart(part), { status: 201 });
}
