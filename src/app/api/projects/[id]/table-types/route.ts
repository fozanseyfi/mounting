import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapTableType } from '@/lib/projectMapper';
import { STANDARD_PARTS } from '@/lib/constants/standard-parts';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { panelWattage: true } });
  if (!project) return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });

  const count = await prisma.tableType.count({ where: { projectId: params.id } });
  const tt = await prisma.tableType.create({
    data: {
      projectId: params.id,
      name: body.name || `Tip-${count + 1}`,
      description: body.description || null,
      panelsPerTable: parseInt(body.panelsPerTable) || 28,
      tableCount: parseInt(body.tableCount) || 1,
      order: count,
    },
  });

  // Auto-create 7 standard placeholder parts (only on creation; not when updating)
  await prisma.sehpaPart.createMany({
    data: STANDARD_PARTS.map((sp, i) => ({
      tableTypeId: tt.id,
      code: sp.code,
      name: sp.name,
      profileType: 'C',
      thickness: 0,
      edgesJson: '[]',
      bendCount: 0,
      bendAllowance: 0,
      developedWidth: 0,
      length: 0,
      quantityPerTable: 0,
      spareRatio: 2,
      unitWeight: 0,
      totalWeightPerTable: 0,
      surfaceArea: 0,
      galvanizingWeight: 0,
      order: i,
    })),
  });

  // Re-fetch with parts and fasteners so the response is complete
  const fresh = await prisma.tableType.findUnique({
    where: { id: tt.id },
    include: { parts: true, fasteners: true },
  });
  return NextResponse.json(mapTableType(fresh!, project.panelWattage), { status: 201 });
}
