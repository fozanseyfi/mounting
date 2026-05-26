export type ProfileType = 'C' | 'C_LIP' | 'U' | 'Z' | 'L' | 'SIGMA' | 'OMEGA' | 'I' | 'H' | 'CUSTOM';

export const PROFILE_TYPES: { value: ProfileType; label: string; edgeCount: number; bendCount: number }[] = [
  { value: 'C', label: 'C Profil', edgeCount: 3, bendCount: 2 },
  { value: 'C_LIP', label: 'C Profil (Lipli — Uç Bükümlü)', edgeCount: 5, bendCount: 4 },
  { value: 'U', label: 'U Profil', edgeCount: 3, bendCount: 2 },
  { value: 'Z', label: 'Z Profil', edgeCount: 3, bendCount: 2 },
  { value: 'L', label: 'L Profil', edgeCount: 2, bendCount: 1 },
  { value: 'SIGMA', label: 'Σ Sigma Profil', edgeCount: 7, bendCount: 6 },
  { value: 'OMEGA', label: 'Ω Omega Profil', edgeCount: 5, bendCount: 4 },
  { value: 'I', label: 'I Profil (IPE)', edgeCount: 3, bendCount: 0 },
  { value: 'H', label: 'H Profil (HEA/HEB)', edgeCount: 3, bendCount: 0 },
  { value: 'CUSTOM', label: 'Özel Profil', edgeCount: 0, bendCount: 0 },
];

export interface SehpaPart {
  id: string;
  code: string;
  name: string;
  profileType: ProfileType;
  thickness: number;
  edges: number[];
  bendCount: number;
  bendAllowance: number;
  developedWidth: number;
  length: number;
  quantityPerTable: number;
  spareRatio: number;
  unitWeight: number;
  totalWeightPerTable: number;
  surfaceArea: number;
  galvanizingWeight: number;
  order?: number;
}

export interface Fastener {
  id: string;
  universalCode: string;
  detail: string;
  size: string;
  length?: string | null;
  grade: string;
  unitWeight: number;
  quantityPerTable: number;
  spareRatio: number;
  totalWeightPerTable: number;
  source: 'CATALOG' | 'MANUAL';
  order?: number;
}

export interface TableType {
  id: string;
  projectId?: string;
  name: string;             // "Tip-1", "Tip-2"
  description?: string | null;
  panelsPerTable: number;
  tableCount: number;
  order?: number;
  parts: SehpaPart[];
  fasteners: Fastener[];
  totals?: TableTypeTotals;
}

export interface TableTypeTotals {
  steelWeightPerTable: number;       // kg (per single table of this type)
  galvanizingWeightPerTable: number; // kg
  fastenerWeightPerTable: number;    // kg
  totalWeightPerTable: number;       // kg

  totalSteelWeight: number;          // ton (across all tables of this type)
  totalGalvanizingWeight: number;    // ton
  totalFastenerWeight: number;       // ton
  grandTotal: number;                // ton

  totalPanels: number;
  totalPowerMW: number;
}

export interface PricingConfig {
  steelPricePerKg: number;
  galvanizingPricePerKg: number;
  bendLaborPerKg: number;
  fastenerPricePerKg: number;
  transportationFlat: number;
  otherCosts: number;
  currency: string;
  notes?: string | null;
}

export interface CostBreakdown {
  steelCost: number;
  galvanizingCost: number;
  bendLaborCost: number;
  fastenerCost: number;
  transportationCost: number;
  otherCosts: number;
  totalCost: number;
  costPerMW: number;
  costPerTon: number;
}

export interface ProjectTotals {
  steelWeightPerTable_avg: number;       // not used directly, kept for compatibility
  galvanizingWeightPerTable_avg: number;
  fastenerWeightPerTable_avg: number;
  totalWeightPerTable_avg: number;

  totalSteelWeight: number;          // ton (sum across all tables of all types)
  totalGalvanizingWeight: number;    // ton
  totalFastenerWeight: number;       // ton
  grandTotal: number;                // ton

  totalTables: number;
  totalPanels: number;
  totalPowerMW: number;
  kgPerMW: number;
}

export interface Project {
  id: string;
  name: string;
  customer?: string | null;
  location?: string | null;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  status: string;

  panelWattage: number;
  tiltAngle: number;

  tableTypes: TableType[];
  pricing?: PricingConfig | null;

  totals?: ProjectTotals;
  cost?: CostBreakdown;
}
