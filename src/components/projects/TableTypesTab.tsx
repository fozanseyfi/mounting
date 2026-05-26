'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatNumber } from '@/lib/utils';
import type { Project, TableType } from '@/types';
import { TableTypeFormDialog } from './TableTypeFormDialog';
import { TableTypeDetail } from './TableTypeDetail';

interface Props {
  project: Project;
  onChange: () => void;
}

export function TableTypesTab({ project, onChange }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<TableType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(project.tableTypes[0]?.id || null);
  const { toast } = useToast();

  const selected = project.tableTypes.find((t) => t.id === selectedId) || null;

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" masa tipini silmek istediğinize emin misiniz? Tüm parçaları ve bağlantı elemanları da silinir.`)) return;
    const res = await fetch(`/api/projects/${project.id}/table-types/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Masa tipi silindi', 'success');
      if (selectedId === id) setSelectedId(null);
      onChange();
    } else {
      toast('Silinemedi', 'error');
    }
  }

  return (
    <div className="space-y-4">
      {/* Table type cards */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Masa Tipleri
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Projenizde kaç farklı sehpa konfigürasyonu varsa her birini tip olarak ekleyin</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpenForm(true); }}>
          <Plus className="w-4 h-4" />
          Masa Tipi Ekle
        </Button>
      </div>

      {project.tableTypes.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-7 h-7 text-primary" />
          </div>
          <h4 className="font-semibold text-slate-900">Henüz masa tipi yok</h4>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Bir projede birden fazla masa tipi olabilir. Örn. Tip-1 (28 panel, 80 adet) + Tip-2 (32 panel, 20 adet).
          </p>
          <Button className="mt-4" onClick={() => { setEditing(null); setOpenForm(true); }}>
            <Plus className="w-4 h-4" />
            İlk Masa Tipini Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {project.tableTypes.map((tt) => {
            const isSelected = selectedId === tt.id;
            const t = tt.totals;
            return (
              <div
                key={tt.id}
                className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/40'}`}
                onClick={() => setSelectedId(tt.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{tt.name}</p>
                    {tt.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{tt.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing(tt); setOpenForm(true); }} title="Düzenle">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(tt.id, tt.name); }} className="text-red-600 hover:bg-red-50 hover:text-red-700" title="Sil">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Mini label="Masa" value={String(tt.tableCount)} />
                  <Mini label="Panel/Masa" value={String(tt.panelsPerTable)} />
                  <Mini label="Parça" value={String(tt.parts.length)} />
                </div>

                <div className="border-t border-slate-100 pt-2.5 space-y-1">
                  <KV label="Tek Masa" value={`${formatNumber(t?.totalWeightPerTable || 0)} kg`} />
                  <KV label="Toplam Çelik" value={`${formatNumber(t?.grandTotal || 0)} ton`} bold />
                  <KV label="Bu Tip Güç" value={`${formatNumber(t?.totalPowerMW || 0)} MW`} />
                </div>

                <Button size="sm" variant={isSelected ? 'default' : 'soft'} className="w-full mt-3" onClick={(e) => { e.stopPropagation(); setSelectedId(tt.id); }}>
                  {isSelected ? 'Düzenleniyor' : 'Aç'} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected type detail (parts + fasteners) */}
      {selected && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Düzenlenen Masa Tipi</p>
              <h4 className="text-lg font-bold text-slate-900">{selected.name}</h4>
            </div>
            <Badge variant="info">{selected.tableCount} masa · {selected.panelsPerTable} panel/masa</Badge>
          </div>

          <TableTypeDetail projectId={project.id} tableType={selected} onChange={onChange} />
        </div>
      )}

      <TableTypeFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        projectId={project.id}
        editing={editing}
        onSaved={() => { setOpenForm(false); onChange(); }}
      />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <p className="text-[10px] text-slate-500 uppercase font-medium">{label}</p>
      <p className="text-sm font-bold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold text-primary-dark' : 'font-medium text-slate-700'}`}>{value}</span>
    </div>
  );
}
