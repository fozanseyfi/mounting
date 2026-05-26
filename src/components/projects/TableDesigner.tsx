'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import {
  Pencil,
  Plus,
  Trash2,
  Layers3,
  Wrench,
  StretchVertical,
  TriangleRight,
  Boxes,
  RotateCcw,
  RotateCw,
  CheckCircle2,
  X,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Sliders,
  CopyCheck,
  HardHat,
  Hammer,
  Square,
  Slash,
  Wand2,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  useDesignStore,
  anchorRatio,
  ELEMENT_PART_CODES,
  type AnchorHeight,
  type ColumnSide,
  type DesignColumn,
  type DesignElement,
  type DesignLayoutConfig,
  type ElementType,
  type MountPoint,
  type MountType,
  type AutoGenerateOptions,
} from '@/lib/design-store';
import type { TableType as TableTypeReal, SehpaPart } from '@/types';
import { buildProfileShape, GALVANIZED_MATERIAL } from '@/lib/profile-shapes';
import { exportDesignPDF } from '@/lib/export/design-pdf';
import type { Project } from '@/types';
import { cn } from '@/lib/utils';

/* ============================================================
   Constants
============================================================ */

const ANCHORS_COL: AnchorHeight[] = ['bottom', 'lower', 'middle', 'upper', 'top'];
const ANCHORS_EL: number[] = [0, 0.25, 0.5, 0.75, 1];

const EMPTY_DESIGN_REF: { layout: DesignLayoutConfig | null; columns: DesignColumn[]; elements: DesignElement[] } = {
  layout: null,
  columns: [],
  elements: [],
};

const MODE_META: Record<
  ElementType,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }>; rule?: 'cross-row' | 'same-row' }
> = {
  beam: { label: 'Kiriş', color: '#FFC107', icon: Wrench, rule: 'cross-row' },
  purlin: { label: 'Aşık', color: '#42A5F5', icon: StretchVertical, rule: 'same-row' },
  diagonal: { label: 'Çapraz', color: '#FB923C', icon: TriangleRight },
  strut: { label: 'Payanda', color: '#A78BFA', icon: Boxes },
};

const MOUNT_TYPE_META: Record<MountType, { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = {
  continuous: { label: 'Sürekli Sömel', desc: 'Tüm kolonların altında uzun bir beton kütle (en yaygın)', icon: Slash },
  drilled: { label: 'Delgi Beton', desc: 'Zemine delik açılır, kolon ortalanır, etrafına beton', icon: HardHat },
  driven: { label: 'Çakma', desc: 'Kolon zemine çakılır, beton yok', icon: Hammer },
  formwork: { label: 'Kalıp Beton', desc: 'Münferit kalıp + beton, kolon üzerine oturur', icon: Square },
};

const M = (mm: number) => mm / 1000;

/** Kolon yarı-derinliği — kolonun parça verisinden tahmin edilen "axis-yönü kalınlık" (mm) */
function columnHalfDepthAlongAxis(col: DesignColumn | undefined, parts: SehpaPart[], axis: THREE.Vector3): number {
  const part = col ? findPartByColumnSide(col.side, parts) : undefined;
  if (!part) return 0.04; // varsayılan 40mm
  // Kolonun bounding-box'ı: en geniş kenar
  const edges = part.edges || [];
  const maxEdge = Math.max(...edges.filter((e) => e > 0), part.thickness * 2);
  // Yarı-derinlik = enin yarısı + bolt klirensi (~20mm)
  return M(maxEdge / 2 + 5);
}

/** Bir mount noktasını "kolon yüzeyine" ittir — beam orada başlasın */
function pushMountToSurface(
  mp: MountPoint,
  position: THREE.Vector3,
  axisToOther: THREE.Vector3,
  halfDepth: number
): THREE.Vector3 {
  if (mp.kind !== 'column') return position;
  return position.clone().addScaledVector(axisToOther, halfDepth);
}

/* ============================================================
   Geometry helpers
============================================================ */

/** Ground top = y=0. Kolonun above-ground base konumu */
function columnGroundY(layout: DesignLayoutConfig): number {
  if (layout.mountType === 'formwork') return M(layout.formworkAboveGround || 0);
  if (layout.mountType === 'continuous') return M(layout.continuousAboveGround || 0);
  return 0;
}

/** Kolonun zemin altı derinliği (gömülü kısım) — montaj tipine göre */
function columnEmbedDepth_m(layout: DesignLayoutConfig): number {
  switch (layout.mountType) {
    case 'drilled':
      return M(layout.drillDepth || 0);
    case 'driven':
      return M(layout.drivenDepth || 0);
    case 'formwork':
      return M(layout.formworkBelowGround || 0);
    case 'continuous':
      return M(layout.continuousBelowGround || 0) * 0.6; // ankraj cıvatası göstergesi
    default:
      return 0;
  }
}

function columnBaseXYZ(col: DesignColumn, layout: DesignLayoutConfig): [number, number, number] {
  const x = col.side === 'front' ? 0 : M(layout.frontToBackDistance);
  const z = M(col.index * layout.frontSpacing);
  return [x, columnGroundY(layout), z];
}

function columnAnchorXYZ(col: DesignColumn, anchor: AnchorHeight, layout: DesignLayoutConfig): [number, number, number] {
  const [x, y0, z] = columnBaseXYZ(col, layout);
  return [x, y0 + M(col.height) * anchorRatio(anchor), z];
}

/* ============================================================
   Element geometry resolver
============================================================ */

interface ElementGeometry {
  mountA_raw: THREE.Vector3;
  mountB_raw: THREE.Vector3;
  mountA: THREE.Vector3;
  mountB: THREE.Vector3;
  /** Bolt positions = mount points projected onto the beam axis line (so bolts sit ON the beam) */
  boltA: THREE.Vector3;
  boltB: THREE.Vector3;
  axis: THREE.Vector3;
  D_m: number;
  L_part_m: number;
  L_m: number;
  center: THREE.Vector3;
  beamStart: THREE.Vector3;
  beamEnd: THREE.Vector3;
  overhangA: number;
  overhangB: number;
  fits: boolean;
  exactFit: boolean;
  verticalOffset_m: number;
}

/** Project point onto the line segment beamStart→beamEnd, clamped to segment range */
function projectPointOnSegment(point: THREE.Vector3, lineStart: THREE.Vector3, lineEnd: THREE.Vector3): THREE.Vector3 {
  const dir = lineEnd.clone().sub(lineStart);
  const len2 = dir.lengthSq();
  if (len2 < 1e-12) return lineStart.clone();
  const t = point.clone().sub(lineStart).dot(dir) / len2;
  const tClamped = Math.max(0, Math.min(1, t));
  return lineStart.clone().add(dir.multiplyScalar(tClamped));
}

function resolveMountPosition(
  mp: MountPoint,
  columns: DesignColumn[],
  elements: DesignElement[],
  layout: DesignLayoutConfig,
  parts: SehpaPart[]
): THREE.Vector3 | null {
  if (mp.kind === 'column') {
    const col = columns.find((c) => c.id === mp.columnId);
    if (!col) return null;
    const [x, y, z] = columnAnchorXYZ(col, mp.anchor, layout);
    return new THREE.Vector3(x, y, z);
  }
  const el = elements.find((e) => e.id === mp.elementId);
  if (!el) return null;
  const geo = resolveElementGeometry(el, columns, elements, layout, parts);
  if (!geo) return null;
  return new THREE.Vector3().lerpVectors(geo.beamStart, geo.beamEnd, mp.position);
}

function resolveElementGeometry(
  el: DesignElement,
  columns: DesignColumn[],
  elements: DesignElement[],
  layout: DesignLayoutConfig,
  parts: SehpaPart[]
): ElementGeometry | null {
  const A_raw = resolveMountPosition(el.start, columns, elements, layout, parts);
  const B_raw = resolveMountPosition(el.end, columns, elements, layout, parts);
  if (!A_raw || !B_raw) return null;
  const axisVec = new THREE.Vector3().subVectors(B_raw, A_raw);
  const Draw = axisVec.length();
  if (Draw < 1e-6) return null;
  const axis = axisVec.clone().normalize();

  // GERÇEK PARÇA UZUNLUĞU: eleman stok uzunluğunda render edilir.
  // Beam, mount noktalarının ortasından geçer; gerekirse overhang olur.
  // Cıvatalar mount noktalarının BEAM AXIS üzerine projekte edilmiş haline yerleşir.
  const A = A_raw.clone();
  const B = B_raw.clone();
  const D_m = Draw;

  const part = findPartForElement(el, parts);
  const L_part_m = part ? M(part.length) : D_m;
  const fits = L_part_m >= D_m - 1e-6;

  // Render = gerçek parça uzunluğu
  const L_m = L_part_m;
  const exactFit = false;

  // Axis offset: beam must cover both mount points
  const maxAxialOffset_m = Math.max(0, (L_m - D_m) / 2);
  const requestedOffset_m = M(el.offset || 0);
  const offsetMeters = Math.max(-maxAxialOffset_m, Math.min(maxAxialOffset_m, requestedOffset_m));

  // CONSTRAIN vertical offset to ±200mm (boşluğa düşmesin ama otomatik stack için yeterli)
  const maxVertical_m = M(200);
  const requestedV_m = M(el.verticalOffset || 0);
  const verticalOffset_m = Math.max(-maxVertical_m, Math.min(maxVertical_m, requestedV_m));

  const mid = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
  const center = mid.clone().addScaledVector(axis, offsetMeters);
  center.y += verticalOffset_m;

  const halfL = L_m / 2;
  const beamStart = center.clone().addScaledVector(axis, -halfL);
  const beamEnd = center.clone().addScaledVector(axis, halfL);

  // Overhang relative to surface mount points (A, B)
  const aToStart = new THREE.Vector3().subVectors(A, beamStart);
  const overhangA = aToStart.dot(axis);
  const bToEnd = new THREE.Vector3().subVectors(beamEnd, B);
  const overhangB = bToEnd.dot(axis);

  // Bolts: project raw mounts onto beam axis line so bolts sit ON the beam (not floating where anchor used to be)
  const boltA = projectPointOnSegment(A_raw, beamStart, beamEnd);
  const boltB = projectPointOnSegment(B_raw, beamStart, beamEnd);

  return {
    mountA_raw: A_raw, mountB_raw: B_raw,
    mountA: A, mountB: B,
    boltA, boltB,
    axis, D_m, L_part_m, L_m, center, beamStart, beamEnd,
    overhangA, overhangB, fits, exactFit,
    verticalOffset_m,
  };
}

function findPartForElement(el: DesignElement | { type: ElementType }, parts: SehpaPart[]): SehpaPart | undefined {
  return parts.find((p) => p.code === ELEMENT_PART_CODES[el.type]);
}

function findPartByColumnSide(side: ColumnSide, parts: SehpaPart[]): SehpaPart | undefined {
  return parts.find((p) => p.code === (side === 'front' ? 'P1' : 'P2'));
}

function isSameMP(a: MountPoint, b: MountPoint): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'column' && b.kind === 'column') return a.columnId === b.columnId && a.anchor === b.anchor;
  if (a.kind === 'element' && b.kind === 'element')
    return a.elementId === b.elementId && Math.abs(a.position - b.position) < 0.001;
  return false;
}

/* ============================================================
   Main component
============================================================ */

interface Props {
  tableType: TableTypeReal;
  tiltAngle: number;
  project?: Project;
}

const DEFAULT_LAYOUT = (parts: SehpaPart[]): DesignLayoutConfig => {
  const front = parts.find((p) => /ön|on|front/i.test(p.name) || /P1/i.test(p.code));
  const back = parts.find((p) => /arka|back/i.test(p.name) || /P2/i.test(p.code));
  return {
    frontColumnCount: Math.max(1, front?.quantityPerTable || 2),
    frontSpacing: 3000,
    frontToBackDistance: 2000,
    frontColumnHeight: front?.length || 1500,
    backColumnHeight: back?.length || 2500,
    mountType: 'continuous',
    drillDiameter: 300,
    drillDepth: 1000,
    drivenDepth: 1500,
    formworkWidth: 400,
    formworkDepth: 400,
    formworkBelowGround: 600,
    formworkAboveGround: 200,
    continuousWidth: 600,
    continuousDepth: 0, // 0 = sıra boyu + 600 mm taşma
    continuousBelowGround: 500,
    continuousAboveGround: 100,
    frontRotation: 0,
    backRotation: 2, // varsayılan: arka kolonlar 180° döndürülür ki C açıklığı öne baksın
  };
};

export function TableDesigner({ tableType, tiltAngle, project }: Props) {
  const storedDesign = useDesignStore((s) => s.designs[tableType.id]);
  const design = storedDesign || EMPTY_DESIGN_REF;
  const applyLayout = useDesignStore((s) => s.applyLayout);
  const addElement = useDesignStore((s) => s.addElement);
  const updateElement = useDesignStore((s) => s.updateElement);
  const updateAllOfType = useDesignStore((s) => s.updateAllOfType);
  const removeElement = useDesignStore((s) => s.removeElement);
  const autoGenerate = useDesignStore((s) => s.autoGenerate);
  const reset = useDesignStore((s) => s.reset);
  const { toast } = useToast();

  const [layoutOpen, setLayoutOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [mode, setMode] = useState<ElementType | null>(null);
  const [selected, setSelected] = useState<MountPoint[]>([]);
  const [expandedEl, setExpandedEl] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showBolts, setShowBolts] = useState(true);
  const [showUnderground, setShowUnderground] = useState(false);
  const [dark, setDark] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [captureNonce, setCaptureNonce] = useState(0);
  const captureCallbackRef = useRef<((data: CapturedViews) => void) | null>(null);

  const defaultLayout = useMemo(() => DEFAULT_LAYOUT(tableType.parts), [tableType.parts]);

  function handleAnchorClick(mp: MountPoint) {
    if (!mode) return;
    const sel = [...selected];
    const dupIdx = sel.findIndex((s) => isSameMP(s, mp));
    if (dupIdx >= 0) {
      sel.splice(dupIdx, 1);
      setSelected(sel);
      return;
    }
    if (sel.length >= 2) sel.splice(0, sel.length - 1);
    sel.push(mp);
    setSelected(sel);
    if (sel.length === 2) placeElement(sel[0], sel[1]);
  }

  function placeElement(a: MountPoint, b: MountPoint) {
    if (!mode || !design.layout) return;
    if (a.kind === 'column' && b.kind === 'column') {
      const cA = design.columns.find((c) => c.id === a.columnId);
      const cB = design.columns.find((c) => c.id === b.columnId);
      const rule = MODE_META[mode].rule;
      if (cA && cB) {
        if (cA.id === cB.id) {
          toast('Tek bir kolonun iki noktasına eleman yerleştirilemez', 'error');
          setSelected([]); return;
        }
        if (rule === 'cross-row' && cA.side === cB.side) {
          toast(`Kiriş ön ve arka kolon arasına yerleşir — iki nokta da "${cA.side === 'front' ? 'ÖN' : 'ARKA'}" tarafta.`, 'error');
          setSelected([]); return;
        }
        if (rule === 'same-row' && cA.side !== cB.side) {
          toast('Aşık aynı sıradaki iki kolon arasına yerleşir — bir ön bir arka seçtiniz.', 'error');
          setSelected([]); return;
        }
      }
    }
    const tempEl: DesignElement = { id: '__tmp', type: mode, start: a, end: b, offset: 0 };
    const geo = resolveElementGeometry(tempEl, design.columns, design.elements, design.layout, tableType.parts);
    if (!geo) { toast('Noktalar çözümlenemedi', 'error'); setSelected([]); return; }
    if (!geo.fits) {
      const partLen = findPartForElement({ type: mode }, tableType.parts)?.length || 0;
      toast(
        `Uzunluk yetersiz — parça birleşimi sağlanmıyor. Yüzey-yüzey mesafesi ${(geo.D_m * 1000).toFixed(0)} mm, parça ${partLen} mm. Parçayı en az ${(geo.D_m * 1000).toFixed(0)} mm yapın.`,
        'error'
      );
      setSelected([]); return;
    }
    const part = findPartForElement({ type: mode }, tableType.parts);
    addElement(tableType.id, {
      type: mode,
      start: a,
      end: b,
      offset: 0,
      verticalOffset: 0,
      rotation: 0,
      partCode: part?.code,
    });
    toast(`${MODE_META[mode].label} eklendi (boy ${(geo.L_m * 1000).toFixed(0)} mm)`, 'success');
    setSelected([]);
  }

  function handleReset() {
    if (!confirm('Tüm tasarımı sıfırlamak istediğinize emin misiniz?')) return;
    reset(tableType.id);
    setMode(null); setSelected([]); setExpandedEl(null);
    toast('Tasarım sıfırlandı', 'success');
  }

  function handlePdfDownload() {
    if (!design.layout) {
      toast('Tasarım yok — önce masa tasarlayın', 'error');
      return;
    }
    if (pdfBusy) return;
    setPdfBusy(true);
    // Set callback BEFORE incrementing nonce, so the capture flow uses it
    captureCallbackRef.current = (data: CapturedViews) => {
      try {
        const mountLabel =
          design.layout!.mountType === 'continuous' ? 'Sürekli Sömel' :
          design.layout!.mountType === 'drilled' ? 'Delgi Beton' :
          design.layout!.mountType === 'driven' ? 'Çakma' : 'Kalıp Beton';
        const projForPdf: Project = project || {
          id: tableType.id,
          name: tableType.name,
          panelWattage: 0,
          tiltAngle,
          status: 'DRAFT',
          tableTypes: [tableType],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
        exportDesignPDF(projForPdf, tableType, data, {
          mountType: mountLabel,
          columnCount: design.columns.length,
          elementCount: design.elements.length,
          rowLength_mm: (design.layout!.frontColumnCount - 1) * design.layout!.frontSpacing,
          frontToBackDistance_mm: design.layout!.frontToBackDistance,
          frontColumnHeight_mm: design.layout!.frontColumnHeight,
          backColumnHeight_mm: design.layout!.backColumnHeight,
          tiltAngle,
        });
        toast('PDF indirildi', 'success');
      } catch (e) {
        console.error(e);
        toast('PDF oluşturulamadı', 'error');
      } finally {
        setPdfBusy(false);
      }
    };
    setCaptureNonce((n) => n + 1);
  }

  /* ---------- EMPTY ---------- */
  if (!design.layout) {
    return (
      <>
        <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden" style={{ height: 600 }}>
          <Canvas shadows camera={{ position: [8, 6, 10], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 15, 5]} intensity={1} />
            <GrassGround />
            <OrbitControls makeDefault enableDamping minDistance={5} maxDistance={40} target={[0, 0.5, 0]} />
          </Canvas>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur border-2 border-primary/40 rounded-2xl p-6 shadow-2xl pointer-events-auto max-w-md mx-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center shadow-md">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Masa Tasarımı Boş</h3>
                  <p className="text-xs text-slate-500">{tableType.name} için sehpa yapısını çizin</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Önce <b>montaj tipi + kolonları</b> belirleyin (delgi/çakma/kalıp beton),
                ardından kolon noktalarına tıklayarak <b>kiriş, aşık, çapraz, payanda</b> ekleyin.
                Profiller gerçek kesitiyle, galvaniz renginde çizilir.
              </p>
              <Button size="lg" className="w-full mt-4" onClick={() => setLayoutOpen(true)}>
                <Pencil className="w-4 h-4" /> Masa Tasarla
              </Button>
            </div>
          </div>
        </div>
        <LayoutWizardModal
          open={layoutOpen}
          onClose={() => setLayoutOpen(false)}
          initial={defaultLayout}
          onSubmit={(cfg) => {
            applyLayout(tableType.id, cfg);
            setLayoutOpen(false);
            toast(`${cfg.frontColumnCount * 2} kolon yerleştirildi`, 'success');
          }}
        />
      </>
    );
  }

  /* ---------- DESIGN MODE ---------- */
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3">
        <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden" style={{ height: 600 }}>
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg px-3 py-2 max-w-xs">
            <p className="text-xs font-semibold text-slate-700">
              {design.layout.frontColumnCount * 2} kolon · {design.elements.length} eleman
            </p>
            <p className="text-[11px] text-slate-500">
              Eğim {tiltAngle}° · {MOUNT_TYPE_META[design.layout.mountType].label}
            </p>
          </div>

          {mode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-primary text-white rounded-xl shadow-lg px-4 py-2.5 max-w-md">
              <p className="text-sm font-semibold flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded bg-white/20 items-center justify-center text-xs font-bold">{selected.length}/2</span>
                {MODE_META[mode].label} yerleşimi — {selected.length === 0 ? 'ilk' : 'ikinci'} noktayı seçin
              </p>
              <p className="text-[11px] text-white/80 mt-0.5">
                {MODE_META[mode].rule === 'cross-row' && 'Bir ön, bir arka — kolon veya başka eleman noktası'}
                {MODE_META[mode].rule === 'same-row' && 'İki kolon aynı tarafta olmalı'}
                {!MODE_META[mode].rule && 'İki nokta seçin'}
              </p>
            </div>
          )}

          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg p-2.5 space-y-1.5">
            <button onClick={() => setShowLabels((v) => !v)} className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-primary w-full">
              {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}Etiketler
            </button>
            <button onClick={() => setShowBolts((v) => !v)} className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-primary w-full">
              {showBolts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}Cıvatalar
            </button>
            <button onClick={() => setShowUnderground((v) => !v)} className={cn('flex items-center gap-1.5 text-xs hover:text-primary w-full', showUnderground ? 'text-primary font-semibold' : 'text-slate-700')}>
              {showUnderground ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}Yer Altı
            </button>
            <button onClick={() => setDark((v) => !v)} className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-primary w-full">
              {dark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}{dark ? 'Koyu' : 'Açık'}
            </button>
            <button onClick={() => setLayoutOpen(true)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark w-full font-semibold border-t border-slate-200 pt-1.5 mt-1.5">
              <Pencil className="w-3.5 h-3.5" />Düzeni Değiştir
            </button>
          </div>

          <div style={{ height: '100%', background: dark ? '#0f172a' : '#dbeafe' }}>
            <DesignerScene
              design={design}
              parts={tableType.parts}
              mode={mode}
              selected={selected}
              onAnchorClick={handleAnchorClick}
              showLabels={showLabels}
              showBolts={showBolts}
              showUnderground={showUnderground}
              dark={dark}
              captureNonce={captureNonce}
              onCaptured={(data) => { captureCallbackRef.current?.(data); }}
            />
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 max-h-[600px] overflow-y-auto">
          {/* AUTO-GENERATE — big primary action */}
          <button
            onClick={() => setAutoOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white font-semibold shadow-md hover:shadow-lg transition-all text-sm"
          >
            <Wand2 className="w-4 h-4" />
            Otomatik Yapı Üret
          </button>

          {/* PDF DOWNLOAD */}
          <button
            onClick={handlePdfDownload}
            disabled={pdfBusy}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-white border-2 border-primary text-primary-dark font-semibold hover:bg-primary-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfBusy ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                PDF hazırlanıyor...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                PDF Tasarım Raporu
              </>
            )}
          </button>

          <div>
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Manuel Eleman Ekle</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(['beam', 'purlin', 'diagonal', 'strut'] as ElementType[]).map((t) => {
                const meta = MODE_META[t];
                const Icon = meta.icon;
                const part = findPartForElement({ type: t }, tableType.parts);
                const active = mode === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      if (mode === t) { setMode(null); setSelected([]); }
                      else { setMode(t); setSelected([]); }
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                      active ? 'border-primary bg-primary-50 text-primary-dark shadow-sm' : 'border-slate-200 bg-white hover:border-primary/40 text-slate-700'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{meta.label}</span>
                    <span className="text-[10px] text-slate-500">
                      {part ? `${part.length}mm · ${part.profileType}` : 'parça yok'}
                    </span>
                    {active && <span className="text-[10px] text-primary">{selected.length}/2</span>}
                  </button>
                );
              })}
            </div>
            {mode && (
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => { setMode(null); setSelected([]); }} className="h-6 px-2">
                  <X className="w-3 h-3" />İptal
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                Yerleştirilenler ({design.elements.length})
              </p>
              {design.elements.length > 0 && (
                <Badge variant="success" className="text-[10px]">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />Aktif
                </Badge>
              )}
            </div>
            {design.elements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Tip seçin ve 3D'de noktalara tıklayın. Eklenen elemanlar üzerinde de mesnet noktaları belirir.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {design.elements.map((el) => {
                  const geo = resolveElementGeometry(el, design.columns, design.elements, design.layout!, tableType.parts);
                  return (
                    <ElementRow
                      key={el.id}
                      el={el}
                      geo={geo}
                      expanded={expandedEl === el.id}
                      sameTypeCount={design.elements.filter((e) => e.type === el.type).length}
                      onToggle={() => setExpandedEl(expandedEl === el.id ? null : el.id)}
                      onDelete={() => removeElement(tableType.id, el.id)}
                      onPatch={(p) => updateElement(tableType.id, el.id, p)}
                      onApplyToType={(p) => {
                        updateAllOfType(tableType.id, el.type, p);
                        toast(`${MODE_META[el.type].label} elemanlarının ${design.elements.filter((e) => e.type === el.type).length} tanesine uygulandı`, 'success');
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 mt-auto">
            <Button variant="outline" size="sm" className="w-full text-red-600 hover:bg-red-50 hover:border-red-300" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5" />Tasarımı Sıfırla
            </Button>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              Sarı = ön kolon · Kırmızı = arka kolon · Yeşil = seçili · Mor = eleman noktası
            </p>
          </div>
        </div>
      </div>

      <LayoutWizardModal
        open={layoutOpen}
        onClose={() => setLayoutOpen(false)}
        initial={design.layout || defaultLayout}
        onSubmit={(cfg) => {
          applyLayout(tableType.id, cfg);
          setLayoutOpen(false);
          toast(`Düzen güncellendi`, 'success');
        }}
      />

      <AutoGenerateModal
        open={autoOpen}
        onClose={() => setAutoOpen(false)}
        layout={design.layout}
        existingAutoCount={design.elements.filter((e) => (e.partCode || '').startsWith('AUTO_')).length}
        onSubmit={(opts) => {
          const partLite = tableType.parts.map((p) => ({ code: p.code, length: p.length }));
          const res = autoGenerate(tableType.id, opts, partLite);
          setAutoOpen(false);
          if (res.skipped > 0) {
            toast(
              `${res.added} eleman üretildi · ${res.skipped} eleman atlandı: ${res.skippedReason.join(' · ')}`,
              'error'
            );
          } else {
            toast(`${res.added} eleman üretildi`, 'success');
          }
        }}
      />
    </>
  );
}

/* ============================================================
   AutoGenerateModal — kullanıcı dostu otomatik yapı üretici
============================================================ */

function AutoGenerateModal({
  open, onClose, layout, existingAutoCount, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  layout: DesignLayoutConfig | null;
  existingAutoCount: number;
  onSubmit: (opts: AutoGenerateOptions) => void;
}) {
  const [opts, setOpts] = useState<AutoGenerateOptions>({
    beams: true,
    purlinCount: 4,
    purlinSplice: 'per-bay',
    crossPattern: 'X',
    knees: true,
  });

  if (!layout) return null;
  const N = layout.frontColumnCount;

  // Estimate counts
  const beamCount = opts.beams ? N : 0;
  const purlinSegmentsPerRow = opts.purlinSplice === 'continuous' ? 1 : Math.max(0, N - 1);
  const purlinCount = opts.purlinCount > 0 && N >= 2 ? opts.purlinCount * purlinSegmentsPerRow : 0;
  // Alternating bays: ceil((N-1)/2) bays get diagonals
  const altBayCount = Math.ceil((N - 1) / 2);
  const diagCount =
    opts.crossPattern === 'X' ? altBayCount * 2 :
    opts.crossPattern === 'V' ? altBayCount : 0;
  const kneeCount = opts.knees ? N : 0; // tek payanda her sehpa
  const total = beamCount + purlinCount + diagCount + kneeCount;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" /> Yapıyı Otomatik Üret
          </DialogTitle>
          <DialogDescription>
            Standart GES konstrüksiyon yapısını tek tıkla oluşturur. Önce hangi elemanların üretileceğini seçin.
            {existingAutoCount > 0 && (
              <span className="block mt-1 text-amber-700 text-xs">
                ⚠️ {existingAutoCount} otomatik eleman zaten var — yeniden üretirsek silinip yenilenecek.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Beams */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={opts.beams}
              onChange={(e) => setOpts({ ...opts, beams: e.target.checked })}
              className="mt-1 w-4 h-4 accent-primary"
            />
            <div className="flex-1">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                Kirişler — {N} adet (ön kolon tepe → arka kolon tepe)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Her ön-arka kolon çifti için bir kiriş, eğim açısında</p>
            </div>
          </label>

          {/* Purlins */}
          <div className="p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <StretchVertical className="w-4 h-4 text-blue-500" />
                Aşıklar
              </p>
              <span className="text-xs text-slate-500">{purlinCount} adet</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">Kirişlerin üstünde dik yönde, panel desteği</p>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Dikey (kiriş boyunca) sayı</p>
                <div className="flex items-center gap-1.5">
                  {[0, 2, 4, 6, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setOpts({ ...opts, purlinCount: n })}
                      className={cn(
                        'flex-1 py-1.5 text-xs font-mono font-bold rounded border',
                        opts.purlinCount === n ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 hover:border-primary/40'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">
                  Yatay (sıra boyunca) ek bağlantı
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOpts({ ...opts, purlinSplice: 'continuous' })}
                    className={cn(
                      'py-1.5 text-[11px] font-semibold rounded border text-center',
                      opts.purlinSplice === 'continuous' ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 hover:border-primary/40'
                    )}
                  >
                    Sürekli<br /><span className="text-[9px] opacity-70">tek parça uçtan uca</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpts({ ...opts, purlinSplice: 'per-bay' })}
                    className={cn(
                      'py-1.5 text-[11px] font-semibold rounded border text-center',
                      opts.purlinSplice === 'per-bay' ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 hover:border-primary/40'
                    )}
                  >
                    Bay başına<br /><span className="text-[9px] opacity-70">her kiriş açıklığı için ek</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {opts.purlinSplice === 'continuous'
                    ? `${opts.purlinCount} adet uzun aşık · parça uzunluğu sıra boyuna yetmeyebilir`
                    : `${purlinCount} adet kısa aşık · her ek noktasında bağlantı parçası kullanılır`}
                </p>
              </div>
            </div>
          </div>

          {/* Cross bracing */}
          <div className="p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <TriangleRight className="w-4 h-4 text-orange-500" />
                Çapraz (Bracing)
              </p>
              <span className="text-xs text-slate-500">{diagCount} adet</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Bir dolu bir boş — bay sıra atlanarak yerleştirilir, yere değdirilmez
            </p>
            <div className="flex items-center gap-2">
              {[
                { v: 'none' as const, label: 'Yok' },
                { v: 'X' as const, label: 'X Pattern' },
                { v: 'V' as const, label: 'V Pattern' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setOpts({ ...opts, crossPattern: opt.v })}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-semibold rounded border',
                    opts.crossPattern === opt.v ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 hover:border-primary/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Knee braces */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={opts.knees}
              onChange={(e) => setOpts({ ...opts, knees: e.target.checked })}
              className="mt-1 w-4 h-4 accent-primary"
            />
            <div className="flex-1">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-purple-500" />
                Payandalar — {kneeCount} adet (tek yön)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Ön kolon (üst) ↔ Arka kolon (alt) — Türkiye'de yaygın tek-yön diz desteği
              </p>
            </div>
          </label>

        </div>

        <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mt-2">
          <p className="text-sm font-bold text-primary-dark">Toplam: {total} eleman üretilecek</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Manuel eklediğiniz elemanlar etkilenmez. Otomatik üretilen elemanlar daha sonra tek tek düzenlenebilir.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={() => onSubmit(opts)} disabled={total === 0}>
            <Wand2 className="w-4 h-4" /> Yapıyı Üret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   Element Row
============================================================ */

function ElementRow({
  el, geo, expanded, sameTypeCount,
  onToggle, onDelete, onPatch, onApplyToType,
}: {
  el: DesignElement;
  geo: ElementGeometry | null;
  expanded: boolean;
  sameTypeCount: number;
  onToggle: () => void;
  onDelete: () => void;
  onPatch: (p: Partial<DesignElement>) => void;
  onApplyToType: (p: Partial<DesignElement>) => void;
}) {
  const meta = MODE_META[el.type];
  const totalOverhang_mm = geo ? Math.round((geo.L_m - geo.D_m) * 1000) : 0;
  const maxOffset_mm = Math.max(0, totalOverhang_mm / 2);
  const overhangA_mm = geo ? Math.round(geo.overhangA * 1000) : 0;
  const overhangB_mm = geo ? Math.round(geo.overhangB * 1000) : 0;
  const rotationDeg = ((el.rotation || 0) * 90) % 360;

  const labelMP = (mp: MountPoint) => {
    if (mp.kind === 'column') {
      const idx = mp.columnId.split('-')[1];
      return `${mp.columnId.startsWith('front') ? 'Ön' : 'Arka'}${idx}-${mp.anchor.charAt(0)}`;
    }
    return `${mp.elementId.slice(-4)}@${(mp.position * 100).toFixed(0)}%`;
  };

  return (
    <div className="bg-slate-50 rounded-md overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <button onClick={onToggle} className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: meta.color }} />
          <span className="text-xs font-medium text-slate-800 truncate">{meta.label}</span>
          <span className="text-[10px] text-slate-500 font-mono truncate">
            {labelMP(el.start)} → {labelMP(el.end)}
          </span>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[9px] text-slate-500 font-mono px-1">{rotationDeg}°</span>
          <button onClick={onToggle} className="text-slate-500 hover:text-primary p-0.5" title="Düzenle">
            <Sliders className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="text-red-500 hover:text-red-700 p-0.5" title="Sil">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {expanded && geo && (
        <div className="px-2 pb-2 pt-1 border-t border-slate-200 bg-white space-y-2.5">
          <div className="grid grid-cols-3 gap-1 text-[10px] tabular-nums">
            <div className="bg-slate-100 rounded px-1.5 py-1">
              <p className="text-slate-500 uppercase">Boy</p>
              <p className="font-bold text-slate-900">{(geo.L_m * 1000).toFixed(0)} mm</p>
            </div>
            <div className="bg-slate-100 rounded px-1.5 py-1">
              <p className="text-slate-500 uppercase">Mesafe</p>
              <p className="font-bold text-slate-900">{(geo.D_m * 1000).toFixed(0)} mm</p>
            </div>
            <div className="bg-slate-100 rounded px-1.5 py-1">
              <p className="text-slate-500 uppercase">Çıkıntı</p>
              <p className="font-bold text-slate-900">{totalOverhang_mm} mm</p>
            </div>
          </div>

          {/* Rotation */}
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-600 mb-1">Kesit Rotasyonu</p>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((r) => (
                <button
                  key={r}
                  onClick={() => onPatch({ rotation: r })}
                  className={cn(
                    'flex-1 text-[11px] py-1.5 rounded border font-mono font-bold transition-colors',
                    (el.rotation || 0) === r
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary/40'
                  )}
                >
                  {r * 90}°
                </button>
              ))}
              <button
                onClick={() => onPatch({ rotation: (((el.rotation || 0) + 1) % 4) })}
                className="px-2 py-1.5 rounded border border-slate-200 hover:border-primary/40 text-slate-600"
                title="90° döndür"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Stok ve mesnet aralığı bilgisi */}
          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-700">
            <div className="grid grid-cols-2 gap-1 tabular-nums">
              <span>Parça: <b>{(geo.L_part_m * 1000).toFixed(0)} mm</b></span>
              <span>Mesnet aralığı: <b>{(geo.D_m * 1000).toFixed(0)} mm</b></span>
            </div>
            {totalOverhang_mm > 0 && (
              <p className="text-amber-700 mt-0.5">Toplam çıkıntı: {totalOverhang_mm} mm (sol+sağ)</p>
            )}
          </div>

          {/* Sol/Sağ çıkıntı slider */}
          {totalOverhang_mm > 0 && (
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-600 mb-1">Sol/Sağ Çıkıntı</p>
              <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                <span>Sol: <b>{Math.round(overhangA_mm)} mm</b></span>
                <span>Sağ: <b>{Math.round(overhangB_mm)} mm</b></span>
              </div>
              <input
                type="range"
                min={-maxOffset_mm}
                max={maxOffset_mm}
                step={5}
                value={el.offset}
                onChange={(e) => onPatch({ offset: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
          )}

          {/* Vertical offset (yukarı/aşağı) — capped at ±200mm */}
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-600 mb-1">Yukarı/Aşağı Kayma (dikey, ±200 mm)</p>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Mevcut: <b>{Math.round(el.verticalOffset || 0)} mm</b></span>
              <span className="text-slate-400">- aşağı / + yukarı</span>
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              step={5}
              value={Math.max(-200, Math.min(200, el.verticalOffset || 0))}
              onChange={(e) => onPatch({ verticalOffset: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => onPatch({ verticalOffset: 0 })}
                className="text-[10px] px-2 py-0.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100"
                title="Sıfırla"
              >
                0
              </button>
              <input
                type="number"
                value={Math.round(el.verticalOffset || 0)}
                onChange={(e) => onPatch({ verticalOffset: parseFloat(e.target.value) || 0 })}
                className="flex-1 text-[10px] px-1 py-0.5 border border-slate-200 rounded tabular-nums"
              />
              <span className="text-[9px] text-slate-400">mm</span>
            </div>
          </div>

          {/* Apply to all of type */}
          {sameTypeCount > 1 && (
            <div className="pt-1.5 border-t border-slate-100">
              <button
                onClick={() =>
                  onApplyToType({
                    rotation: el.rotation || 0,
                    offset: el.offset,
                    verticalOffset: el.verticalOffset || 0,
                  })
                }
                className="flex items-center justify-center gap-1.5 w-full text-[11px] py-1.5 rounded bg-primary-50 text-primary-dark border border-primary/30 hover:bg-primary-100 font-semibold"
              >
                <CopyCheck className="w-3 h-3" />
                Bu ayarları {sameTypeCount} adet {meta.label} hepsine uygula
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   3D Scene
============================================================ */

interface SceneProps {
  design: { layout: DesignLayoutConfig | null; columns: DesignColumn[]; elements: DesignElement[] };
  parts: SehpaPart[];
  mode: ElementType | null;
  selected: MountPoint[];
  onAnchorClick: (mp: MountPoint) => void;
  showLabels: boolean;
  showBolts: boolean;
  showUnderground: boolean;
  dark: boolean;
  /** Capture request - if set to a positive number, scene captures views and calls onCaptured */
  captureNonce?: number;
  onCaptured?: (data: CapturedViews) => void;
}

export interface CapturedViews {
  iso: string;
  front: string;
  side: string;
  top: string;
}

function DesignerScene({ design, parts, mode, selected, onAnchorClick, showLabels, showBolts, showUnderground, dark, captureNonce, onCaptured }: SceneProps) {
  if (!design.layout) return null;
  const layout = design.layout;
  const isSelected = (mp: MountPoint) => selected.some((s) => isSameMP(s, mp));

  const tableCenter: [number, number, number] = [
    M(layout.frontToBackDistance) / 2,
    M(layout.backColumnHeight) / 2,
    M(((layout.frontColumnCount - 1) * layout.frontSpacing)) / 2,
  ];

  return (
    <Canvas
      shadows
      camera={{ position: [10, 7, 12], fov: 50 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <ambientLight intensity={dark ? 0.4 : 0.6} />
      <directionalLight position={[15, 20, 10]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={[dark ? '#1e293b' : '#bae6fd', '#22c55e', 0.45]} />

      <Suspense fallback={null}>
        <GrassGround dark={dark} transparent={showUnderground} />

        {/* Foundation rendering */}
        {layout.mountType === 'continuous' ? (
          <ContinuousFoundation layout={layout} />
        ) : (
          design.columns.map((col) => (
            <FoundationBlock key={`f-${col.id}`} col={col} layout={layout} />
          ))
        )}

        {/* Columns (showUnderground extends below into foundation/soil) */}
        {design.columns.map((col) => (
          <ColumnMesh key={col.id} col={col} layout={layout} parts={parts} showLabels={showLabels} showUnderground={showUnderground} />
        ))}

        {/* Elements */}
        {design.elements.map((el) => (
          <ElementMesh
            key={el.id}
            el={el}
            design={design}
            parts={parts}
            showLabels={showLabels}
            showBolts={showBolts}
          />
        ))}

{/* Anchor points in placement mode */}
        {mode && (
          <>
            {design.columns.map((col) =>
              ANCHORS_COL.map((a) => {
                const mp: MountPoint = { kind: 'column', columnId: col.id, anchor: a };
                const [x, y, z] = columnAnchorXYZ(col, a, layout);
                return (
                  <AnchorPoint
                    key={`ca-${col.id}-${a}`}
                    position={[x, y, z]}
                    selected={isSelected(mp)}
                    side={col.side}
                    onClick={(e) => { e.stopPropagation(); onAnchorClick(mp); }}
                  />
                );
              })
            )}
            {design.elements.map((el) => {
              const geo = resolveElementGeometry(el, design.columns, design.elements, layout, parts);
              if (!geo) return null;
              return ANCHORS_EL.map((pos) => {
                // Anchor markers along beam physical span (between surface points)
                const wp = new THREE.Vector3().lerpVectors(geo.beamStart, geo.beamEnd, pos);
                const mp: MountPoint = { kind: 'element', elementId: el.id, position: pos };
                return (
                  <AnchorPoint
                    key={`ea-${el.id}-${pos}`}
                    position={[wp.x, wp.y, wp.z]}
                    selected={isSelected(mp)}
                    elementColor={MODE_META[el.type].color}
                    onClick={(e) => { e.stopPropagation(); onAnchorClick(mp); }}
                  />
                );
              });
            })}
          </>
        )}
      </Suspense>

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={3} maxDistance={50} target={tableCenter} />
      <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>
      <CaptureController nonce={captureNonce} onCaptured={onCaptured} center={tableCenter} layout={layout} />
    </Canvas>
  );
}

/* ============================================================
   CaptureController — 4 farklı açıdan ekran görüntüsü alır
============================================================ */

function CaptureController({
  nonce, onCaptured, center, layout,
}: {
  nonce?: number;
  onCaptured?: (data: CapturedViews) => void;
  center: [number, number, number];
  layout: DesignLayoutConfig;
}) {
  const { gl, scene, camera } = useThree();
  const lastNonceRef = useRef(0);

  useEffect(() => {
    if (!nonce || nonce === lastNonceRef.current || !onCaptured) return;
    lastNonceRef.current = nonce;

    // Compute bounding-box-ish size for camera distance
    const rowLen_m = M((layout.frontColumnCount - 1) * layout.frontSpacing) + 2;
    const fbd_m = M(layout.frontToBackDistance) + 2;
    const heightMax_m = M(Math.max(layout.frontColumnHeight, layout.backColumnHeight)) + 1;
    const maxDim = Math.max(rowLen_m, fbd_m, heightMax_m);

    const cx = center[0], cy = center[1], cz = center[2];

    const views: Array<{ name: keyof CapturedViews; pos: [number, number, number]; target: [number, number, number] }> = [
      { name: 'iso',   pos: [cx + maxDim * 1.0, cy + maxDim * 0.8, cz + maxDim * 1.2], target: [cx, cy, cz] },
      { name: 'front', pos: [cx + maxDim * 1.8, cy, cz],                                target: [cx, cy, cz] },  // looking along -X (front)
      { name: 'side',  pos: [cx, cy, cz - maxDim * 2.2],                                target: [cx, cy, cz] },  // looking along +Z (side)
      { name: 'top',   pos: [cx, cy + maxDim * 2.0, cz + 0.001],                        target: [cx, cy, cz] },  // top down
    ];

    // Save original
    const origPos = camera.position.clone();
    const origRot = camera.rotation.clone();

    const results: Partial<CapturedViews> = {};

    (async () => {
      for (const v of views) {
        camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
        camera.lookAt(v.target[0], v.target[1], v.target[2]);
        camera.updateMatrixWorld(true);
        gl.render(scene, camera);
        // Wait one frame so render completes
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        results[v.name] = gl.domElement.toDataURL('image/png');
      }
      // Restore original
      camera.position.copy(origPos);
      camera.rotation.copy(origRot);
      camera.updateMatrixWorld(true);
      gl.render(scene, camera);

      onCaptured(results as CapturedViews);
    })();
  }, [nonce, gl, scene, camera, onCaptured, center, layout]);

  return null;
}

/* ============================================================
   Grass ground
============================================================ */

function GrassGround({ dark = false, transparent = false }: { dark?: boolean; transparent?: boolean }) {
  const groundColor = dark ? '#0f3622' : '#7dc645';
  return (
    <>
      <mesh receiveShadow={!transparent} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color={groundColor}
          roughness={1}
          metalness={0}
          transparent={transparent}
          opacity={transparent ? 0.35 : 1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Grid
        args={[60, 60]}
        cellSize={0.5}
        cellThickness={0.25}
        cellColor={dark ? '#1c5036' : '#6bb83a'}
        sectionSize={5}
        sectionThickness={0.4}
        sectionColor={dark ? '#2a6a48' : '#5aa235'}
        fadeDistance={40}
        fadeStrength={1.4}
        position={[0, 0.002, 0]}
      />
    </>
  );
}

/* ============================================================
   Foundation rendering by mount type
============================================================ */

function ContinuousFoundation({ layout }: { layout: DesignLayoutConfig }) {
  // X dimension: front-back direction. Width covers from front to back columns + margin
  const widthX = M(layout.frontToBackDistance) + M(layout.continuousWidth || 600);
  // Z dimension: along column row + overhang
  const rowLength = M((layout.frontColumnCount - 1) * layout.frontSpacing);
  const overhang = M(layout.continuousDepth || 0) || M(600);
  const depthZ = rowLength + overhang;

  const hBelow = M(layout.continuousBelowGround || 500);
  const hAbove = M(layout.continuousAboveGround || 100);
  const totalH = hBelow + hAbove;
  const centerY = (hAbove - hBelow) / 2;

  // Position center: midX between front (0) and back (frontToBackDistance), centerZ along row
  const centerX = M(layout.frontToBackDistance) / 2;
  const centerZ = rowLength / 2;

  return (
    <mesh position={[centerX, centerY, centerZ]} castShadow receiveShadow>
      <boxGeometry args={[widthX, totalH, depthZ]} />
      <meshStandardMaterial color="#a8a29e" roughness={0.92} metalness={0.05} />
    </mesh>
  );
}

function FoundationBlock({ col, layout }: { col: DesignColumn; layout: DesignLayoutConfig }) {
  const [x, , z] = columnBaseXYZ(col, layout);
  const groundY = columnGroundY(layout);

  if (layout.mountType === 'driven') {
    // Hafif koyu toprak halkası
    return (
      <mesh position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0.04, 0.18, 24]} />
        <meshStandardMaterial color="#3f2e22" roughness={1} />
      </mesh>
    );
  }

  if (layout.mountType === 'drilled') {
    const diameter = M(layout.drillDiameter || 300);
    const depth = M(layout.drillDepth || 1000);
    // Şeffaf beton silindiri — zemin altında
    return (
      <group position={[x, -depth / 2, z]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[diameter / 2, diameter / 2, depth, 24]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.55} roughness={0.9} />
        </mesh>
        {/* Beton üst yüzü (zeminde) — daha opak halka */}
        <mesh position={[0, depth / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, diameter / 2, 24]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  // Formwork (kalıp beton) — dikdörtgen prizma, zemin altında + üstünde olabilir
  const W = M(layout.formworkWidth || 400);
  const D = M(layout.formworkDepth || 400);
  const Hbelow = M(layout.formworkBelowGround || 600);
  const Habove = M(layout.formworkAboveGround || 200);
  const Htotal = Hbelow + Habove;
  // Center at y = (Habove - Hbelow) / 2
  return (
    <mesh position={[x, (Habove - Hbelow) / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[W, Htotal, D]} />
      <meshStandardMaterial color="#a8a29e" roughness={0.95} />
    </mesh>
  );
}

/* ============================================================
   ColumnMesh — extruded profile with rotation
============================================================ */

function ColumnMesh({
  col, layout, parts, showLabels, showUnderground,
}: {
  col: DesignColumn;
  layout: DesignLayoutConfig;
  parts: SehpaPart[];
  showLabels: boolean;
  showUnderground: boolean;
}) {
  const part = findPartByColumnSide(col.side, parts);
  // Kolon toplam uzunluk = yer üstü + (showUnderground ise) gömülü
  const embed = showUnderground ? columnEmbedDepth_m(layout) : 0;
  const totalDepth = M(col.height) + embed;

  const geometry = useMemo(() => {
    const shape = buildProfileShape(
      part?.profileType || 'C',
      part?.edges || [70, 120, 70],
      part?.thickness || 2
    );
    return new THREE.ExtrudeGeometry(shape, { depth: totalDepth, bevelEnabled: false, curveSegments: 2 });
  }, [part?.profileType, part?.edges, part?.thickness, totalDepth]);

  const [x, , z] = columnBaseXYZ(col, layout);
  // Y position: column base at (groundY - embed)
  const y = columnGroundY(layout) - embed;
  // Column basis: Z (local extrude) = world UP. X (local) = world X. Y (local) = world -Z (depth).
  // User rotation = spin around the column axis (world Y).
  const quaternion = useMemo(() => {
    const axis = new THREE.Vector3(0, 1, 0); // world up
    // Default "front face" of column shape points in world +X (toward back row)
    let faceDir = new THREE.Vector3(1, 0, 0);
    const csAngle = ((col.rotation || 0) * Math.PI) / 2;
    if (Math.abs(csAngle) > 1e-6) faceDir.applyAxisAngle(axis, csAngle);
    // Build basis: local X = faceDir, local Y = something perpendicular, local Z = up
    const localY = new THREE.Vector3().crossVectors(axis, faceDir).normalize();
    const m = new THREE.Matrix4().makeBasis(faceDir, localY, axis);
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, [col.rotation]);

  return (
    <group position={[x, y, z]} quaternion={quaternion}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial {...GALVANIZED_MATERIAL} />
      </mesh>
      {showLabels && (
        <Html position={[0, 0, M(col.height) + 0.25]} distanceFactor={11} center>
          <div className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow font-mono">
            {col.side === 'front' ? 'Ön' : 'Arka'}-{col.index}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ============================================================
   ElementMesh — extruded profile with rotation + bolts
============================================================ */

function ElementMesh({
  el, design, parts, showLabels, showBolts,
}: {
  el: DesignElement;
  design: { layout: DesignLayoutConfig | null; columns: DesignColumn[]; elements: DesignElement[] };
  parts: SehpaPart[];
  showLabels: boolean;
  showBolts: boolean;
}) {
  if (!design.layout) return null;
  const geo = resolveElementGeometry(el, design.columns, design.elements, design.layout, parts);
  if (!geo) return null;
  const part = findPartForElement(el, parts);

  const geometry = useMemo(() => {
    const shape = buildProfileShape(
      part?.profileType || 'C',
      part?.edges || [50, 80, 50],
      part?.thickness || 2
    );
    return new THREE.ExtrudeGeometry(shape, { depth: geo.L_m, bevelEnabled: false, curveSegments: 2 });
  }, [part?.profileType, part?.edges, part?.thickness, geo.L_m]);

  // Rotation: build orthonormal basis where:
  //  - Z (local) = extrusion direction = beam axis
  //  - Y (local) = beam "up" — defaults to WORLD UP (or closest valid perpendicular)
  //  - X (local) = Y × Z = beam "right"
  // User rotation = rotate Y around Z by N*90°
  const quaternion = useMemo(() => {
    const axis = geo.axis.clone();
    const worldUp = new THREE.Vector3(0, 1, 0);
    // If axis is nearly vertical, fall back to world Z as "up"
    let beamUp: THREE.Vector3;
    if (Math.abs(axis.dot(worldUp)) > 0.95) {
      const right0 = new THREE.Vector3(1, 0, 0);
      beamUp = new THREE.Vector3().crossVectors(right0, axis).normalize();
    } else {
      const right0 = new THREE.Vector3().crossVectors(axis, worldUp).normalize();
      beamUp = new THREE.Vector3().crossVectors(right0, axis).normalize();
    }
    // Apply user rotation around axis
    const csAngle = ((el.rotation || 0) * Math.PI) / 2;
    if (Math.abs(csAngle) > 1e-6) {
      beamUp.applyAxisAngle(axis, csAngle);
    }
    const beamRight = new THREE.Vector3().crossVectors(beamUp, axis).normalize();
    const m = new THREE.Matrix4().makeBasis(beamRight, beamUp, axis);
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, [geo.axis.x, geo.axis.y, geo.axis.z, el.rotation]);

  return (
    <>
      <group position={geo.beamStart} quaternion={quaternion}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial {...GALVANIZED_MATERIAL} />
        </mesh>
        {showLabels && (
          <Html position={[0, 0.2, geo.L_m / 2]} distanceFactor={12} center>
            <div className="text-[9px] bg-white/90 border border-slate-300 rounded px-1 py-0.5 shadow whitespace-nowrap font-medium" style={{ color: MODE_META[el.type].color }}>
              {MODE_META[el.type].label} · {(geo.L_m * 1000).toFixed(0)}mm
            </div>
          </Html>
        )}
      </group>
      {/* Bolts ONLY at actual join points (where beam crosses its mount supports) */}
      {showBolts && (
        <>
          <BoltAssembly position={geo.boltA} boltAxis={geo.axis} />
          <BoltAssembly position={geo.boltB} boltAxis={geo.axis.clone().negate()} />
        </>
      )}
    </>
  );
}

/* ============================================================
   BoltAssembly — küçük cıvata + somun + rondela
============================================================ */

/**
 * Bolt + washer + nut assembly that passes THROUGH the joint along `boltAxis`.
 * Position = SURFACE mount point (where beam meets column).
 * - Bolt head + outer washer sit on the OUTSIDE of the column (behind, opposite boltAxis)
 * - Bolt shank passes through column and beam end (along +boltAxis)
 * - Inner washer + nut sit inside the beam (along +boltAxis)
 */
function BoltAssembly({ position, boltAxis }: { position: THREE.Vector3; boltAxis: THREE.Vector3 }) {
  // Bolt cylinder default axis is +Y (Three.js); rotate so +Y aligns with boltAxis
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), boltAxis.clone().normalize()),
    [boltAxis.x, boltAxis.y, boltAxis.z]
  );

  const headColor = '#262c36';
  const shankColor = '#5a6470';
  const washerColor = '#a9b3bd';

  // Layout along local +Y:
  //   y = -0.045 → bolt head (outside)
  //   y = -0.035 → outer washer
  //   y =  0    → through-column area (shank)
  //   y = +0.025 → inner washer
  //   y = +0.040 → nut

  return (
    <group position={position} quaternion={quat}>
      {/* Bolt head (hex, outside) */}
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.012, 6]} />
        <meshStandardMaterial color={headColor} metalness={0.75} roughness={0.4} />
      </mesh>
      {/* Outer washer */}
      <mesh position={[0, -0.036, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.0025, 24]} />
        <meshStandardMaterial color={washerColor} metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Shank (long bolt through both joint surfaces) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.09, 16]} />
        <meshStandardMaterial color={shankColor} metalness={0.7} roughness={0.45} />
      </mesh>
      {/* Inner washer */}
      <mesh position={[0, 0.036, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.0025, 24]} />
        <meshStandardMaterial color={washerColor} metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Nut (hex, inside) */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.012, 6]} />
        <meshStandardMaterial color={headColor} metalness={0.75} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ============================================================
   Anchor point
============================================================ */

function AnchorPoint({ position, selected, side, elementColor, onClick }: {
  position: [number, number, number];
  selected: boolean;
  side?: ColumnSide;
  elementColor?: string;
  onClick: (e: any) => void;
}) {
  const color = selected ? '#22c55e' : elementColor ? '#a855f7' : side === 'front' ? '#fbbf24' : '#f87171';
  return (
    <group position={position}>
      <mesh onClick={onClick} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = 'default')}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[selected ? 0.11 : 0.075, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.8 : 0.5} metalness={0.2} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ============================================================
   Layout Wizard
============================================================ */

function LayoutWizardModal({
  open, onClose, initial, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: DesignLayoutConfig;
  onSubmit: (cfg: DesignLayoutConfig) => void;
}) {
  const [form, setForm] = useState<DesignLayoutConfig>(initial);
  useEffect(() => { if (open) setForm(initial); }, [open, initial]);

  function num(k: keyof DesignLayoutConfig, v: string) {
    setForm((f) => ({ ...f, [k]: parseFloat(v) || 0 } as any));
  }
  function intNum(k: keyof DesignLayoutConfig, v: string) {
    setForm((f) => ({ ...f, [k]: parseInt(v) || 0 } as any));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers3 className="w-5 h-5 text-primary" />Kolonları Yerleştir
          </DialogTitle>
          <DialogDescription>
            Kolon sayısı, mesafeler, kolon yer üstü yüksekliği, montaj tipi ve kesit rotasyonu.
          </DialogDescription>
        </DialogHeader>

        {/* Geometri */}
        <fieldset className="border border-slate-200 rounded-lg p-3">
          <legend className="text-xs font-bold text-slate-600 px-1.5">Geometri</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
            <div className="space-y-1.5">
              <Label>Ön Kolon Sayısı (her sırada)</Label>
              <Input type="number" min={1} max={20} value={form.frontColumnCount} onChange={(e) => intNum('frontColumnCount', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ön Kolonlar Arası (mm)</Label>
              <Input type="number" min={100} value={form.frontSpacing} onChange={(e) => num('frontSpacing', e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Ön - Arka Sıra Arası (mm)</Label>
              <Input type="number" min={100} value={form.frontToBackDistance} onChange={(e) => num('frontToBackDistance', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ön Kolon Yer Üstü Yüksekliği (mm)</Label>
              <Input type="number" min={100} value={form.frontColumnHeight} onChange={(e) => num('frontColumnHeight', e.target.value)} />
              <p className="text-[10px] text-slate-500">Sadece zemin üstünde görünen kısım</p>
            </div>
            <div className="space-y-1.5">
              <Label>Arka Kolon Yer Üstü Yüksekliği (mm)</Label>
              <Input type="number" min={100} value={form.backColumnHeight} onChange={(e) => num('backColumnHeight', e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* Mount type */}
        <fieldset className="border border-slate-200 rounded-lg p-3">
          <legend className="text-xs font-bold text-slate-600 px-1.5">Montaj Tipi (Temel)</legend>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
            {(['continuous', 'drilled', 'driven', 'formwork'] as MountType[]).map((mt) => {
              const meta = MOUNT_TYPE_META[mt];
              const Icon = meta.icon;
              const active = form.mountType === mt;
              return (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setForm({ ...form, mountType: mt })}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-center transition-all',
                    active ? 'border-primary bg-primary-50 text-primary-dark shadow-sm' : 'border-slate-200 bg-white hover:border-primary/40'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-semibold">{meta.label}</span>
                  <span className="text-[9px] text-slate-500 leading-tight">{meta.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Conditional fields */}
          {form.mountType === 'continuous' && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label>Sömel Eni (mm)</Label>
                <Input type="number" min={200} value={form.continuousWidth || 600} onChange={(e) => num('continuousWidth', e.target.value)} />
                <p className="text-[10px] text-slate-500">Ön-arka yön (kolon sırasına dik)</p>
              </div>
              <div className="space-y-1.5">
                <Label>Sıra Boyu Taşma (mm)</Label>
                <Input type="number" min={0} value={form.continuousDepth || 600} onChange={(e) => num('continuousDepth', e.target.value)} />
                <p className="text-[10px] text-slate-500">İlk/son kolondan dışa</p>
              </div>
              <div className="space-y-1.5">
                <Label>Zemin Altı Yükseklik (mm)</Label>
                <Input type="number" min={0} value={form.continuousBelowGround || 500} onChange={(e) => num('continuousBelowGround', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Zemin Üstü Yükseklik (mm)</Label>
                <Input type="number" min={0} value={form.continuousAboveGround || 100} onChange={(e) => num('continuousAboveGround', e.target.value)} />
                <p className="text-[10px] text-slate-500">Kolon bunun üstünde başlar</p>
              </div>
            </div>
          )}

          {form.mountType === 'drilled' && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label>Delgi Çapı (mm)</Label>
                <Input type="number" min={50} value={form.drillDiameter || 300} onChange={(e) => num('drillDiameter', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Delgi Derinliği (mm)</Label>
                <Input type="number" min={100} value={form.drillDepth || 1000} onChange={(e) => num('drillDepth', e.target.value)} />
              </div>
            </div>
          )}

          {form.mountType === 'driven' && (
            <div className="grid grid-cols-1 gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label>Çakma Derinliği (mm)</Label>
                <Input type="number" min={100} value={form.drivenDepth || 1500} onChange={(e) => num('drivenDepth', e.target.value)} />
                <p className="text-[10px] text-slate-500">Kolonun zemin altına çakılma derinliği</p>
              </div>
            </div>
          )}

          {form.mountType === 'formwork' && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label>Kalıp Eni (mm)</Label>
                <Input type="number" min={100} value={form.formworkWidth || 400} onChange={(e) => num('formworkWidth', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Kalıp Boyu (mm)</Label>
                <Input type="number" min={100} value={form.formworkDepth || 400} onChange={(e) => num('formworkDepth', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Zemin Altı Yükseklik (mm)</Label>
                <Input type="number" min={0} value={form.formworkBelowGround || 600} onChange={(e) => num('formworkBelowGround', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Zemin Üstü Yükseklik (mm)</Label>
                <Input type="number" min={0} value={form.formworkAboveGround || 200} onChange={(e) => num('formworkAboveGround', e.target.value)} />
                <p className="text-[10px] text-slate-500">Kolon bunun üstünde başlar</p>
              </div>
            </div>
          )}
        </fieldset>

        {/* Rotation */}
        <fieldset className="border border-slate-200 rounded-lg p-3">
          <legend className="text-xs font-bold text-slate-600 px-1.5">Kolon Kesit Rotasyonu</legend>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div>
              <Label>Ön Kolonlar</Label>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2, 3].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, frontRotation: r })}
                    className={cn(
                      'flex-1 py-1.5 rounded border text-[11px] font-mono font-bold',
                      (form.frontRotation || 0) === r ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600'
                    )}
                  >
                    {r * 90}°
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Arka Kolonlar</Label>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2, 3].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, backRotation: r })}
                    className={cn(
                      'flex-1 py-1.5 rounded border text-[11px] font-mono font-bold',
                      (form.backRotation || 0) === r ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600'
                    )}
                  >
                    {r * 90}°
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            C profilse açıklığın nereye bakacağını belirler. Tipik: ön kolonlar arkaya, arka kolonlar öne bakar.
          </p>
        </fieldset>

        <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-slate-600">Toplam Kolon</p>
            <p className="font-bold text-primary-dark text-base">{form.frontColumnCount * 2}</p>
          </div>
          <div>
            <p className="text-slate-600">Sıra Genişliği</p>
            <p className="font-bold text-primary-dark text-base">{((form.frontColumnCount - 1) * form.frontSpacing).toLocaleString('tr-TR')} mm</p>
          </div>
          <div>
            <p className="text-slate-600">Montaj</p>
            <p className="font-bold text-primary-dark text-base">{MOUNT_TYPE_META[form.mountType].label}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={() => onSubmit(form)}>
            <Plus className="w-4 h-4" />Uygula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
