import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mapProject } from '@/lib/projectMapper';

const INCLUDE = {
  tableTypes: { include: { parts: true, fasteners: true } },
  pricing: true,
} as const;

export async function GET() {
  const projects = await prisma.project.findMany({
    include: INCLUDE,
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(projects.map(mapProject));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      customer: body.customer || null,
      location: body.location || null,
      description: body.description || null,
      panelWattage: Number(body.panelWattage) || 580,
      tiltAngle: Number(body.tiltAngle) || 25,
      status: body.status || 'DRAFT',
    },
    include: INCLUDE,
  });
  return NextResponse.json(mapProject(project), { status: 201 });
}
