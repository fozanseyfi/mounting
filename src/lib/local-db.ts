/**
 * Yerel mod veritabanı — DATABASE_URL tanımlı değilken projeler tarayıcının
 * localStorage'ında tutulur. Kayıtlar Prisma satırlarıyla aynı şekildedir;
 * böylece sayfalar ve projectMapper hiç değişmeden çalışır.
 *
 * `handleLocalApi` /api/projects/* ve /api/catalog route'larının birebir
 * karşılığıdır; LocalApiShim tarayıcıdaki fetch çağrılarını buraya yönlendirir.
 * Supabase eklendiğinde bu katman devre dışı kalır.
 */

import { calculatePart } from '@/lib/calculations/profiles';
import { calculateFastenerTotal } from '@/lib/calculations/totals';
import { mapProject, mapTableType, mapSehpaPart, mapFastener } from '@/lib/projectMapper';
import { STANDARD_PARTS } from '@/lib/constants/standard-parts';
import { DIN_CATALOG } from '@/lib/constants/din-catalog';
import type { ProfileType } from '@/types';

const STORAGE_KEY = 'solar-bom.local-db.v1';
export const LOCAL_DB_EVENT = 'localdb:changed';

export interface RawPart {
  id: string;
  tableTypeId: string;
  code: string;
  name: string;
  profileType: string;
  thickness: number;
  edgesJson: string;
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
  order: number;
}

export interface RawFastener {
  id: string;
  tableTypeId: string;
  universalCode: string;
  detail: string;
  size: string;
  length: string | null;
  grade: string;
  unitWeight: number;
  quantityPerTable: number;
  spareRatio: number;
  totalWeightPerTable: number;
  source: string;
  order: number;
}

export interface RawTableType {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  panelsPerTable: number;
  tableCount: number;
  order: number;
  parts: RawPart[];
  fasteners: RawFastener[];
}

export interface RawPricing {
  id: string;
  projectId: string;
  steelPricePerKg: number;
  galvanizingPricePerKg: number;
  bendLaborPerKg: number;
  fastenerPricePerKg: number;
  transportationFlat: number;
  otherCosts: number;
  currency: string;
  notes: string | null;
  updatedAt: string;
}

export interface RawProject {
  id: string;
  name: string;
  customer: string | null;
  location: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  panelWattage: number;
  tiltAngle: number;
  status: string;
  totalsJson: string | null;
  tableTypes: RawTableType[];
  pricing: RawPricing | null;
}

export interface RawCustomFastener {
  id: string;
  universalCode: string;
  detail: string;
  size: string;
  length: string | null;
  grade: string;
  unitWeight: number;
  createdAt: string;
}

interface LocalDb {
  projects: RawProject[];
  customFasteners: RawCustomFastener[];
}

/* ---------------- storage ---------------- */

function load(): LocalDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw) as LocalDb;
      return { projects: db.projects ?? [], customFasteners: db.customFasteners ?? [] };
    }
  } catch {}
  return { projects: [], customFasteners: [] };
}

function save(db: LocalDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent(LOCAL_DB_EVENT));
}

function id(): string {
  return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

const now = () => new Date().toISOString();

/* ---------------- okuma (sayfalar için) ---------------- */

/** Projeler, updatedAt'e göre yeniden eskiye. Prisma satırı şeklinde döner. */
export function listRawProjects(): RawProject[] {
  return [...load().projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getRawProject(projectId: string): RawProject | null {
  return load().projects.find((p) => p.id === projectId) ?? null;
}

export function listCustomFasteners(): RawCustomFastener[] {
  return [...load().customFasteners].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------------- API karşılığı ---------------- */

export interface LocalResponse {
  status: number;
  body: unknown;
}

const ok = (body: unknown, status = 200): LocalResponse => ({ status, body });
const notFound = (msg = 'Bulunamadı'): LocalResponse => ({ status: 404, body: { error: msg } });

// Prisma'nın Date nesneleri yerine ISO string tutuyoruz; mapper bunlara dokunmuyor.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asPrisma = (x: unknown) => x as any;

function partData(body: Record<string, unknown>) {
  const edges: number[] = Array.isArray(body.edges) ? body.edges.map((n: unknown) => Number(n) || 0) : [];
  const profileType = ((body.profileType as ProfileType) || 'C') as ProfileType;
  const thickness = Number(body.thickness) || 0;
  const length = Number(body.length) || 0;
  const quantityPerTable = parseInt(String(body.quantityPerTable)) || 1;
  const spareRatio = Number(body.spareRatio) || 0;
  const calc = calculatePart({
    profileType,
    thickness,
    edges,
    length,
    quantityPerTable,
    spareRatio,
    bendAllowance: body.bendAllowance !== undefined ? Number(body.bendAllowance) : undefined,
  });
  return {
    profileType,
    thickness,
    edgesJson: JSON.stringify(edges),
    bendCount: calc.bendCount,
    bendAllowance: calc.bendAllowance,
    developedWidth: calc.developedWidth,
    length,
    quantityPerTable,
    spareRatio,
    unitWeight: calc.unitWeight,
    totalWeightPerTable: calc.totalWeightPerTable,
    surfaceArea: calc.surfaceArea,
    galvanizingWeight: calc.galvanizingWeight,
  };
}

function fastenerData(body: Record<string, unknown>) {
  const unitWeight = Number(body.unitWeight) || 0;
  const quantityPerTable = parseInt(String(body.quantityPerTable)) || 1;
  const spareRatio = Number(body.spareRatio) || 0;
  return {
    universalCode: String(body.universalCode ?? ''),
    detail: String(body.detail ?? ''),
    size: String(body.size ?? ''),
    length: (body.length as string) || null,
    grade: String(body.grade ?? ''),
    unitWeight,
    quantityPerTable,
    spareRatio,
    totalWeightPerTable: calculateFastenerTotal({ unitWeight, quantityPerTable, spareRatio }),
    source: body.source === 'MANUAL' ? 'MANUAL' : 'CATALOG',
  };
}

const PRICING_NUM = [
  'steelPricePerKg',
  'galvanizingPricePerKg',
  'bendLaborPerKg',
  'fastenerPricePerKg',
  'transportationFlat',
  'otherCosts',
] as const;

/**
 * path: "/api/projects/..." (query string olmadan). body: JSON gövdesi.
 * Eşleşmeyen yol için null döner (istek gerçek ağa gider).
 */
export function handleLocalApi(method: string, path: string, body: Record<string, unknown> = {}): LocalResponse | null {
  const seg = path.replace(/^\/api\//, '').replace(/\/$/, '').split('/');
  const m = method.toUpperCase();

  // /api/catalog
  if (seg[0] === 'catalog' && seg.length === 1 && m === 'GET') {
    return ok({
      catalog: DIN_CATALOG.map((c) => ({ ...c, custom: false })),
      custom: listCustomFasteners().map((c) => ({
        code: c.universalCode,
        detail: c.detail,
        size: c.size,
        length: c.length || undefined,
        grade: c.grade,
        weight: c.unitWeight,
        custom: true,
      })),
    });
  }

  if (seg[0] !== 'projects') return null;
  const db = load();

  // /api/projects
  if (seg.length === 1) {
    if (m === 'GET') return ok(listRawProjects().map((p) => mapProject(asPrisma(p))));
    if (m === 'POST') {
      const t = now();
      const project: RawProject = {
        id: id(),
        name: String(body.name ?? ''),
        customer: (body.customer as string) || null,
        location: (body.location as string) || null,
        description: (body.description as string) || null,
        createdAt: t,
        updatedAt: t,
        panelWattage: Number(body.panelWattage) || 580,
        tiltAngle: Number(body.tiltAngle) || 25,
        status: (body.status as string) || 'DRAFT',
        totalsJson: null,
        tableTypes: [],
        pricing: null,
      };
      db.projects.push(project);
      save(db);
      return ok(mapProject(asPrisma(project)), 201);
    }
    return null;
  }

  const project = db.projects.find((p) => p.id === seg[1]);
  const touch = () => {
    if (project) project.updatedAt = now();
  };

  // /api/projects/:id
  if (seg.length === 2) {
    if (!project) return notFound();
    if (m === 'GET') return ok(mapProject(asPrisma(project)));
    if (m === 'PUT') {
      for (const f of ['name', 'customer', 'location', 'description', 'status'] as const) {
        if (body[f] !== undefined) (project as unknown as Record<string, unknown>)[f] = body[f];
      }
      for (const f of ['panelWattage', 'tiltAngle'] as const) {
        if (body[f] !== undefined) project[f] = Number(body[f]);
      }
      touch();
      save(db);
      return ok(mapProject(asPrisma(project)));
    }
    if (m === 'DELETE') {
      db.projects = db.projects.filter((p) => p.id !== project.id);
      save(db);
      return ok({ ok: true });
    }
    return null;
  }

  if (!project) return notFound('Proje bulunamadı');

  // /api/projects/:id/pricing
  if (seg[2] === 'pricing' && seg.length === 3) {
    if (m === 'GET') return ok(project.pricing);
    if (m === 'PUT') {
      const pricing: RawPricing = {
        id: project.pricing?.id ?? id(),
        projectId: project.id,
        steelPricePerKg: 0,
        galvanizingPricePerKg: 0,
        bendLaborPerKg: 0,
        fastenerPricePerKg: 0,
        transportationFlat: 0,
        otherCosts: 0,
        currency: (body.currency as string) || 'TRY',
        notes: (body.notes as string) ?? null,
        updatedAt: now(),
      };
      for (const k of PRICING_NUM) pricing[k] = Number(body[k]) || 0;
      project.pricing = pricing;
      touch();
      save(db);
      return ok(pricing);
    }
    return null;
  }

  if (seg[2] !== 'table-types') return null;

  // /api/projects/:id/table-types
  if (seg.length === 3) {
    if (m !== 'POST') return null;
    const count = project.tableTypes.length;
    const tt: RawTableType = {
      id: id(),
      projectId: project.id,
      name: (body.name as string) || `Tip-${count + 1}`,
      description: (body.description as string) || null,
      panelsPerTable: parseInt(String(body.panelsPerTable)) || 28,
      tableCount: parseInt(String(body.tableCount)) || 1,
      order: count,
      parts: [],
      fasteners: [],
    };
    tt.parts = STANDARD_PARTS.map((sp, i) => ({
      id: id(),
      tableTypeId: tt.id,
      code: sp.code,
      name: sp.name,
      profileType: 'C',
      thickness: 0,
      edgesJson: '[]',
      bendCount: 0,
      bendAllowance: 0,
      developedWidth: 0,
      length: 0,
      quantityPerTable: 0,
      spareRatio: 2,
      unitWeight: 0,
      totalWeightPerTable: 0,
      surfaceArea: 0,
      galvanizingWeight: 0,
      order: i,
    }));
    project.tableTypes.push(tt);
    touch();
    save(db);
    return ok(mapTableType(asPrisma(tt), project.panelWattage), 201);
  }

  const tt = project.tableTypes.find((t) => t.id === seg[3]);
  if (!tt) return notFound('Masa tipi bulunamadı');

  // /api/projects/:id/table-types/:typeId
  if (seg.length === 4) {
    if (m === 'PUT') {
      if (body.name !== undefined) tt.name = String(body.name);
      if (body.description !== undefined) tt.description = (body.description as string) || null;
      if (body.panelsPerTable !== undefined) tt.panelsPerTable = parseInt(String(body.panelsPerTable)) || 0;
      if (body.tableCount !== undefined) tt.tableCount = parseInt(String(body.tableCount)) || 0;
      touch();
      save(db);
      return ok(mapTableType(asPrisma(tt), project.panelWattage));
    }
    if (m === 'DELETE') {
      project.tableTypes = project.tableTypes.filter((t) => t.id !== tt.id);
      touch();
      save(db);
      return ok({ ok: true });
    }
    return null;
  }

  // /parts, /parts/:partId
  if (seg[4] === 'parts') {
    if (seg.length === 5 && m === 'POST') {
      const count = tt.parts.length;
      const part: RawPart = {
        id: id(),
        tableTypeId: tt.id,
        code: (body.code as string) || `P${count + 1}`,
        name: (body.name as string) || 'Parça',
        ...partData(body),
        order: count,
      };
      tt.parts.push(part);
      touch();
      save(db);
      return ok(mapSehpaPart(asPrisma(part)), 201);
    }
    if (seg.length === 6) {
      const idx = tt.parts.findIndex((p) => p.id === seg[5]);
      if (idx < 0) return notFound('Parça bulunamadı');
      if (m === 'PUT') {
        const prev = tt.parts[idx];
        tt.parts[idx] = {
          ...prev,
          code: body.code !== undefined ? String(body.code) : prev.code,
          name: body.name !== undefined ? String(body.name) : prev.name,
          ...partData(body),
        };
        touch();
        save(db);
        return ok(mapSehpaPart(asPrisma(tt.parts[idx])));
      }
      if (m === 'DELETE') {
        tt.parts.splice(idx, 1);
        touch();
        save(db);
        return ok({ ok: true });
      }
    }
    return null;
  }

  // /fasteners, /fasteners/:fastenerId
  if (seg[4] === 'fasteners') {
    if (seg.length === 5 && m === 'POST') {
      const data = fastenerData(body);
      const fastener: RawFastener = { id: id(), tableTypeId: tt.id, ...data, order: tt.fasteners.length };
      tt.fasteners.push(fastener);
      if (body.saveToLibrary && body.source === 'MANUAL') {
        db.customFasteners.push({
          id: id(),
          universalCode: data.universalCode,
          detail: data.detail,
          size: data.size,
          length: data.length,
          grade: data.grade,
          unitWeight: data.unitWeight,
          createdAt: now(),
        });
      }
      touch();
      save(db);
      return ok(mapFastener(asPrisma(fastener)), 201);
    }
    if (seg.length === 6) {
      const idx = tt.fasteners.findIndex((f) => f.id === seg[5]);
      if (idx < 0) return notFound('Bağlantı elemanı bulunamadı');
      if (m === 'PUT') {
        tt.fasteners[idx] = { ...tt.fasteners[idx], ...fastenerData(body) };
        touch();
        save(db);
        return ok(mapFastener(asPrisma(tt.fasteners[idx])));
      }
      if (m === 'DELETE') {
        tt.fasteners.splice(idx, 1);
        touch();
        save(db);
        return ok({ ok: true });
      }
    }
    return null;
  }

  return null;
}
