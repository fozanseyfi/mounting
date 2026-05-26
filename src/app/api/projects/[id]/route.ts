import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapProject } from '@/lib/projectMapper';

const INCLUDE = {
  tableTypes: { include: { parts: true, fasteners: true } },
  pricing: true,
} as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: INCLUDE,
  });
  if (!project) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json(mapProject(project));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  const fields = ['name', 'customer', 'location', 'description', 'status'];
  const numFields = ['panelWattage', 'tiltAngle'];
  for (const f of fields) if (body[f] !== undefined) data[f] = body[f];
  for (const f of numFields) if (body[f] !== undefined) data[f] = Number(body[f]);
  const project = await prisma.project.update({
    where: { id: params.id },
    data,
    include: INCLUDE,
  });
  return NextResponse.json(mapProject(project));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
