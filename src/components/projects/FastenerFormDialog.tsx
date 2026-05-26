'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import type { Fastener } from '@/types';
import { DIN_CATALOG, type CatalogEntry } from '@/lib/constants/din-catalog';
import { formatNumber } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { calculateFastenerTotal } from '@/lib/calculations/totals';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
  tableTypeId: string;
  editing: Fastener | null;
  onSaved: (f: Fastener, isNew: boolean) => void;
}

const initialState = (e?: Fastener | null) => ({
  source: (e?.source || 'CATALOG') as 'CATALOG' | 'MANUAL',
  universalCode: e?.universalCode || '',
  detail: e?.detail || '',
  size: e?.size || '',
  length: e?.length || '',
  grade: e?.grade || '',
  unitWeight: e?.unitWeight ?? 0,
  quantityPerTable: e?.quantityPerTable ?? 1,
  spareRatio: e?.spareRatio ?? 2,
  saveToLibrary: false,
  catalogKey: '',
});

export function FastenerFormDialog({ open, onOpenChange, projectId, tableTypeId, editing, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => initialState(editing));
  const [customLib, setCustomLib] = useState<CatalogEntry[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialState(editing));
      fetch('/api/catalog')
        .then((r) => r.json())
        .then((d) => setCustomLib(d.custom || []))
        .catch(() => setCustomLib([]));
    }
  }, [open, editing]);

  const allCatalog = useMemo(() => [...DIN_CATALOG, ...customLib], [customLib]);

  function applyCatalog(key: string) {
    const idx = parseInt(key);
    const entry = allCatalog[idx];
    if (!entry) return;
    setForm({
      ...form,
      catalogKey: key,
      source: 'CATALOG',
      universalCode: entry.code,
      detail: entry.detail,
      size: entry.size,
      length: entry.length || '',
      grade: entry.grade,
      unitWeight: entry.weight,
    });
  }

  const totalPerTable = useMemo(
    () =>
      calculateFastenerTotal({
        unitWeight: Number(form.unitWeight) || 0,
        quantityPerTable: Number(form.quantityPerTable) || 0,
        spareRatio: Number(form.spareRatio) || 0,
      }),
    [form.unitWeight, form.quantityPerTable, form.spareRatio]
  );

  async function handleSave() {
    if (!form.universalCode || !form.size) {
      toast('Universal kod ve ölçü zorunludur', 'error');
      return;
    }
    setBusy(true);
    const isNew = !editing?.id;
    const url = isNew
      ? `/api/projects/${projectId}/table-types/${tableTypeId}/fasteners`
      : `/api/projects/${projectId}/table-types/${tableTypeId}/fasteners/${editing!.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, length: form.length || null }),
    });
    setBusy(false);
    if (res.ok) {
      const saved = await res.json();
      onSaved(saved, isNew);
      onOpenChange(false);
      toast(isNew ? 'Eklendi' : 'Güncellendi', 'success');
    } else {
      toast('Kaydedilemedi', 'error');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing?.id ? 'Bağlantı Elemanını Düzenle' : 'Yeni Bağlantı Elemanı'}</DialogTitle>
          <DialogDescription>
            DIN katalogtan seçin veya manuel girin. Manuel girilenler kütüphaneye kaydedilebilir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setForm({ ...form, source: 'CATALOG' })}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${form.source === 'CATALOG' ? 'bg-white shadow-sm text-primary' : 'text-slate-600'}`}
            >
              DIN Katalogtan Seç
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, source: 'MANUAL' })}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${form.source === 'MANUAL' ? 'bg-white shadow-sm text-primary' : 'text-slate-600'}`}
            >
              Manuel Gir
            </button>
          </div>

          {form.source === 'CATALOG' && (
            <div className="space-y-2">
              <Label>Katalogtan Seç</Label>
              <Select value={form.catalogKey} onValueChange={applyCatalog}>
                <SelectTrigger><SelectValue placeholder="Bir bağlantı elemanı seçin..." /></SelectTrigger>
                <SelectContent>
                  {allCatalog.map((c, i) => (
                    <SelectItem key={`${c.code}-${c.size}-${c.length}-${i}`} value={String(i)}>
                      <span className="font-mono text-xs mr-2">{c.code}</span>
                      {c.detail} · {c.size} {c.length ? `· ${c.length}` : ''} ({c.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Universal Kod</Label>
              <Input
                value={form.universalCode}
                onChange={(e) => setForm({ ...form, universalCode: e.target.value })}
                placeholder="DIN933"
                disabled={form.source === 'CATALOG'}
              />
            </div>
            <div className="space-y-2">
              <Label>Detay</Label>
              <Input
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                placeholder="Altıköşe Cıvata"
                disabled={form.source === 'CATALOG'}
              />
            </div>
            <div className="space-y-2">
              <Label>Ölçü</Label>
              <Input
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                placeholder="M12"
                disabled={form.source === 'CATALOG'}
              />
            </div>
            <div className="space-y-2">
              <Label>Uzunluk</Label>
              <Input
                value={form.length}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
                placeholder="30mm"
                disabled={form.source === 'CATALOG'}
              />
            </div>
            <div className="space-y-2">
              <Label>Kalite</Label>
              <Input
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                placeholder="8.8"
                disabled={form.source === 'CATALOG'}
              />
            </div>
            <div className="space-y-2">
              <Label>Birim Ağırlık (kg)</Label>
              <Input
                type="number"
                step="0.0001"
                value={form.unitWeight}
                onChange={(e) => setForm({ ...form, unitWeight: parseFloat(e.target.value) || 0 })}
                disabled={form.source === 'CATALOG'}
              />
            </div>
            <div className="space-y-2">
              <Label>Adet/Masa</Label>
              <Input type="number" value={form.quantityPerTable} onChange={(e) => setForm({ ...form, quantityPerTable: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Fire (%)</Label>
              <Input type="number" step="0.1" value={form.spareRatio} onChange={(e) => setForm({ ...form, spareRatio: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          {form.source === 'MANUAL' && (
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={form.saveToLibrary}
                onChange={(e) => setForm({ ...form, saveToLibrary: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              Bu parçayı kütüphaneye kaydet (sonraki projelerde kullanılabilir)
            </label>
          )}

          <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-center justify-between">
            <p className="text-xs text-primary-dark/70 font-semibold uppercase">Tek Masa Toplam</p>
            <p className="text-base font-bold text-primary-dark tabular-nums">{formatNumber(totalPerTable, 3)} kg</p>
          </div>
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
