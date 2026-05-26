'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}

export function PartsTab({ projectId, tableTypeId, parts, setParts, onChange }: Props) {
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

  function handleClone(part: SehpaPart) {
    const clone: SehpaPart = { ...part, id: '', code: part.code + ' (Kopya)' };
    setEditingPart(clone);
    setOpenForm(true);
  }

  function handleAdd() {
    setEditingPart(null);
    setOpenForm(true);
  }

  const profileLabel = (t: string) => PROFILE_TYPES.find((p) => p.value === t)?.label || t;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Sehpa Parçaları</h3>
          <p className="text-xs text-slate-500 mt-0.5">Çelik profil parçalarını girin — sac açılımı ve ağırlık otomatik hesaplanır</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Parça Ekle
        </Button>
      </div>

      {parts.some(isPlaceholderPart) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <b>{parts.filter(isPlaceholderPart).length} parça</b> henüz doldurulmamış —
            satıra veya parça adına tıklayarak detayları girin (profil, kalınlık, ölçüler, adet).
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-primary text-white text-xs uppercase">
                <th className="text-left px-3 py-3 font-semibold">Kod</th>
                <th className="text-left px-3 py-3 font-semibold">Parça Adı</th>
                <th className="text-left px-3 py-3 font-semibold">Profil</th>
                <th className="text-right px-3 py-3 font-semibold">Kalınlık</th>
                <th className="text-left px-3 py-3 font-semibold">Kenarlar (mm)</th>
                <th className="text-right px-3 py-3 font-semibold">Açılım</th>
                <th className="text-right px-3 py-3 font-semibold">Uzunluk</th>
                <th className="text-right px-3 py-3 font-semibold">Adet</th>
                <th className="text-right px-3 py-3 font-semibold">Birim (kg)</th>
                <th className="text-right px-3 py-3 font-semibold">Toplam (kg)</th>
                <th className="text-right px-3 py-3 font-semibold">Galv (kg)</th>
                <th className="text-right px-3 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {parts.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="font-medium">Henüz parça eklenmedi</p>
                      <p className="text-xs">Yukarıdaki "Parça Ekle" butonuna tıklayarak başlayın</p>
                    </div>
                  </td>
                </tr>
              )}
              {parts.map((p) => {
                const empty = isPlaceholderPart(p);
                return (
                  <tr
                    key={p.id}
                    onClick={() => handleEdit(p)}
                    className={`border-b border-slate-100 transition-colors cursor-pointer group ${empty ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-primary-50/30'}`}
                    title="Detayı düzenlemek için tıklayın"
                  >
                    <td className="px-3 py-2.5">
                      <Badge variant={empty ? 'warning' : 'outline'} className="font-mono">{p.code}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-medium hover:text-primary inline-flex items-center gap-1.5 ${empty ? 'text-amber-800' : 'text-slate-900'}`}>
                        {p.name}
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                      </span>
                    </td>
                    {empty ? (
                      <td colSpan={9} className="px-3 py-2.5 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Detay girilmedi — düzenlemek için tıklayın
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2.5 text-sm text-slate-600">{profileLabel(p.profileType)}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-slate-700 tabular-nums">{formatNumber(p.thickness, 1)} mm</td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 font-mono">
                          <div className="flex flex-wrap gap-1">
                            {p.edges.map((e, i) => (
                              <span key={i} className="inline-flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5">
                                <span className="text-primary-dark font-bold">{String.fromCharCode(97 + i)}</span>
                                <span className="text-slate-600">{e}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm text-slate-900 tabular-nums bg-accent-yellow/20 font-semibold">{formatNumber(p.developedWidth, 1)}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-slate-700 tabular-nums">{formatNumber(p.length, 0)}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-slate-700 tabular-nums">{p.quantityPerTable}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-slate-900 tabular-nums bg-accent-yellow/20 font-semibold">{formatNumber(p.unitWeight, 3)}</td>
                        <td className="px-3 py-2.5 text-right text-sm font-bold text-slate-900 tabular-nums">{formatNumber(p.totalWeightPerTable, 2)}</td>
                        <td className="px-3 py-2.5 text-right text-sm text-slate-700 tabular-nums">{formatNumber(p.galvanizingWeight, 2)}</td>
                      </>
                    )}
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        {!empty && <Button size="sm" variant="ghost" onClick={() => handleClone(p)} title="Kopyala"><Copy className="w-3.5 h-3.5" /></Button>}
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(p)} title="Düzenle"><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700" title="Sil"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {parts.length > 0 && (
                <tr className="bg-primary-50/60 border-t-2 border-primary/30">
                  <td colSpan={9} className="px-3 py-3 text-right text-sm font-bold text-primary-dark">
                    TEK MASA TOPLAM (kg)
                  </td>
                  <td className="px-3 py-3 text-right text-base font-bold text-primary-dark tabular-nums">
                    {formatNumber(parts.reduce((s, p) => s + p.totalWeightPerTable, 0), 2)}
                  </td>
                  <td className="px-3 py-3 text-right text-base font-bold text-primary-dark tabular-nums">
                    {formatNumber(parts.reduce((s, p) => s + p.galvanizingWeight, 0), 2)}
                  </td>
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
