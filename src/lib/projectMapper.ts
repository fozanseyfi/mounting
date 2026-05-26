import type {
  Project as PrismaProject,
  TableType as PrismaTableType,
  SehpaPart as PrismaSehpaPart,
  Fastener as PrismaFastener,
  PricingConfig as PrismaPricing,
} from '@prisma/client';
import type { Project, TableType, SehpaPart, Fastener, ProfileType, PricingConfig } from '@/types';
import { calculateTableTypeTotals, calculateProjectTotals, calculateCost } from '@/lib/calculations/totals';

type PrismaTableTypeWithRelations = PrismaTableType & {
  parts: PrismaSehpaPart[];
  fasteners: PrismaFastener[];
};

type PrismaProjectWithRelations = PrismaProject & {
  tableTypes: PrismaTableTypeWithRelations[];
  pricing: PrismaPricing | null;
};

export function mapSehpaPart(p: PrismaSehpaPart): SehpaPart {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    profileType: p.profileType as ProfileType,
    thickness: p.thickness,
    edges: safeJsonParse(p.edgesJson, []),
    bendCount: p.bendCount,
    bendAllowance: p.bendAllowance,
    developedWidth: p.developedWidth,
    length: p.length,
    quantityPerTable: p.quantityPerTable,
    spareRatio: p.spareRatio,
    unitWeight: p.unitWeight,
    totalWeightPerTable: p.totalWeightPerTable,
    surfaceArea: p.surfaceArea,
    galvanizingWeight: p.galvanizingWeight,
    order: p.order,
  };
}

export function mapFastener(f: PrismaFastener): Fastener {
  return {
    id: f.id,
    universalCode: f.universalCode,
    detail: f.detail,
    size: f.size,
    length: f.length,
    grade: f.grade,
    unitWeight: f.unitWeight,
    quantityPerTable: f.quantityPerTable,
    spareRatio: f.spareRatio,
    totalWeightPerTable: f.totalWeightPerTable,
    source: f.source as 'CATALOG' | 'MANUAL',
    order: f.order,
  };
}

export function mapTableType(tt: PrismaTableTypeWithRelations, panelWattage: number): TableType {
  const parts = tt.parts.map(mapSehpaPart).sort((a, b) => (a.order || 0) - (b.order || 0));
  const fasteners = tt.fasteners.map(mapFastener).sort((a, b) => (a.order || 0) - (b.order || 0));
  const totals = calculateTableTypeTotals(parts, fasteners, {
    tableCount: tt.tableCount,
    panelsPerTable: tt.panelsPerTable,
    panelWattage,
  });
  return {
    id: tt.id,
    projectId: tt.projectId,
    name: tt.name,
    description: tt.description,
    panelsPerTable: tt.panelsPerTable,
    tableCount: tt.tableCount,
    order: tt.order,
    parts,
    fasteners,
    totals,
  };
}

export function mapPricing(p: PrismaPricing | null | undefined): PricingConfig | null {
  if (!p) return null;
  return {
    steelPricePerKg: p.steelPricePerKg,
    galvanizingPricePerKg: p.galvanizingPricePerKg,
    bendLaborPerKg: p.bendLaborPerKg,
    fastenerPricePerKg: p.fastenerPricePerKg,
    transportationFlat: p.transportationFlat,
    otherCosts: p.otherCosts,
    currency: p.currency,
    notes: p.notes,
  };
}

export function mapProject(p: PrismaProjectWithRelations): Project {
  const tableTypes = p.tableTypes
    .map((tt) => mapTableType(tt, p.panelWattage))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const totals = calculateProjectTotals(tableTypes, p.panelWattage);
  const pricing = mapPricing(p.pricing);
  const cost = pricing ? calculateCost(totals, pricing) : undefined;
  return {
    id: p.id,
    name: p.name,
    customer: p.customer,
    location: p.location,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    status: p.status,
    panelWattage: p.panelWattage,
    tiltAngle: p.tiltAngle,
    tableTypes,
    pricing,
    totals,
    cost,
  };
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
