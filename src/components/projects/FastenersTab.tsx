'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">DIN katalogundan seç veya manuel gir — satıra tıklayınca düzenleme açılır</p>
        <Button size="sm" onClick={() => { setEditing(null); setOpenForm(true); }}>
          <Plus className="w-3.5 h-3.5" />
          Bağlantı Elemanı Ekle
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100 text-[11px] text-slate-600">
                <th className="text-left px-2 py-1.5 font-semibold">Universal Kod</th>
                <th className="text-left px-2 py-1.5 font-semibold">Detay</th>
                <th className="text-left px-2 py-1.5 font-semibold">Ölçü</th>
                <th className="text-left px-2 py-1.5 font-semibold">Uzunluk</th>
                <th className="text-left px-2 py-1.5 font-semibold">Kalite</th>
                <th className="text-right px-2 py-1.5 font-semibold">Birim (kg)</th>
                <th className="text-right px-2 py-1.5 font-semibold">Adet/Masa</th>
                <th className="text-right px-2 py-1.5 font-semibold">Fire %</th>
                <th className="text-right px-2 py-1.5 font-semibold">Toplam (kg)</th>
                <th className="w-8 px-1 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {fasteners.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 text-sm">
                    Henüz bağlantı elemanı eklenmedi — cıvata, somun, rondela ve klemp ekleyebilirsiniz
                  </td>
                </tr>
              )}
              {fasteners.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => { setEditing(f); setOpenForm(true); }}
                  className="border-t border-slate-100 cursor-pointer hover:bg-primary-50/40 transition-colors"
                  title="Detayı düzenlemek için tıklayın"
                >
                  <td className="px-2 py-1.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-600">{f.universalCode}</span>
                    {f.source === 'MANUAL' && <span className="ml-1.5 text-[10px] text-amber-600">Manuel</span>}
                  </td>
                  <td className="px-2 py-1.5 text-slate-700">{f.detail}</td>
                  <td className="px-2 py-1.5 font-mono text-slate-700">{f.size}</td>
                  <td className="px-2 py-1.5 text-slate-600">{f.length || '—'}</td>
                  <td className="px-2 py-1.5 text-slate-600">{f.grade}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{formatNumber(f.unitWeight, 4)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{f.quantityPerTable}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{formatNumber(f.spareRatio, 1)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-bold text-slate-900">{formatNumber(f.totalWeightPerTable, 3)}</td>
                  <td className="px-1 py-1 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      title="Bağlantı elemanını sil"
                      aria-label="Bağlantı elemanını sil"
                      className="inline-flex size-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {fasteners.length > 0 && (
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-primary-dark">
                  <td colSpan={8} className="px-2 py-1.5 text-right text-xs">TEK MASA TOPLAM (kg)</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(fasteners.reduce((s, f) => s + f.totalWeightPerTable, 0), 3)}</td>
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
