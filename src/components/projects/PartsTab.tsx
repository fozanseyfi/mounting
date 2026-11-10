'use client';

import { useEffect, useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import type { SehpaPart } from '@/types';
import { PROFILE_TYPES } from '@/types';
import { formatNumber } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { PartFormDialog } from './PartFormDialog';
import { isPlaceholderPart } from '@/lib/constants/standard-parts';

interface Props {
  projectId: string;
  tableTypeId: string;
  parts: SehpaPart[];
  setParts: React.Dispatch<React.SetStateAction<SehpaPart[]>>;
  onChange: () => void;
  /** Değiştikçe yeni parça formu açılır (Ekle düğmesi sekme satırında) */
  addSignal?: number;
}

export function PartsTab({ projectId, tableTypeId, parts, setParts, onChange, addSignal = 0 }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editingPart, setEditingPart] = useState<SehpaPart | null>(null);
  const { toast } = useToast();

  async function handleDelete(id: string) {
    if (!confirm('Bu parçayı silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/projects/${projectId}/table-types/${tableTypeId}/parts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setParts((prev) => prev.filter((p) => p.id !== id));
      toast('Parça silindi', 'success');
      onChange();
    } else {
      toast('Silinemedi', 'error');
    }
  }

  function handleEdit(part: SehpaPart) {
    setEditingPart(part);
    setOpenForm(true);
  }

  useEffect(() => {
    if (addSignal > 0) {
      setEditingPart(null);
      setOpenForm(true);
    }
  }, [addSignal]);

  const profileLabel = (t: string) => PROFILE_TYPES.find((p) => p.value === t)?.label || t;

  return (
    <div className="space-y-2">
      {parts.some(isPlaceholderPart) && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span><b>{parts.filter(isPlaceholderPart).length} parça</b> henüz doldurulmamış — satıra tıklayarak detayları girin.</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100 text-[11px] text-slate-600">
                <th className="text-left px-2 py-1.5 font-semibold">Kod</th>
                <th className="text-left px-2 py-1.5 font-semibold">Parça Adı</th>
                <th className="text-left px-2 py-1.5 font-semibold">Profil</th>
                <th className="text-right px-2 py-1.5 font-semibold">t (mm)</th>
                <th className="text-left px-2 py-1.5 font-semibold">Kenarlar (mm)</th>
                <th className="text-right px-2 py-1.5 font-semibold">Açılım</th>
                <th className="text-right px-2 py-1.5 font-semibold">Uzunluk</th>
                <th className="text-right px-2 py-1.5 font-semibold">Adet</th>
                <th className="text-right px-2 py-1.5 font-semibold">Birim (kg)</th>
                <th className="text-right px-2 py-1.5 font-semibold">Toplam (kg)</th>
                <th className="text-right px-2 py-1.5 font-semibold">Galv (kg)</th>
                <th className="w-8 px-1 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {parts.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-slate-500 text-sm">
                    Henüz parça eklenmedi
                  </td>
                </tr>
              )}
              {parts.map((p) => {
                const empty = isPlaceholderPart(p);
                return (
                  <tr
                    key={p.id}
                    onClick={() => handleEdit(p)}
                    className={`border-t border-slate-100 cursor-pointer transition-colors ${empty ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-primary-50/40'}`}
                    title="Detayı düzenlemek için tıklayın"
                  >
                    <td className="px-2 py-1.5">
                      <span className={`font-mono text-[11px] font-semibold ${empty ? 'text-amber-700' : 'text-slate-500'}`}>{p.code}</span>
                    </td>
                    <td className={`px-2 py-1.5 font-medium ${empty ? 'text-amber-800' : 'text-slate-900'}`}>{p.name}</td>
                    {empty ? (
                      <td colSpan={9} className="px-2 py-1.5 text-amber-700">
                        <span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Detay girilmedi — düzenlemek için tıklayın</span>
                      </td>
                    ) : (
                      <>
                        <td className="px-2 py-1.5 text-slate-600">{profileLabel(p.profileType)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{formatNumber(p.thickness, 1)}</td>
                        <td className="px-2 py-1.5 font-mono text-[12px] text-slate-600">{p.edges.join('-')}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-900">{formatNumber(p.developedWidth, 1)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{formatNumber(p.length, 0)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{p.quantityPerTable}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-900">{formatNumber(p.unitWeight, 3)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums font-bold text-slate-900">{formatNumber(p.totalWeightPerTable, 2)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{formatNumber(p.galvanizingWeight, 2)}</td>
                      </>
                    )}
                    <td className="px-1 py-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        title="Parçayı sil"
                        aria-label="Parçayı sil"
                        className="inline-flex size-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {parts.length > 0 && (
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-primary-dark">
                  <td colSpan={9} className="px-2 py-1.5 text-right text-xs">TEK MASA TOPLAM (kg)</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(parts.reduce((s, p) => s + p.totalWeightPerTable, 0), 2)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(parts.reduce((s, p) => s + p.galvanizingWeight, 0), 2)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PartFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        projectId={projectId}
        tableTypeId={tableTypeId}
        editing={editingPart}
        onSaved={(saved, isNew) => {
          setParts((prev) => {
            if (isNew || !editingPart?.id) return [...prev, saved];
            return prev.map((p) => (p.id === saved.id ? saved : p));
          });
          onChange();
        }}
      />
    </div>
  );
}
