'use client';

import { ProfileType } from '@/types';

interface Props {
  type: ProfileType;
  edges: number[];
  className?: string;
  /** Highlighted edge index (hover state) — drawn brighter */
  highlightIndex?: number | null;
}

const PROFILE_FILL = '#94a3b8';
const PROFILE_FILL_HIGHLIGHT = '#FB923C';
const PROFILE_STROKE = '#334155';
const DIM_LINE = '#1e293b';
const LETTER_BG = '#FFFFFF';
const LETTER_BORDER = '#1F5E33';

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];

export function getEdgeLetter(i: number) {
  return LETTERS[i] || `e${i + 1}`;
}

/**
 * SVG profile illustration with labeled edges (a, b, c...) — engineering drawing style.
 * Geometry is schematic, not to scale.
 */
export function ProfileShape({ type, edges, className = '', highlightIndex = null }: Props) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-2 ${className}`}>
      <svg viewBox="0 0 400 280" className="w-full h-56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={DIM_LINE} />
          </marker>
        </defs>
        {renderProfile(type, edges, highlightIndex)}
      </svg>
    </div>
  );
}

function renderProfile(type: ProfileType, edges: number[], hi: number | null) {
  switch (type) {
    case 'C': return <CProfile edges={edges} hi={hi} />;
    case 'C_LIP': return <CLipProfile edges={edges} hi={hi} />;
    case 'U': return <UProfile edges={edges} hi={hi} />;
    case 'Z': return <ZProfile edges={edges} hi={hi} />;
    case 'L': return <LProfile edges={edges} hi={hi} />;
    case 'SIGMA': return <SigmaProfile edges={edges} hi={hi} />;
    case 'OMEGA': return <OmegaProfile edges={edges} hi={hi} />;
    case 'I': return <IProfile edges={edges} hi={hi} />;
    case 'H': return <HProfile edges={edges} hi={hi} />;
    case 'CUSTOM':
    default: return <CustomProfile edges={edges} hi={hi} />;
  }
}

// ============== HELPERS ==============

/** Small floating letter label (e.g. "a", "b") with optional value */
function Letter({ x, y, letter, value, side = 'auto' }: { x: number; y: number; letter: string; value?: number; side?: 'left' | 'right' | 'top' | 'bottom' | 'auto' }) {
  const showValue = value !== undefined && value > 0;
  const w = showValue ? 38 : 18;
  const h = showValue ? 16 : 16;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill={LETTER_BG} stroke={LETTER_BORDER} strokeWidth={0.8} />
      <text x={x - (showValue ? w / 2 - 8 : 0)} y={y + 4} textAnchor={showValue ? 'start' : 'middle'} fontSize={10} fontFamily="ui-sans-serif, system-ui" fontWeight={700} fill={LETTER_BORDER}>
        {letter}
      </text>
      {showValue && (
        <text x={x + w / 2 - 2} y={y + 4} textAnchor="end" fontSize={9} fontFamily="ui-monospace, monospace" fill="#475569">
          {value}
        </text>
      )}
    </g>
  );
}

/** Engineering-style horizontal dimension line with extension lines + arrows */
function DimH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: React.ReactNode }) {
  return (
    <g stroke={DIM_LINE} strokeWidth={0.7} fill="none">
      {/* Extension lines (short ticks) */}
      <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} />
      <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} />
      {/* Dimension line with arrows */}
      <line x1={x1} y1={y} x2={x2} y2={y} markerStart="url(#arrowHead)" markerEnd="url(#arrowHead)" />
      {label}
    </g>
  );
}

/** Engineering-style vertical dimension line */
function DimV({ y1, y2, x, label }: { y1: number; y2: number; x: number; label: React.ReactNode }) {
  return (
    <g stroke={DIM_LINE} strokeWidth={0.7} fill="none">
      <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} />
      <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} />
      <line x1={x} y1={y1} x2={x} y2={y2} markerStart="url(#arrowHead)" markerEnd="url(#arrowHead)" />
      {label}
    </g>
  );
}

/** Highlight overlay for a rectangular segment of the profile */
function Highlight({ x, y, w, h, on }: { x: number; y: number; w: number; h: number; on: boolean }) {
  if (!on) return null;
  return <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="none" stroke={PROFILE_FILL_HIGHLIGHT} strokeWidth={2.5} rx={2} />;
}

// ============== PROFILES ==============

// ---------- C Profile (basic, no lips) ----------
function CProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const t = 6;
  const flangeLen = 70;
  const webHeight = 140;
  const cx = 200;
  const top = 70;
  const webX = cx - 35;
  const bot = top + webHeight;

  return (
    <g>
      {/* Body — outlined shape */}
      <g fill={PROFILE_FILL} stroke={PROFILE_STROKE} strokeWidth={1}>
        <rect x={webX} y={top} width={flangeLen} height={t} />
        <rect x={webX} y={top} width={t} height={webHeight + t} />
        <rect x={webX} y={bot} width={flangeLen} height={t} />
      </g>
      <Highlight x={webX} y={top} w={flangeLen} h={t} on={hi === 0} />
      <Highlight x={webX} y={top} w={t} h={webHeight + t} on={hi === 1} />
      <Highlight x={webX} y={bot} w={flangeLen} h={t} on={hi === 2} />

      {/* Dimensions */}
      <DimH x1={webX} x2={webX + flangeLen} y={top - 18} label={<Letter x={webX + flangeLen / 2} y={top - 18} letter="a" value={edges[0]} />} />
      <DimV y1={top} y2={bot + t} x={webX - 22} label={<Letter x={webX - 22} y={top + (webHeight + t) / 2} letter="b" value={edges[1]} />} />
      <DimH x1={webX} x2={webX + flangeLen} y={bot + t + 18} label={<Letter x={webX + flangeLen / 2} y={bot + t + 18} letter="c" value={edges[2]} />} />
    </g>
  );
}

// ---------- C Profile with lips (Stiffened C-channel) ----------
// Lips fold INWARD (toward each other) — like the reference image.
function CLipProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const t = 5;
  const flangeLen = 80;
  const lipLen = 30;
  const webHeight = 160;
  const cx = 200;
  const top = 60;
  const webX = cx - 40;
  const bot = top + webHeight;
  const lipX = webX + flangeLen - t;     // right edge of flange

  return (
    <g>
      <g fill={PROFILE_FILL} stroke={PROFILE_STROKE} strokeWidth={1}>
        {/* a — top lip (folds DOWNWARD into the channel interior) */}
        <rect x={lipX} y={top + t} width={t} height={lipLen} />
        {/* b — top flange */}
        <rect x={webX} y={top} width={flangeLen} height={t} />
        {/* c — web */}
        <rect x={webX} y={top} width={t} height={webHeight + t} />
        {/* d — bottom flange */}
        <rect x={webX} y={bot} width={flangeLen} height={t} />
        {/* e — bottom lip (folds UPWARD into the channel interior) */}
        <rect x={lipX} y={bot - lipLen} width={t} height={lipLen} />
      </g>

      <Highlight x={lipX} y={top + t} w={t} h={lipLen} on={hi === 0} />
      <Highlight x={webX} y={top} w={flangeLen} h={t} on={hi === 1} />
      <Highlight x={webX} y={top} w={t} h={webHeight + t} on={hi === 2} />
      <Highlight x={webX} y={bot} w={flangeLen} h={t} on={hi === 3} />
      <Highlight x={lipX} y={bot - lipLen} w={t} h={lipLen} on={hi === 4} />

      {/* a — top lip — vertical dim on the right of the lip */}
      <DimV y1={top + t} y2={top + t + lipLen} x={lipX + t + 18} label={<Letter x={lipX + t + 18} y={top + t + lipLen / 2} letter="a" value={edges[0]} />} />
      {/* b — top flange — horizontal dim above */}
      <DimH x1={webX} x2={webX + flangeLen} y={top - 18} label={<Letter x={webX + flangeLen / 2} y={top - 18} letter="b" value={edges[1]} />} />
      {/* c — web — vertical dim on the left */}
      <DimV y1={top} y2={bot + t} x={webX - 22} label={<Letter x={webX - 22} y={top + (webHeight + t) / 2} letter="c" value={edges[2]} />} />
      {/* d — bottom flange — horizontal dim below */}
      <DimH x1={webX} x2={webX + flangeLen} y={bot + t + 18} label={<Letter x={webX + flangeLen / 2} y={bot + t + 18} letter="d" value={edges[3]} />} />
      {/* e — bottom lip — vertical dim on the right */}
      <DimV y1={bot - lipLen} y2={bot} x={lipX + t + 18} label={<Letter x={lipX + t + 18} y={bot - lipLen / 2} letter="e" value={edges[4]} />} />
    </g>
  );
}

// ---------- U Profile ----------
function UProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const t = 6;
  const top = 60;
  const bot = 200;
  const leftX = 150;
  const width = 130;

  return (
    <g>
      <g fill={PROFILE_FILL} stroke={PROFILE_STROKE} strokeWidth={1}>
        <rect x={leftX} y={top} width={t} height={bot - top + t} />
        <rect x={leftX} y={bot} width={width} height={t} />
        <rect x={leftX + width - t} y={top} width={t} height={bot - top + t} />
      </g>
      <Highlight x={leftX} y={top} w={t} h={bot - top + t} on={hi === 0} />
      <Highlight x={leftX} y={bot} w={width} h={t} on={hi === 1} />
      <Highlight x={leftX + width - t} y={top} w={t} h={bot - top + t} on={hi === 2} />

      <DimV y1={top} y2={bot + t} x={leftX - 20} label={<Letter x={leftX - 20} y={(top + bot) / 2 + 2} letter="a" value={edges[0]} />} />
      <DimH x1={leftX} x2={leftX + width} y={bot + t + 18} label={<Letter x={leftX + width / 2} y={bot + t + 18} letter="b" value={edges[1]} />} />
      <DimV y1={top} y2={bot + t} x={leftX + width + 20} label={<Letter x={leftX + width + 20} y={(top + bot) / 2 + 2} letter="c" value={edges[2]} />} />
    </g>
  );
}

// ---------- Z Profile ----------
function ZProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const t = 6;
  const flangeLen = 65;
  const webHeight = 140;
  const cx = 200;
  const top = 65;
  const bot = top + webHeight;

  return (
    <g>
      <g fill={PROFILE_FILL} stroke={PROFILE_STROKE} strokeWidth={1}>
        <rect x={cx - flangeLen} y={top} width={flangeLen + t} height={t} />
        <rect x={cx} y={top} width={t} height={webHeight + t} />
        <rect x={cx} y={bot} width={flangeLen + t} height={t} />
      </g>
      <Highlight x={cx - flangeLen} y={top} w={flangeLen + t} h={t} on={hi === 0} />
      <Highlight x={cx} y={top} w={t} h={webHeight + t} on={hi === 1} />
      <Highlight x={cx} y={bot} w={flangeLen + t} h={t} on={hi === 2} />

      <DimH x1={cx - flangeLen} x2={cx} y={top - 18} label={<Letter x={cx - flangeLen / 2} y={top - 18} letter="a" value={edges[0]} />} />
      <DimV y1={top + t} y2={bot} x={cx - 22} label={<Letter x={cx - 22} y={top + webHeight / 2 + 2} letter="b" value={edges[1]} />} />
      <DimH x1={cx + t} x2={cx + flangeLen + t} y={bot + t + 18} label={<Letter x={cx + flangeLen / 2 + t} y={bot + t + 18} letter="c" value={edges[2]} />} />
    </g>
  );
}

// ---------- L Profile ----------
function LProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const t = 6;
  const legLen = 110;
  const cornerX = 150;
  const cornerY = 80;

  return (
    <g>
      <g fill={PROFILE_FILL} stroke={PROFILE_STROKE} strokeWidth={1}>
        <rect x={cornerX} y={cornerY} width={t} height={legLen + t} />
        <rect x={cornerX} y={cornerY + legLen} width={legLen + t} height={t} />
      </g>
      <Highlight x={cornerX} y={cornerY} w={t} h={legLen + t} on={hi === 0} />
      <Highlight x={cornerX} y={cornerY + legLen} w={legLen + t} h={t} on={hi === 1} />

      <DimV y1={cornerY} y2={cornerY + legLen + t} x={cornerX - 20} label={<Letter x={cornerX - 20} y={cornerY + (legLen + t) / 2} letter="a" value={edges[0]} />} />
      <DimH x1={cornerX} x2={cornerX + legLen + t} y={cornerY + legLen + t + 18} label={<Letter x={cornerX + (legLen + t) / 2} y={cornerY + legLen + t + 18} letter="b" value={edges[1]} />} />
    </g>
  );
}

// ---------- I Profile (IPE-style, narrow flanges) ----------
function IProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const flangeT = 7;
  const webT = 6;
  const flangeW = 70;
  const webH = 160;
  const cx = 200;
  const top = 50;
  const bot = top + flangeT + webH + flangeT;

  return (
    <g>
      <g fill={PROFILE_FILL} stroke={PROFILE_STROKE} strokeWidth={1}>
        {/* Top flange */}
        <rect x={cx - flangeW / 2} y={top} width={flangeW} height={flangeT} />
        {/* Web */}
        <rect x={cx - webT / 2} y={top + flangeT} width={webT} height={webH} />
        {/* Bottom flange */}
        <rect x={cx - flangeW / 2} y={top + flangeT + webH} width={flangeW} height={flangeT} />
      </g>
      <Highlight x={cx - flangeW / 2} y={top} w={flangeW} h={flangeT} on={hi === 0} />
      <Highlight x={cx - webT / 2} y={top + flangeT} w={webT} h={webH} on={hi === 1} />
      <Highlight x={cx - flangeW / 2} y={top + flangeT + webH} w={flangeW} h={flangeT} on={hi === 2} />

      <DimH x1={cx - flangeW / 2} x2={cx + flangeW / 2} y={top - 18} label={<Letter x={cx} y={top - 18} letter="a" value={edges[0]} />} />
      <DimV y1={top + flangeT} y2={top + flangeT + webH} x={cx + flangeW / 2 + 22} label={<Letter x={cx + flangeW / 2 + 22} y={top + flangeT + webH / 2} letter="b" value={edges[1]} />} />
      <DimH x1={cx - flangeW / 2} x2={cx + flangeW / 2} y={bot + 18} label={<Letter x={cx} y={bot + 18} letter="c" value={edges[2]} />} />
    </g>
  );
}

// ---------- H Profile (HEA/HEB-style, wide flanges) ----------
function HProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const flangeT = 8;
  const webT = 7;
  const flangeW = 110;     // wider than I
  const webH = 130;        // shorter than I
  const cx = 200;
  const top = 55;
  const bot = top + flangeT + webH + flangeT;

  return (
    <g>
      <g fill={PROFILE_FILL} stroke={PROFILE_STROKE} strokeWidth={1}>
        <rect x={cx - flangeW / 2} y={top} width={flangeW} height={flangeT} />
        <rect x={cx - webT / 2} y={top + flangeT} width={webT} height={webH} />
        <rect x={cx - flangeW / 2} y={top + flangeT + webH} width={flangeW} height={flangeT} />
      </g>
      <Highlight x={cx - flangeW / 2} y={top} w={flangeW} h={flangeT} on={hi === 0} />
      <Highlight x={cx - webT / 2} y={top + flangeT} w={webT} h={webH} on={hi === 1} />
      <Highlight x={cx - flangeW / 2} y={top + flangeT + webH} w={flangeW} h={flangeT} on={hi === 2} />

      <DimH x1={cx - flangeW / 2} x2={cx + flangeW / 2} y={top - 18} label={<Letter x={cx} y={top - 18} letter="a" value={edges[0]} />} />
      <DimV y1={top + flangeT} y2={top + flangeT + webH} x={cx + flangeW / 2 + 22} label={<Letter x={cx + flangeW / 2 + 22} y={top + flangeT + webH / 2} letter="b" value={edges[1]} />} />
      <DimH x1={cx - flangeW / 2} x2={cx + flangeW / 2} y={bot + 18} label={<Letter x={cx} y={bot + 18} letter="c" value={edges[2]} />} />
    </g>
  );
}

// ---------- Sigma Σ Profile ----------
function SigmaProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const t = 5;
  // Approximate Σ polyline geometry
  const x0 = 110;
  const y0 = 50;
  let x = x0;
  let y = y0;
  const sizes = [60, 35, 22, 30, 22, 35, 60];
  const dirs: ('h' | 'v')[] = ['h', 'v', 'h', 'v', 'h', 'v', 'h'];
  const segs: { x1: number; y1: number; x2: number; y2: number; dir: 'h' | 'v'; idx: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const dir = dirs[i];
    const x2 = dir === 'h' ? x + sizes[i] : x;
    const y2 = dir === 'v' ? y + sizes[i] : y;
    segs.push({ x1: x, y1: y, x2, y2, dir, idx: i });
    x = x2;
    y = y2;
  }

  return (
    <g>
      {segs.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={hi === i ? PROFILE_FILL_HIGHLIGHT : PROFILE_FILL} strokeWidth={t + 1} strokeLinecap="square" />
      ))}
      {segs.map((s, i) => {
        const midX = (s.x1 + s.x2) / 2;
        const midY = (s.y1 + s.y2) / 2;
        const off = s.dir === 'h'
          ? { dx: 0, dy: i < 4 ? -14 : 16 }
          : { dx: i < 4 ? -18 : 18, dy: 0 };
        return (
          <Letter key={i} x={midX + off.dx} y={midY + off.dy} letter={getEdgeLetter(i)} value={edges[i]} />
        );
      })}
    </g>
  );
}

// ---------- Omega Ω Profile ----------
function OmegaProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  const t = 6;
  const cx = 200;
  const topY = 65;
  const botY = 180;
  const brimLen = 50;
  const topWidth = 80;
  const webHeight = botY - topY;

  return (
    <g>
      <g fill={PROFILE_FILL} stroke={PROFILE_STROKE} strokeWidth={1}>
        <rect x={cx - topWidth / 2 - brimLen} y={botY} width={brimLen + t} height={t} />
        <rect x={cx - topWidth / 2} y={topY} width={t} height={webHeight + t} />
        <rect x={cx - topWidth / 2} y={topY} width={topWidth + t} height={t} />
        <rect x={cx + topWidth / 2} y={topY} width={t} height={webHeight + t} />
        <rect x={cx + topWidth / 2} y={botY} width={brimLen + t} height={t} />
      </g>
      <Highlight x={cx - topWidth / 2 - brimLen} y={botY} w={brimLen + t} h={t} on={hi === 0} />
      <Highlight x={cx - topWidth / 2} y={topY} w={t} h={webHeight + t} on={hi === 1} />
      <Highlight x={cx - topWidth / 2} y={topY} w={topWidth + t} h={t} on={hi === 2} />
      <Highlight x={cx + topWidth / 2} y={topY} w={t} h={webHeight + t} on={hi === 3} />
      <Highlight x={cx + topWidth / 2} y={botY} w={brimLen + t} h={t} on={hi === 4} />

      <DimH x1={cx - topWidth / 2 - brimLen} x2={cx - topWidth / 2} y={botY + t + 16} label={<Letter x={cx - topWidth / 2 - brimLen / 2} y={botY + t + 16} letter="a" value={edges[0]} />} />
      <DimV y1={topY + t} y2={botY} x={cx - topWidth / 2 - 18} label={<Letter x={cx - topWidth / 2 - 18} y={(topY + botY) / 2} letter="b" value={edges[1]} />} />
      <DimH x1={cx - topWidth / 2} x2={cx + topWidth / 2 + t} y={topY - 16} label={<Letter x={cx} y={topY - 16} letter="c" value={edges[2]} />} />
      <DimV y1={topY + t} y2={botY} x={cx + topWidth / 2 + t + 18} label={<Letter x={cx + topWidth / 2 + t + 18} y={(topY + botY) / 2} letter="d" value={edges[3]} />} />
      <DimH x1={cx + topWidth / 2 + t} x2={cx + topWidth / 2 + t + brimLen} y={botY + t + 16} label={<Letter x={cx + topWidth / 2 + brimLen / 2 + t} y={botY + t + 16} letter="e" value={edges[4]} />} />
    </g>
  );
}

// ---------- Custom (polyline auto-fold) ----------
function CustomProfile({ edges, hi }: { edges: number[]; hi: number | null }) {
  if (edges.length === 0) {
    return (
      <text x={200} y={140} textAnchor="middle" fontSize={12} fill="#94a3b8" fontStyle="italic">
        Kenar ekleyin — şekil otomatik oluşacak
      </text>
    );
  }
  const t = 6;
  const startX = 70;
  const startY = 140;
  const segLen = Math.max(20, Math.min(50, 280 / edges.length));
  let x = startX;
  let y = startY;
  const segs: { x1: number; y1: number; x2: number; y2: number; dir: 'h' | 'v'; idx: number }[] = [];
  for (let i = 0; i < edges.length; i++) {
    const dir: 'h' | 'v' = i % 2 === 0 ? 'h' : 'v';
    const dirSign = i < edges.length / 2 ? 1 : -1;
    const x2 = dir === 'h' ? x + segLen : x;
    const y2 = dir === 'v' ? y + segLen * dirSign : y;
    segs.push({ x1: x, y1: y, x2, y2, dir, idx: i });
    x = x2;
    y = y2;
  }
  return (
    <g>
      {segs.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={hi === i ? PROFILE_FILL_HIGHLIGHT : PROFILE_FILL} strokeWidth={t + 1} strokeLinecap="square" />
      ))}
      {segs.map((s, i) => {
        const midX = (s.x1 + s.x2) / 2;
        const midY = (s.y1 + s.y2) / 2;
        const off = s.dir === 'h' ? { dx: 0, dy: -14 } : { dx: 18, dy: 0 };
        return (
          <Letter key={i} x={midX + off.dx} y={midY + off.dy} letter={getEdgeLetter(i)} value={edges[i]} />
        );
      })}
    </g>
  );
}
