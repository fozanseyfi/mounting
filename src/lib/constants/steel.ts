// Çelik yoğunluğu ve sabitler
export const STEEL_DENSITY = 7.85; // g/cm³
export const STEEL_DENSITY_KG_PER_MM3 = 7.85e-6; // kg/mm³

// Sıcak daldırma galvaniz — EN ISO 1461.
// 3-6 mm sac için 70 µm tipik kalınlık. 70 µm × 7.14 g/cm³ ≈ 500 g/m² = 0.5 kg/m²
// Daha agresif ortam için 85 µm (0.6 kg/m²) veya 100 µm (0.7 kg/m²) kullanılabilir.
export const GALVANIZING_COATING_MICRON = 70; // µm
export const GALVANIZING_DENSITY = 0.5; // kg/m² @ 70 µm

export const DEFAULT_SPARE_RATIO = 2; // % fire oranı
export const DEFAULT_BEND_K_FACTOR = 0.5;

export const PROJECT_STATUS = {
  DRAFT: { label: 'Taslak', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACTIVE: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ARCHIVED: { label: 'Arşiv', color: 'bg-slate-100 text-slate-700 border-slate-200' },
} as const;
