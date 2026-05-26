/**
 * Profil kesit (cross-section) jeneratörü — Three.js Shape üretir.
 * Tüm koordinatlar METRE cinsinden, kesit (0,0) etrafında ortalanır.
 * Sonra ExtrudeGeometry ile uzunluk boyunca çekilerek 3D profil oluşturulur.
 */
import * as THREE from 'three';

type Pt = [number, number];

const TO_M = 1 / 1000;

/** Bir poligon noktasını koleksiyonu alıp, bounding-box'ı (0,0) merkezde toplayan Shape üretir. */
function makeShape(pointsMM: Pt[]): THREE.Shape {
  if (pointsMM.length < 3) return new THREE.Shape();
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of pointsMM) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const shape = new THREE.Shape();
  const first = pointsMM[0];
  shape.moveTo((first[0] - cx) * TO_M, (first[1] - cy) * TO_M);
  for (let i = 1; i < pointsMM.length; i++) {
    shape.lineTo((pointsMM[i][0] - cx) * TO_M, (pointsMM[i][1] - cy) * TO_M);
  }
  shape.closePath();
  return shape;
}

/* ------------------------------------------------------------------ */
/*  Profil kesit fonksiyonları                                        */
/* ------------------------------------------------------------------ */

// C profil — sağa açılır (open right)
// edges: [a (top flange), b (web), c (bottom flange)]
function cShape(edges: number[], t: number): THREE.Shape {
  const a = edges[0] ?? 70;
  const b = edges[1] ?? 120;
  const c = edges[2] ?? 70;
  return makeShape([
    [0, 0],
    [c, 0],
    [c, t],
    [t, t],
    [t, b - t],
    [a, b - t],
    [a, b],
    [0, b],
  ]);
}

// C profil lipli — uç bükümler içeri doğru
// edges: [a (top lip), b (top flange), c (web), d (bottom flange), e (bottom lip)]
function cLipShape(edges: number[], t: number): THREE.Shape {
  const a = edges[0] ?? 25; // top lip
  const b = edges[1] ?? 50; // top flange
  const c = edges[2] ?? 120; // web
  const d = edges[3] ?? 50; // bottom flange
  const e = edges[4] ?? 25; // bottom lip

  // Outer contour clockwise, starting bottom-left (web outside)
  return makeShape([
    [0, 0],
    [d, 0],
    [d, t],
    [d - t, t],
    [d - t, e],
    [d - 2 * t, e],
    [d - 2 * t, t + t],
    [t, t + t],
    [t, c - t - t],
    [b - 2 * t, c - t - t],
    [b - 2 * t, c - a],
    [b - t, c - a],
    [b - t, c - t],
    [b, c - t],
    [b, c],
    [0, c],
  ]);
}

// U profil — yukarı açılır
// edges: [a (left flange), b (bottom web), c (right flange)]
function uShape(edges: number[], t: number): THREE.Shape {
  const a = edges[0] ?? 70;
  const b = edges[1] ?? 100;
  const c = edges[2] ?? 70;
  return makeShape([
    [0, 0],
    [b, 0],
    [b, c],
    [b - t, c],
    [b - t, t],
    [t, t],
    [t, a],
    [0, a],
  ]);
}

// Z profil
// edges: [a (top flange), b (web), c (bottom flange)]
function zShape(edges: number[], t: number): THREE.Shape {
  const a = edges[0] ?? 70;
  const b = edges[1] ?? 120;
  const c = edges[2] ?? 70;
  // Top flange extends to the left (-a), web vertical, bottom flange extends right (+c)
  return makeShape([
    [-a, b],
    [-a, b - t],
    [-t, b - t],
    [-t, t],
    [c, t],
    [c, 0],
    [0, 0],
    [0, b],
  ]);
}

// L profil (köşe / L-corner)
// edges: [a (vertical leg), b (horizontal leg)]
function lShape(edges: number[], t: number): THREE.Shape {
  const a = edges[0] ?? 60;
  const b = edges[1] ?? 60;
  return makeShape([
    [0, 0],
    [b, 0],
    [b, t],
    [t, t],
    [t, a],
    [0, a],
  ]);
}

// I profil (IPE — dar flanş)
// edges: [a (top flange width), b (web height), c (bottom flange width)]
function iShape(edges: number[], t: number): THREE.Shape {
  const a = edges[0] ?? 80;
  const b = edges[1] ?? 200;
  const c = edges[2] ?? 80;
  const flangeT = Math.max(t * 1.4, 4); // flanş daha kalın
  const webT = t;
  const W = Math.max(a, c);
  const H = b + 2 * flangeT;
  // Build via center-x = W/2
  const cx = W / 2;
  const ca = (W - a) / 2;
  const cc = (W - c) / 2;
  return makeShape([
    [ca, H - flangeT],
    [ca, H],
    [ca + a, H],
    [ca + a, H - flangeT],
    [cx + webT / 2, H - flangeT],
    [cx + webT / 2, flangeT],
    [cc + c, flangeT],
    [cc + c, 0],
    [cc, 0],
    [cc, flangeT],
    [cx - webT / 2, flangeT],
    [cx - webT / 2, H - flangeT],
  ]);
}

// H profil (HEA/HEB — geniş flanş)
function hShape(edges: number[], t: number): THREE.Shape {
  const a = edges[0] ?? 120;
  const b = edges[1] ?? 120;
  const c = edges[2] ?? 120;
  const flangeT = Math.max(t * 1.6, 6);
  const webT = t * 1.2;
  const W = Math.max(a, c);
  const H = b + 2 * flangeT;
  const cx = W / 2;
  const ca = (W - a) / 2;
  const cc = (W - c) / 2;
  return makeShape([
    [ca, H - flangeT],
    [ca, H],
    [ca + a, H],
    [ca + a, H - flangeT],
    [cx + webT / 2, H - flangeT],
    [cx + webT / 2, flangeT],
    [cc + c, flangeT],
    [cc + c, 0],
    [cc, 0],
    [cc, flangeT],
    [cx - webT / 2, flangeT],
    [cx - webT / 2, H - flangeT],
  ]);
}

// Sigma Σ — polyline'a göre yaklaşık
function sigmaShape(edges: number[], t: number): THREE.Shape {
  // 7 segment polyline (a-b-c-d-e-f-g) → kabaca kapalı şekil
  const sizes = edges.length === 7 ? edges : [40, 30, 15, 60, 15, 30, 40];
  // Sigma yatay yönde uzar
  const [a, b, c, d, e, f, g] = sizes;
  const W = Math.max(a, g);
  const H = b + c + d + e + f;
  // Approximate: build a thick polyline outline
  // For simplicity, return a rectangle bounding box with thickness markers
  return makeShape([
    [0, 0],
    [g, 0],
    [g, b],
    [g - c, b],
    [g - c, b + d],
    [g - c + e, b + d],
    [g - c + e, b + d + f],
    [W, b + d + f],
    [W, H],
    [0, H],
  ]);
}

// Omega Ω — şapka şekli
function omegaShape(edges: number[], t: number): THREE.Shape {
  const a = edges[0] ?? 40; // left brim
  const b = edges[1] ?? 60; // left web
  const c = edges[2] ?? 80; // top
  const d = edges[3] ?? 60; // right web
  const e = edges[4] ?? 40; // right brim
  const W = a + c + e;
  const H = Math.max(b, d) + t;
  return makeShape([
    [0, 0],
    [a, 0],
    [a, b - t],
    [a + t, b - t],
    [a + t, b],
    [a + c - t, b],
    [a + c - t, d - t],
    [a + c, d - t],
    [a + c, 0],
    [W, 0],
    [W, t],
    [a + c - t, t],
    [a + c - t, d - 2 * t],
    [a + t, d - 2 * t],
    [a + t, t],
    [0, t],
  ]);
}

// Fallback — basit dikdörtgen
function fallbackShape(edges: number[], t: number): THREE.Shape {
  const w = (edges[0] || 80);
  const h = (edges[1] || 80);
  return makeShape([
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ]);
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export function buildProfileShape(
  profileType: string | undefined,
  edges: number[] = [],
  thickness: number = 2
): THREE.Shape {
  switch (profileType) {
    case 'C':
      return cShape(edges, thickness);
    case 'C_LIP':
      return cLipShape(edges, thickness);
    case 'U':
      return uShape(edges, thickness);
    case 'Z':
      return zShape(edges, thickness);
    case 'L':
      return lShape(edges, thickness);
    case 'I':
      return iShape(edges, thickness);
    case 'H':
      return hShape(edges, thickness);
    case 'SIGMA':
      return sigmaShape(edges, thickness);
    case 'OMEGA':
      return omegaShape(edges, thickness);
    case 'CUSTOM':
    default:
      return fallbackShape(edges, thickness);
  }
}

/** Galvanized steel rengi — açık gri, gümüşi, galvanizlenmiş gibi */
export const GALVANIZED_COLOR = '#dde2e8';
export const GALVANIZED_MATERIAL = {
  color: GALVANIZED_COLOR,
  metalness: 0.7,
  roughness: 0.35,
};
