'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import type { SehpaPart, ProfileType } from '@/types';
import { PROFILE_TYPES } from '@/types';
import { calculatePart, getBendCount, getDefaultBendAllowance } from '@/lib/calculations/profiles';
import { formatNumber } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ProfileShape, getEdgeLetter } from './ProfileShape';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
  tableTypeId: string;
  editing: SehpaPart | null;
  onSaved: (part: SehpaPart, isNew: boolean) => void;
}

// Each edge gets a letter (a, b, c...) and a hint of which side of the profile it represents
const PROFILE_EDGE_HINTS: Record<ProfileType, string[]> = {
  C: ['Üst flanş', 'Web (gövde)', 'Alt flanş'],
  C_LIP: ['Üst lip (uç büküm)', 'Üst flanş', 'Web (gövde)', 'Alt flanş', 'Alt lip (uç büküm)'],
  U: ['Sol flanş', 'Alt web (taban)', 'Sağ flanş'],
  Z: ['Üst flanş', 'Web (gövde)', 'Alt flanş'],
  L: ['Dikey bacak', 'Yatay bacak'],
  SIGMA: ['Üst flanş', 'Üst web', 'Üst lip', 'Orta web', 'Alt lip', 'Alt web', 'Alt flanş'],
  OMEGA: ['Sol etek', 'Sol web', 'Tepe', 'Sağ web', 'Sağ etek'],
  I: ['Üst flanş genişliği', 'Web yüksekliği', 'Alt flanş genişliği'],
  H: ['Üst flanş genişliği', 'Web yüksekliği', 'Alt flanş genişliği'],
  CUSTOM: [],
};

// Sensible default edges when profile type changes
const PROFILE_DEFAULTS: Record<ProfileType, number[]> = {
  C: [70, 120, 70],
  C_LIP: [25, 50, 120, 50, 25],
  U: [70, 100, 70],
  Z: [70, 120, 70],
  L: [60, 60],
  SIGMA: [40, 30, 15, 60, 15, 30, 40],
  OMEGA: [40, 60, 80, 60, 40],
  I: [80, 200, 80],
  H: [120, 120, 120],
  CUSTOM: [],
};

// "Placeholder" parts have zeros for all dimensions — give the form sensible defaults
// so the user sees a starting shape instead of an empty form
const initialState = (editing?: SehpaPart | null) => {
  const isEmpty = editing && (editing.thickness || 0) === 0 && !(editing.edges?.length);
  return {
    code: editing?.code || '',
    name: editing?.name || '',
    profileType: (editing?.profileType || 'C') as ProfileType,
    thickness: editing?.thickness || (isEmpty ? 2 : (editing?.thickness ?? 2)),
    edges: editing?.edges?.length ? editing.edges : [70, 120, 70],
    length: editing?.length || (isEmpty ? 3000 : (editing?.length ?? 3000)),
    quantityPerTable: editing?.quantityPerTable || (isEmpty ? 2 : (editing?.quantityPerTable ?? 2)),
    spareRatio: editing?.spareRatio ?? 2,
    bendAllowance: editing?.bendAllowance,
  };
};

export function PartFormDialog({ open, onOpenChange, projectId, tableTypeId, editing, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => initialState(editing));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm(initialState(editing));
  }, [open, editing]);

  // Adapt edges count when profile type changes
  useEffect(() => {
    const profile = PROFILE_TYPES.find((p) => p.value === form.profileType);
    if (!profile) return;
    if (profile.value === 'CUSTOM') return;
    if (form.edges.length !== profile.edgeCount) {
      setForm((f) => {
        const defaults = PROFILE_DEFAULTS[f.profileType] || [];
        const newEdges: number[] = [];
        for (let i = 0; i < profile.edgeCount; i++) {
          // Keep existing value if present and non-zero, otherwise use profile default
          newEdges.push(f.edges[i] || defaults[i] || 0);
        }
        return { ...f, edges: newEdges };
      });
    }
  }, [form.profileType]);

  const calc = useMemo(
    () =>
      calculatePart({
        profileType: form.profileType,
        thickness: Number(form.thickness) || 0,
        edges: form.edges.map((e) => Number(e) || 0),
        length: Number(form.length) || 0,
        quantityPerTable: Number(form.quantityPerTable) || 0,
        spareRatio: Number(form.spareRatio) || 0,
        bendAllowance: form.bendAllowance !== undefined ? Number(form.bendAllowance) : undefined,
      }),
    [form]
  );

  const edgeHints =
    form.profileType === 'CUSTOM'
      ? form.edges.map((_, i) => `Kenar ${i + 1}`)
      : PROFILE_EDGE_HINTS[form.profileType] || [];

  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

  function updateEdge(i: number, val: string) {
    setForm((f) => {
      const next = [...f.edges];
      next[i] = parseFloat(val) || 0;
      return { ...f, edges: next };
    });
  }

  function addEdge() {
    setForm((f) => ({ ...f, edges: [...f.edges, 0] }));
  }

  function removeEdge(i: number) {
    setForm((f) => ({ ...f, edges: f.edges.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast('Parça adı zorunludur', 'error');
      return;
    }
    setBusy(true);
    const isNew = !editing?.id;
    const url = isNew
      ? `/api/projects/${projectId}/table-types/${tableTypeId}/parts`
      : `/api/projects/${projectId}/table-types/${tableTypeId}/parts/${editing!.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        name: form.name,
        profileType: form.profileType,
        thickness: form.thickness,
        edges: form.edges,
        length: form.length,
        quantityPerTable: form.quantityPerTable,
        spareRatio: form.spareRatio,
        bendAllowance: form.bendAllowance,
      }),
    });
    setBusy(false);
    if (res.ok) {
      const saved = await res.json();
      onSaved(saved, isNew);
      onOpenChange(false);
      toast(isNew ? 'Parça eklendi' : 'Parça güncellendi', 'success');
    } else {
      toast('Kaydedilemedi', 'error');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{editing?.id ? 'Parçayı Düzenle' : 'Yeni Parça Ekle'}</DialogTitle>
          <DialogDescription>
            Profil tipini seçin, ölçüleri girin — sac açılımı, birim ağırlık ve galvaniz otomatik hesaplanır.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Kod</Label>
            <Input placeholder="P1" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Parça Adı *</Label>
            <Input placeholder="Örn: Ön Kolon, Aşık, Kiriş" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Profil Tipi</Label>
            <Select value={form.profileType} onValueChange={(v) => setForm({ ...form, profileType: v as ProfileType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROFILE_TYPES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kalınlık (mm)</Label>
            <Input type="number" step="0.1" value={form.thickness} onChange={(e) => setForm({ ...form, thickness: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Uzunluk (mm)</Label>
            <Input type="number" value={form.length} onChange={(e) => setForm({ ...form, length: parseFloat(e.target.value) || 0 })} />
          </div>

          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Profil Şekli ve Kenar Ölçüleri (mm)</Label>
              {form.profileType === 'CUSTOM' && (
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={addEdge}>+ Kenar</Button>
                  {form.edges.length > 0 && (
                    <Button type="button" size="sm" variant="outline" onClick={() => removeEdge(form.edges.length - 1)}>− Kenar</Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Profile shape illustration */}
              <div className="md:col-span-2">
                <ProfileShape type={form.profileType} edges={form.edges.map((e) => Number(e) || 0)} highlightIndex={hoveredEdge} />
                <p className="text-[10px] text-slate-500 mt-1 text-center">
                  Şema · gerçek ölçek değildir · kenar üzerine gelince vurgulanır
                </p>
              </div>

              {/* Edge inputs labeled a, b, c... */}
              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
                {form.edges.map((e, i) => {
                  const letter = getEdgeLetter(i);
                  const hint = edgeHints[i] || `Kenar ${i + 1}`;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredEdge(i)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      onFocus={() => setHoveredEdge(i)}
                      onBlur={() => setHoveredEdge(null)}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-accent-yellow border border-primary-dark/40 rounded text-[11px] font-bold text-primary-dark font-mono">
                            {letter}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">{letter} ölçüsü</span>
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={e}
                        placeholder={`${letter} (mm)`}
                        onChange={(ev) => updateEdge(i, ev.target.value)}
                        className={hoveredEdge === i ? 'ring-2 ring-primary/50 border-primary' : ''}
                      />
                      <p className="text-[10px] text-slate-500 leading-tight">{hint}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adet/Masa</Label>
            <Input type="number" value={form.quantityPerTable} onChange={(e) => setForm({ ...form, quantityPerTable: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Fire (%)</Label>
            <Input type="number" step="0.1" value={form.spareRatio} onChange={(e) => setForm({ ...form, spareRatio: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Büküm Payı (mm)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder={`Otomatik: ${formatNumber(getDefaultBendAllowance(form.thickness), 2)}`}
              value={form.bendAllowance ?? ''}
              onChange={(e) => setForm({ ...form, bendAllowance: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Live calculation preview */}
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <CalcStat label="Büküm Adedi" value={String(calc.bendCount)} />
          <CalcStat label="Sac Açılımı" value={`${formatNumber(calc.developedWidth, 1)} mm`} />
          <CalcStat label="Birim Ağırlık" value={`${formatNumber(calc.unitWeight, 3)} kg`} />
          <CalcStat label="Toplam/Masa" value={`${formatNumber(calc.totalWeightPerTable, 2)} kg`} />
          <CalcStat label="Galvaniz" value={`${formatNumber(calc.galvanizingWeight, 2)} kg`} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>İptal</Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing?.id ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CalcStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-primary-dark/70 font-semibold">{label}</p>
      <p className="text-sm font-bold text-primary-dark tabular-nums">{value}</p>
    </div>
  );
}
