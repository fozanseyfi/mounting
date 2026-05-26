import { SehpaPart, Fastener, TableType, TableTypeTotals, ProjectTotals, PricingConfig, CostBreakdown } from '@/types';

export function calculateFastenerTotal(fastener: Pick<Fastener, 'unitWeight' | 'quantityPerTable' | 'spareRatio'>): number {
  return fastener.unitWeight * fastener.quantityPerTable * (1 + (fastener.spareRatio || 0) / 100);
}

/** Per-type totals (single-table weight, plus all-tables totals & MW for this type) */
export function calculateTableTypeTotals(
  parts: SehpaPart[],
  fasteners: Fastener[],
  meta: { tableCount: number; panelsPerTable: number; panelWattage: number }
): TableTypeTotals {
  const steelWeightPerTable = parts.reduce((sum, p) => sum + (p.totalWeightPerTable || 0), 0);
  const galvanizingWeightPerTable = parts.reduce((sum, p) => sum + (p.galvanizingWeight || 0), 0);
  const fastenerWeightPerTable = fasteners.reduce((sum, f) => sum + (f.totalWeightPerTable || 0), 0);
  const totalWeightPerTable = steelWeightPerTable + galvanizingWeightPerTable + fastenerWeightPerTable;

  const tableCount = meta.tableCount || 0;
  const totalSteelWeight = (steelWeightPerTable * tableCount) / 1000;
  const totalGalvanizingWeight = (galvanizingWeightPerTable * tableCount) / 1000;
  const totalFastenerWeight = (fastenerWeightPerTable * tableCount) / 1000;
  const grandTotal = (totalWeightPerTable * tableCount) / 1000;

  const totalPanels = (meta.panelsPerTable || 0) * tableCount;
  const totalPowerMW = (totalPanels * (meta.panelWattage || 0)) / 1_000_000;

  return {
    steelWeightPerTable,
    galvanizingWeightPerTable,
    fastenerWeightPerTable,
    totalWeightPerTable,
    totalSteelWeight,
    totalGalvanizingWeight,
    totalFastenerWeight,
    grandTotal,
    totalPanels,
    totalPowerMW,
  };
}

/** Project-wide totals: sum across all table types */
export function calculateProjectTotals(
  tableTypes: TableType[],
  panelWattage: number
): ProjectTotals {
  let totalSteel = 0;
  let totalGalv = 0;
  let totalFast = 0;
  let grand = 0;
  let totalTables = 0;
  let totalPanels = 0;
  let weightedSteelPerTable = 0;
  let weightedGalvPerTable = 0;
  let weightedFastPerTable = 0;

  for (const tt of tableTypes) {
    const t = tt.totals;
    if (!t) continue;
    totalSteel += t.totalSteelWeight;
    totalGalv += t.totalGalvanizingWeight;
    totalFast += t.totalFastenerWeight;
    grand += t.grandTotal;
    totalTables += tt.tableCount;
    totalPanels += t.totalPanels;
    weightedSteelPerTable += t.steelWeightPerTable * tt.tableCount;
    weightedGalvPerTable += t.galvanizingWeightPerTable * tt.tableCount;
    weightedFastPerTable += t.fastenerWeightPerTable * tt.tableCount;
  }

  const avgSteelPerTable = totalTables > 0 ? weightedSteelPerTable / totalTables : 0;
  const avgGalvPerTable = totalTables > 0 ? weightedGalvPerTable / totalTables : 0;
  const avgFastPerTable = totalTables > 0 ? weightedFastPerTable / totalTables : 0;

  const totalPowerMW = (totalPanels * (panelWattage || 0)) / 1_000_000;
  const kgPerMW = totalPowerMW > 0 ? (grand * 1000) / totalPowerMW : 0;

  return {
    steelWeightPerTable_avg: avgSteelPerTable,
    galvanizingWeightPerTable_avg: avgGalvPerTable,
    fastenerWeightPerTable_avg: avgFastPerTable,
    totalWeightPerTable_avg: avgSteelPerTable + avgGalvPerTable + avgFastPerTable,
    totalSteelWeight: totalSteel,
    totalGalvanizingWeight: totalGalv,
    totalFastenerWeight: totalFast,
    grandTotal: grand,
    totalTables,
    totalPanels,
    totalPowerMW,
    kgPerMW,
  };
}

/** Cost breakdown given totals and pricing config */
export function calculateCost(totals: ProjectTotals, pricing: PricingConfig): CostBreakdown {
  // totals weights are in TON — convert to kg for multiplication with TL/kg
  const steelKg = totals.totalSteelWeight * 1000;
  const galvKg = totals.totalGalvanizingWeight * 1000;
  const fastKg = totals.totalFastenerWeight * 1000;
  const totalKg = totals.grandTotal * 1000;

  const steelCost = steelKg * (pricing.steelPricePerKg || 0);
  const galvanizingCost = galvKg * (pricing.galvanizingPricePerKg || 0);
  // bend/labor cost is calculated on STEEL kg (sheet metal) — not galvanizing or fasteners
  const bendLaborCost = steelKg * (pricing.bendLaborPerKg || 0);
  const fastenerCost = fastKg * (pricing.fastenerPricePerKg || 0);
  const transportationCost = pricing.transportationFlat || 0;
  const otherCosts = pricing.otherCosts || 0;

  const totalCost = steelCost + galvanizingCost + bendLaborCost + fastenerCost + transportationCost + otherCosts;

  const costPerMW = totals.totalPowerMW > 0 ? totalCost / totals.totalPowerMW : 0;
  const costPerTon = totals.grandTotal > 0 ? totalCost / totals.grandTotal : 0;

  return {
    steelCost,
    galvanizingCost,
    bendLaborCost,
    fastenerCost,
    transportationCost,
    otherCosts,
    totalCost,
    costPerMW,
    costPerTon,
  };
}
