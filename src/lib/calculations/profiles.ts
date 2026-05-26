import { ProfileType, PROFILE_TYPES } from '@/types';
import { STEEL_DENSITY_KG_PER_MM3, GALVANIZING_DENSITY, DEFAULT_BEND_K_FACTOR } from '@/lib/constants/steel';

export interface ProfileCalcInput {
  profileType: ProfileType;
  thickness: number;
  edges: number[];
  length: number;
  quantityPerTable: number;
  spareRatio: number;
  bendAllowance?: number;
}

export interface ProfileCalcResult {
  bendCount: number;
  bendAllowance: number;
  developedWidth: number;
  unitWeight: number;
  totalWeightPerTable: number;
  surfaceArea: number;
  galvanizingWeight: number;
}

export function getBendCount(profileType: ProfileType, edgesCount: number): number {
  const profile = PROFILE_TYPES.find((p) => p.value === profileType);
  if (profileType === 'CUSTOM') return Math.max(0, edgesCount - 1);
  return profile?.bendCount ?? 0;
}

export function getDefaultBendAllowance(thickness: number): number {
  return thickness * DEFAULT_BEND_K_FACTOR;
}

export function calculateDevelopedWidth(input: { edges: number[]; bendCount: number; thickness: number; bendAllowance: number }): number {
  const { edges, bendCount, thickness, bendAllowance } = input;
  const edgesSum = edges.reduce((sum, e) => sum + (e || 0), 0);
  // Pratik yaklaşım: developed = sum(edges) - bendCount × (2×t - bendAllowance)
  // Bu, dış yüzey ölçülerini iç açılıma çevirir
  const correction = bendCount * (2 * thickness - bendAllowance);
  return Math.max(0, edgesSum - correction);
}

export function calculateUnitWeight(developedWidth: number, length: number, thickness: number): number {
  // kg = mm × mm × mm × kg/mm³
  return developedWidth * length * thickness * STEEL_DENSITY_KG_PER_MM3;
}

export function calculateSurfaceArea(developedWidth: number, length: number): number {
  // m² — iki yüz dahil
  return (2 * developedWidth * length) / 1_000_000;
}

export function calculateGalvanizing(surfaceArea: number): number {
  return surfaceArea * GALVANIZING_DENSITY;
}

export function calculatePart(input: ProfileCalcInput): ProfileCalcResult {
  const { profileType, thickness, edges, length, quantityPerTable, spareRatio } = input;
  const bendCount = getBendCount(profileType, edges.length);
  const bendAllowance = input.bendAllowance ?? getDefaultBendAllowance(thickness);
  const developedWidth = calculateDevelopedWidth({ edges, bendCount, thickness, bendAllowance });
  const unitWeight = calculateUnitWeight(developedWidth, length, thickness);
  const surfaceArea = calculateSurfaceArea(developedWidth, length);
  const galvanizingPerUnit = calculateGalvanizing(surfaceArea);
  const spareMultiplier = 1 + (spareRatio || 0) / 100;
  const totalWeightPerTable = unitWeight * quantityPerTable * spareMultiplier;
  const galvanizingWeight = galvanizingPerUnit * quantityPerTable * spareMultiplier;

  return {
    bendCount,
    bendAllowance,
    developedWidth,
    unitWeight,
    totalWeightPerTable,
    surfaceArea,
    galvanizingWeight,
  };
}
