import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapTableType } from '@/lib/projectMapper';

export async function PUT(req: NextRequest, { params }: { params: { id: string; typeId: string } }) {
  const body = await req.json();
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { panelWattage: true } });
  if (!project) return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.panelsPerTable !== undefined) data.panelsPerTable = parseInt(body.panelsPerTable) || 0;
  if (body.tableCount !== undefined) data.tableCount = parseInt(body.tableCount) || 0;

  const tt = await prisma.tableType.update({
    where: { id: params.typeId },
    data,
    include: { parts: true, fasteners: true },
  });
  return NextResponse.json(mapTableType(tt, project.panelWattage));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; typeId: string } }) {
  await prisma.tableType.delete({ where: { id: params.typeId } });
  return NextResponse.json({ ok: true });
}
