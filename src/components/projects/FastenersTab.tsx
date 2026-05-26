'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Fastener } from '@/types';
import { formatNumber } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { FastenerFormDialog } from './FastenerFormDialog';

interface Props {
  projectId: string;
  tableTypeId: string;
  fasteners: Fastener[];
  setFasteners: React.Dispatch<React.SetStateAction<Fastener[]>>;
  onChange: () => void;
}

export function FastenersTab({ projectId, tableTypeId, fasteners, setFasteners, onChange }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Fastener | null>(null);
  const { toast } = useToast();

  async function handleDelete(id: string) {
    if (!confirm('Bu bağlantı elemanını silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/projects/${projectId}/table-types/${tableTypeId}/fasteners/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFasteners((prev) => prev.filter((f) => f.id !== id));
      toast('Silindi', 'success');
      onChange();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Bağlantı Elemanları</h3>
          <p className="text-xs text-slate-500 mt-0.5">DIN katalogundan seç veya manuel gir — manuel girilenler kütüphaneye kaydedilebilir</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpenForm(true); }}>
          <Plus className="w-4 h-4" />
          Bağlantı Elemanı Ekle
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-primary text-white text-xs uppercase">
                <th className="text-left px-3 py-3 font-semibold">Universal Kod</th>
                <th className="text-left px-3 py-3 font-semibold">Detay</th>
                <th className="text-left px-3 py-3 font-semibold">Ölçü</th>
                <th className="text-left px-3 py-3 font-semibold">Uzunluk</th>
                <th className="text-left px-3 py-3 font-semibold">Kalite</th>
                <th className="text-right px-3 py-3 font-semibold">Birim (kg)</th>
                <th className="text-right px-3 py-3 font-semibold">Adet/Masa</th>
                <th className="text-right px-3 py-3 font-semibold">Fire %</th>
                <th className="text-right px-3 py-3 font-semibold">Toplam (kg)</th>
                <th className="text-right px-3 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {fasteners.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="font-medium">Henüz bağlantı elemanı eklenmedi</p>
                      <p className="text-xs">Cıvata, somun, rondela ve klemp ekleyebilirsiniz</p>
                    </div>
                  </td>
                </tr>
              )}
              {fasteners.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-primary-50/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={f.source === 'CATALOG' ? 'info' : 'warning'} className="font-mono">{f.universalCode}</Badge>
                      {f.source === 'MANUAL' && <span className="text-[10px] text-amber-600">Manuel</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-slate-700">{f.detail}</td>
                  <td className="px-3 py-2.5 text-sm font-mono text-slate-700">{f.size}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{f.length || '—'}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{f.grade}</td>
                  <td className="px-3 py-2.5 text-right text-sm text-slate-700 tabular-nums">{formatNumber(f.unitWeight, 4)}</td>
                  <td className="px-3 py-2.5 text-right text-sm text-slate-700 tabular-nums">{f.quantityPerTable}</td>
                  <td className="px-3 py-2.5 text-right text-sm text-slate-600 tabular-nums">{formatNumber(f.spareRatio, 1)}</td>
                  <td className="px-3 py-2.5 text-right text-sm font-bold text-slate-900 tabular-nums bg-accent-yellow/20">{formatNumber(f.totalWeightPerTable, 3)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setOpenForm(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(f.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {fasteners.length > 0 && (
                <tr className="bg-primary-50/60 border-t-2 border-primary/30">
                  <td colSpan={8} className="px-3 py-3 text-right text-sm font-bold text-primary-dark">
                    TEK MASA TOPLAM (kg)
                  </td>
                  <td className="px-3 py-3 text-right text-base font-bold text-primary-dark tabular-nums">
                    {formatNumber(fasteners.reduce((s, f) => s + f.totalWeightPerTable, 0), 3)}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FastenerFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        projectId={projectId}
        tableTypeId={tableTypeId}
        editing={editing}
        onSaved={(saved, isNew) => {
          setFasteners((prev) => (isNew || !editing?.id ? [...prev, saved] : prev.map((f) => (f.id === saved.id ? saved : f))));
          onChange();
        }}
      />
    </div>
  );
}
