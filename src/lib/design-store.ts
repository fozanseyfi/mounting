'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type AnchorHeight = 'top' | 'upper' | 'middle' | 'lower' | 'bottom';
export type ColumnSide = 'front' | 'back';
export type ElementType = 'beam' | 'purlin' | 'diagonal' | 'strut';

export type MountType = 'drilled' | 'driven' | 'formwork' | 'continuous';

export interface DesignColumn {
  id: string;
  side: ColumnSide;
  index: number;
  height: number;            // mm — ABOVE GROUND görünür kolon yüksekliği
  /** 0..3 → 0°/90°/180°/270° rotasyonun kolonun ekseni etrafında (kesitin nereye baktığı) */
  rotation?: number;
}

/** Bir elemanın iki uç noktasından her biri — ya bir kolonun noktası ya da bir elemanın noktası */
export type MountPoint =
  | { kind: 'column'; columnId: string; anchor: AnchorHeight }
  | { kind: 'element'; elementId: string; position: number /* 0..1 boyunca */ };

export interface DesignElement {
  id: string;
  type: ElementType;
  start: MountPoint;
  end: MountPoint;
  /** Eleman ekseninde A-B orta noktasından kayma (mm). 0 = orta. + → uç B'ye doğru. (Sol/sağ çıkıntı) */
  offset: number;
  /** Dünya Y eksenine göre dikey kayma (mm). + → yukarı, - → aşağı. (Yukarı/aşağı çıkıntı) */
  verticalOffset?: number;
  /** 0..3 → 0°/90°/180°/270° kesit rotasyonu */
  rotation?: number;
  /** Bağlı parça koduna ipucu (P3/P4/...) — sadece görüntülemeye yarar */
  partCode?: string;
}

export interface DesignLayoutConfig {
  frontColumnCount: number;
  frontSpacing: number;
  frontToBackDistance: number;
  frontColumnHeight: number;        // mm, yer üstü görünür yükseklik
  backColumnHeight: number;         // mm, yer üstü görünür yükseklik

  // ---- Montaj tipi ----
  mountType: MountType;             // drilled | driven | formwork

  // Drilled (delgi beton): silindir delik + şeffaf beton
  drillDiameter?: number;           // mm
  drillDepth?: number;              // mm (zemin altı derinlik)

  // Driven (çakma): zemine çakılmış kolon, beton yok
  drivenDepth?: number;             // mm (zemin altına gömülü kısım)

  // Formwork (mezar/kalıp beton): dikdörtgen beton kütle
  formworkWidth?: number;           // mm
  formworkDepth?: number;           // mm (en + boy)
  formworkBelowGround?: number;     // mm (zemin altı kısım)
  formworkAboveGround?: number;     // mm (zemin üstü kısım, kolon bunun üstünde başlar)

  // Continuous (sürekli sömel): tüm kolon sırasının altında uzun beton kütle
  continuousWidth?: number;          // mm (ön-arka yön)
  continuousDepth?: number;          // mm (sıra ekseni boyu — yan tarafta taşar)
  continuousBelowGround?: number;    // mm
  continuousAboveGround?: number;    // mm

  /** Kolon kesit rotasyonu — ön/arka aynı (0..3) */
  frontRotation?: number;
  backRotation?: number;
}

export interface TableDesign {
  layout: DesignLayoutConfig | null;
  columns: DesignColumn[];
  elements: DesignElement[];
}

export const ELEMENT_LABELS: Record<ElementType, string> = {
  beam: 'Kiriş',
  purlin: 'Aşık',
  diagonal: 'Çapraz',
  strut: 'Payanda',
};

export const ELEMENT_PART_CODES: Record<ElementType, string> = {
  beam: 'P3',
  purlin: 'P4',
  diagonal: 'P5',
  strut: 'P6',
};

export const ANCHOR_NAMES: Record<AnchorHeight, string> = {
  top: 'Üst',
  upper: 'Üst-Orta',
  middle: 'Orta',
  lower: 'Alt-Orta',
  bottom: 'Alt',
};

export function anchorRatio(a: AnchorHeight): number {
  return ({ bottom: 0, lower: 0.25, middle: 0.5, upper: 0.75, top: 1 } as const)[a];
}

export function mountPointKey(mp: MountPoint): string {
  return mp.kind === 'column'
    ? `col:${mp.columnId}:${mp.anchor}`
    : `el:${mp.elementId}:${mp.position.toFixed(2)}`;
}

export function mountPointsEqual(a: MountPoint, b: MountPoint): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'column' && b.kind === 'column') return a.columnId === b.columnId && a.anchor === b.anchor;
  if (a.kind === 'element' && b.kind === 'element')
    return a.elementId === b.elementId && Math.abs(a.position - b.position) < 0.001;
  return false;
}

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

export interface AutoGenerateOptions {
  beams: boolean;
  purlinCount: number;
  purlinSplice: 'continuous' | 'per-bay';
  crossPattern: 'none' | 'X' | 'V';
  knees: boolean;
}

/** Element için ihtiyaç duyulan minimum parça verisi (length validation için) */
export interface PartLite {
  code: string;
  length: number; // mm
}

export interface AutoGenerateResult {
  added: number;
  skipped: number;
  skippedReason: string[];
}

interface DesignStore {
  designs: Record<string, TableDesign>;
  applyLayout: (id: string, layout: DesignLayoutConfig) => void;
  addElement: (id: string, el: Omit<DesignElement, 'id'>) => string;
  updateElement: (id: string, elementId: string, patch: Partial<DesignElement>) => void;
  updateAllOfType: (id: string, type: ElementType, patch: Partial<Pick<DesignElement, 'rotation' | 'offset' | 'verticalOffset'>>) => void;
  removeElement: (id: string, elementId: string) => void;
  autoGenerate: (id: string, opts: AutoGenerateOptions, parts: PartLite[]) => AutoGenerateResult;
  reset: (id: string) => void;
}

const AUTO_PREFIX = 'AUTO_';

export const useDesignStore = create<DesignStore>()(
  persist(
    (set) => ({
      designs: {},
      applyLayout: (id, layout) =>
        set((s) => {
          const cols: DesignColumn[] = [];
          const fRot = layout.frontRotation ?? 0;
          const bRot = layout.backRotation ?? 0;
          for (let i = 0; i < layout.frontColumnCount; i++) {
            cols.push({ id: `front-${i}`, side: 'front', index: i, height: layout.frontColumnHeight, rotation: fRot });
            cols.push({ id: `back-${i}`, side: 'back', index: i, height: layout.backColumnHeight, rotation: bRot });
          }
          // Preserve existing elements when re-applying layout (only if config changed compatibly)
          const existing = s.designs[id];
          const elements = existing?.elements || [];
          return { designs: { ...s.designs, [id]: { layout, columns: cols, elements } } };
        }),
      addElement: (id, el) => {
        const newId = `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        set((s) => {
          const d = s.designs[id] || { layout: null, columns: [], elements: [] };
          return {
            designs: {
              ...s.designs,
              [id]: { ...d, elements: [...d.elements, { ...el, id: newId, offset: el.offset || 0 }] },
            },
          };
        });
        return newId;
      },
      updateElement: (id, elementId, patch) =>
        set((s) => {
          const d = s.designs[id];
          if (!d) return s;
          return {
            designs: {
              ...s.designs,
              [id]: {
                ...d,
                elements: d.elements.map((e) => (e.id === elementId ? { ...e, ...patch } : e)),
              },
            },
          };
        }),
      updateAllOfType: (id, type, patch) =>
        set((s) => {
          const d = s.designs[id];
          if (!d) return s;
          return {
            designs: {
              ...s.designs,
              [id]: {
                ...d,
                elements: d.elements.map((e) => (e.type === type ? { ...e, ...patch } : e)),
              },
            },
          };
        }),
      removeElement: (id, elementId) =>
        set((s) => {
          const d = s.designs[id];
          if (!d) return s;
          return {
            designs: {
              ...s.designs,
              [id]: { ...d, elements: d.elements.filter((e) => e.id !== elementId) },
            },
          };
        }),
      autoGenerate: (id, opts, parts) => {
        const result: AutoGenerateResult = { added: 0, skipped: 0, skippedReason: [] };
        set((s) => {
          const d = s.designs[id];
          if (!d || !d.layout) return s;
          const layout = d.layout;
          const N = layout.frontColumnCount;

          // Helper: ground Y for columns
          const groundY =
            layout.mountType === 'continuous' ? (layout.continuousAboveGround || 0)
            : layout.mountType === 'formwork' ? (layout.formworkAboveGround || 0)
            : 0;

          // Helper: column anchor 3D position (mm)
          const colPos = (columnId: string, anchor: AnchorHeight): { x: number; y: number; z: number } | null => {
            const col = d.columns.find((c) => c.id === columnId);
            if (!col) return null;
            const x = col.side === 'front' ? 0 : layout.frontToBackDistance;
            const z = col.index * layout.frontSpacing;
            const y = groundY + col.height * anchorRatio(anchor);
            return { x, y, z };
          };

          // Helper: 3D distance between two points (mm)
          const dist3D = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
            Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

          // Helper: part length lookup
          const partLen = (code: string) => parts.find((p) => p.code === code)?.length || 0;

          // Helper: part "half-height" in WORLD Y direction (cross-section yarı yükseklik)
          // Beam (P3): rotation 0, web vertical → half = web/2 ≈ 50mm
          // Purlin (P4): rotation 3 (web yukarı, açıklık aşağı) → half = flange/2 ≈ 35mm
          const partHalfHeight = (code: string) => {
            return code === 'P3' ? 50 : code === 'P4' ? 35 : code === 'P5' ? 25 : 30;
          };

          const manual = d.elements.filter((e) => !(e.partCode || '').startsWith(AUTO_PREFIX));
          const fresh: DesignElement[] = [...manual];
          const mkId = () => `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

          const beamLenAvailable = partLen('P3');
          const beamHalfH = partHalfHeight('P3');
          const purlinLenAvailable = partLen('P4');
          const purlinHalfH = partHalfHeight('P4');
          const diagLenAvailable = partLen('P5');
          const struttLenAvailable = partLen('P6');

          // ============ 1) KİRİŞLER (front-i top → back-i top) ============
          const beamIds: string[] = [];
          if (opts.beams) {
            let beamSkipped = 0;
            for (let i = 0; i < N; i++) {
              const pA = colPos(`front-${i}`, 'top');
              const pB = colPos(`back-${i}`, 'top');
              if (!pA || !pB) continue;
              const dist = dist3D(pA, pB);
              if (beamLenAvailable > 0 && beamLenAvailable < dist) {
                beamSkipped++;
                continue;
              }
              const newId = mkId();
              fresh.push({
                id: newId,
                type: 'beam',
                start: { kind: 'column', columnId: `front-${i}`, anchor: 'top' },
                end: { kind: 'column', columnId: `back-${i}`, anchor: 'top' },
                offset: 0,
                // Kiriş kolon TEPESİNDEN 10 cm aşağı — yandan bağlanır (Türk pratiği)
                verticalOffset: -100,
                rotation: 0,
                partCode: `${AUTO_PREFIX}P3`,
              });
              beamIds.push(newId);
              result.added++;
            }
            if (beamSkipped > 0) {
              result.skipped += beamSkipped;
              result.skippedReason.push(`${beamSkipped} kiriş uzunluk yetersiz (Min ${dist3D(colPos(`front-0`, 'top')!, colPos(`back-0`, 'top')!).toFixed(0)} mm gerekir, P3 ${beamLenAvailable} mm)`);
            }
          }

          // ============ 2) AŞIKLAR ============
          // Kullanıcının istediği sayı kadar aşık, kiriş boyunca EŞİT aralıkla dağıtılır
          if (opts.purlinCount > 0 && beamIds.length >= 2) {
            const count = opts.purlinCount;
            const segments: Array<[number, number]> =
              opts.purlinSplice === 'continuous'
                ? [[0, beamIds.length - 1]]
                : Array.from({ length: beamIds.length - 1 }, (_, k) => [k, k + 1] as [number, number]);

            const beamAxisPoint = (beamIdx: number, pos: number) => {
              const pA = colPos(`front-${beamIdx}`, 'top')!;
              const pB = colPos(`back-${beamIdx}`, 'top')!;
              return {
                x: pA.x + (pB.x - pA.x) * pos,
                y: pA.y + (pB.y - pA.y) * pos,
                z: pA.z + (pB.z - pA.z) * pos,
              };
            };

            let purlinSkipped = 0;
            for (let p = 0; p < count; p++) {
              // Eski dağıtım: uçlardan %8 boşluk + aralarda eşit dağılım
              const t = count === 1 ? 0.5 : 0.08 + (p / (count - 1)) * 0.84;
              for (const [startIdx, endIdx] of segments) {
                const pA = beamAxisPoint(startIdx, t);
                const pB = beamAxisPoint(endIdx, t);
                const dist = dist3D(pA, pB);
                if (purlinLenAvailable > 0 && purlinLenAvailable < dist) {
                  purlinSkipped++;
                  continue;
                }
                fresh.push({
                  id: mkId(),
                  type: 'purlin',
                  start: { kind: 'element', elementId: beamIds[startIdx], position: t },
                  end: { kind: 'element', elementId: beamIds[endIdx], position: t },
                  offset: 0,
                  verticalOffset: beamHalfH + purlinHalfH,
                  rotation: 3,
                  partCode: `${AUTO_PREFIX}P4`,
                });
                result.added++;
              }
            }
            if (purlinSkipped > 0) {
              result.skipped += purlinSkipped;
              result.skippedReason.push(`${purlinSkipped} aşık uzunluk yetersiz (P4 ${purlinLenAvailable} mm)`);
            }
          }

          // ============ 3) ÇAPRAZ — bitişik back kolonlar arası, ALTERNATING bay ============
          if (opts.crossPattern !== 'none' && N >= 2) {
            let diagSkipped = 0;
            // Çapraz "bir dolu bir boş" — sadece çift indeks bay'larda (0, 2, 4 ...)
            // Yere DEĞMESİN diye 'bottom' yerine 'lower' (kolon yüksekliğinin %25'i)
            for (let i = 0; i < N - 1; i += 2) {
              const addDiag = (
                startId: string, startAnc: AnchorHeight, endId: string, endAnc: AnchorHeight
              ) => {
                const pA = colPos(startId, startAnc);
                const pB = colPos(endId, endAnc);
                if (!pA || !pB) return;
                const dist = dist3D(pA, pB);
                if (diagLenAvailable > 0 && diagLenAvailable < dist) {
                  diagSkipped++;
                  return;
                }
                fresh.push({
                  id: mkId(), type: 'diagonal',
                  start: { kind: 'column', columnId: startId, anchor: startAnc },
                  end: { kind: 'column', columnId: endId, anchor: endAnc },
                  offset: 0, verticalOffset: 0, rotation: 0,
                  partCode: `${AUTO_PREFIX}P5`,
                });
                result.added++;
              };
              if (opts.crossPattern === 'X') {
                addDiag(`back-${i}`, 'lower', `back-${i + 1}`, 'upper');
                addDiag(`back-${i + 1}`, 'lower', `back-${i}`, 'upper');
              } else if (opts.crossPattern === 'V') {
                addDiag(`back-${i}`, 'lower', `back-${i + 1}`, 'upper');
              }
            }
            if (diagSkipped > 0) {
              result.skipped += diagSkipped;
              result.skippedReason.push(`${diagSkipped} çapraz uzunluk yetersiz (P5 ${diagLenAvailable} mm)`);
            }
          }

          // ============ 4) PAYANDA — Türk pratik: TEK yön, ön upper → arka lower ============
          if (opts.knees) {
            let kneeSkipped = 0;
            for (let i = 0; i < N; i++) {
              const pA = colPos(`front-${i}`, 'upper');
              const pB = colPos(`back-${i}`, 'lower');
              if (!pA || !pB) continue;
              const dist = dist3D(pA, pB);
              if (struttLenAvailable > 0 && struttLenAvailable < dist) {
                kneeSkipped++;
                continue;
              }
              fresh.push({
                id: mkId(), type: 'strut',
                start: { kind: 'column', columnId: `front-${i}`, anchor: 'upper' },
                end: { kind: 'column', columnId: `back-${i}`, anchor: 'lower' },
                offset: 0, verticalOffset: 0, rotation: 0,
                partCode: `${AUTO_PREFIX}P6`,
              });
              result.added++;
            }
            if (kneeSkipped > 0) {
              result.skipped += kneeSkipped;
              result.skippedReason.push(`${kneeSkipped} payanda uzunluk yetersiz (P6 ${struttLenAvailable} mm)`);
            }
          }

          return {
            designs: {
              ...s.designs,
              [id]: { ...d, elements: fresh },
            },
          };
        });
        return result;
      },
      reset: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.designs;
          return { designs: rest };
        }),
    }),
    { name: 'table-design-store-v3' }
  )
);
