export interface CatalogEntry {
  code: string;
  detail: string;
  size: string;
  length?: string;
  grade: string;
  weight: number; // kg/adet
}

export const DIN_CATALOG: CatalogEntry[] = [
  // DIN933 — Altıköşe Cıvata Tam Diş (8.8 Kalite)
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M8', length: '20mm', grade: '8.8', weight: 0.0089 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M8', length: '25mm', grade: '8.8', weight: 0.0102 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M10', length: '25mm', grade: '8.8', weight: 0.0260 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M10', length: '30mm', grade: '8.8', weight: 0.0300 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M10', length: '40mm', grade: '8.8', weight: 0.0364 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M12', length: '30mm', grade: '8.8', weight: 0.0470 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M12', length: '40mm', grade: '8.8', weight: 0.0570 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M14', length: '30mm', grade: '8.8', weight: 0.0648 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M14', length: '40mm', grade: '8.8', weight: 0.0780 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M16', length: '40mm', grade: '8.8', weight: 0.1100 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M16', length: '50mm', grade: '8.8', weight: 0.1290 },

  // DIN934 — Altıköşe Somun
  { code: 'DIN934', detail: 'Altıköşe Somun', size: 'M8', grade: '8.8', weight: 0.0050 },
  { code: 'DIN934', detail: 'Altıköşe Somun', size: 'M10', grade: '8.8', weight: 0.0135 },
  { code: 'DIN934', detail: 'Altıköşe Somun', size: 'M12', grade: '8.8', weight: 0.0210 },
  { code: 'DIN934', detail: 'Altıköşe Somun', size: 'M14', grade: '8.8', weight: 0.0280 },
  { code: 'DIN934', detail: 'Altıköşe Somun', size: 'M16', grade: '8.8', weight: 0.0400 },

  // DIN127 — Yaylı Rondela
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M8', grade: '8.8', weight: 0.0015 },
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M10', grade: '8.8', weight: 0.0028 },
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M12', grade: '8.8', weight: 0.0045 },
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M14', grade: '8.8', weight: 0.0067 },
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M16', grade: '8.8', weight: 0.0095 },

  // DIN125A — Düz Rondela
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M8', grade: '8.8', weight: 0.0030 },
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M10', grade: '8.8', weight: 0.0050 },
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M12', grade: '8.8', weight: 0.0080 },
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M14', grade: '8.8', weight: 0.0104 },
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M16', grade: '8.8', weight: 0.0150 },

  // DIN912 — İmbus Cıvata (Inox)
  { code: 'DIN912', detail: 'İmbus Cıvata', size: 'M8', length: '25mm', grade: 'A2-70 İnox', weight: 0.0180 },
  { code: 'DIN912', detail: 'İmbus Cıvata', size: 'M8', length: '45mm', grade: 'A2-70 İnox', weight: 0.0256 },
  { code: 'DIN912', detail: 'İmbus Cıvata', size: 'M10', length: '30mm', grade: 'A2-70 İnox', weight: 0.0290 },

  // Klempler (Solar panel)
  { code: 'KOSELI-KENAR', detail: 'Köşeli Kenar Klemp', size: '30mm', length: '60mm', grade: 'T6 6063 Alüminyum', weight: 0.0533 },
  { code: 'KOSELI-ORTA', detail: 'Köşeli Orta Klemp', size: '-', length: '60mm', grade: 'T6 6063 Alüminyum', weight: 0.0533 },

  // Ray İçi Somun
  { code: 'RAY-SOMUN', detail: 'Ray İçi Somun', size: '25mm', length: '50mm', grade: 'A2-70 İnox', weight: 0.0392 },
];

export function getCatalogKey(entry: { code: string; size: string; length?: string | null; grade: string }): string {
  return `${entry.code}|${entry.size}|${entry.length || ''}|${entry.grade}`;
}

export function findCatalogEntry(code: string, size: string, length?: string | null, grade?: string): CatalogEntry | undefined {
  return DIN_CATALOG.find(
    (e) =>
      e.code === code &&
      e.size === size &&
      (length ? e.length === length : true) &&
      (grade ? e.grade === grade : true)
  );
}
