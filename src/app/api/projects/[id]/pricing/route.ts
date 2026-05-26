import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const NUM = ['steelPricePerKg', 'galvanizingPricePerKg', 'bendLaborPerKg', 'fastenerPricePerKg', 'transportationFlat', 'otherCosts'];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const p = await prisma.pricingConfig.findUnique({ where: { projectId: params.id } });
  return NextResponse.json(p);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {
    currency: body.currency || 'TRY',
    notes: body.notes ?? null,
  };
  for (const k of NUM) data[k] = Number(body[k]) || 0;

  const upserted = await prisma.pricingConfig.upsert({
    where: { projectId: params.id },
    update: data,
    create: { projectId: params.id, ...(data as any) },
  });
  return NextResponse.json(upserted);
}
