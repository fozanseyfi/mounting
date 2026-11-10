/**
 * Paylaşım linki — proje verisi linkin içinde taşınır (Fizibilite platformu ile aynı yöntem).
 *
 * Projeler şimdilik kullanıcının tarayıcısında duruyor; linki başka cihazda açan kişi o
 * veriye ulaşamaz. Bu yüzden link, oluşturulduğu andaki projeyi sıkıştırılmış olarak `#`
 * sonrasında taşır (bu kısım sunucuya hiç gönderilmez). /p sayfası raporu bundan üretir.
 * Supabase'e geçince link yalnızca bir kimlik taşıyacak; iptal de gerçek olacak.
 */
import type { Project } from '@/types';

export interface SharePayload {
  v: 1;
  /** Proje (hesaplanmış toplamlarıyla) */
  p: Project;
  /** Paylaşan kişi */
  by?: string;
  /** Oluşturma (ISO) */
  c: string;
  /** Son geçerlilik (YYYY-MM-DD) — yoksa süresiz */
  e?: string;
}

function toB64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

/** Maliyet paylaşılmayacaksa fiyat ve maliyet bilgisini çıkarır */
export function shareableProject(project: Project, includeCost: boolean): Project {
  const p = JSON.parse(JSON.stringify(project)) as Project;
  if (!includeCost) {
    p.pricing = null;
    delete p.cost;
  }
  return p;
}

export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  return toB64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

export async function decodeShare(code: string): Promise<SharePayload | null> {
  try {
    const raw = await pipe(fromB64Url(code.trim()), new DecompressionStream('deflate-raw'));
    const p = JSON.parse(new TextDecoder().decode(raw)) as SharePayload;
    if (p?.v !== 1 || !p.p || typeof p.p.name !== 'string' || !Array.isArray(p.p.tableTypes) || !p.p.totals) return null;
    return p;
  } catch {
    return null;
  }
}

export const shareUrl = (code: string) => `${window.location.origin}/p#${code}`;

export function isShareExpired(e?: string | null, now = new Date()): boolean {
  if (!e) return false;
  // Son geçerlilik günü dahil
  return now.toISOString().slice(0, 10) > e;
}
