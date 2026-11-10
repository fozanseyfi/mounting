'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatNumber } from '@/lib/utils';
import { isPlaceholderPart } from '@/lib/constants/standard-parts';
import type { Project, TableType } from '@/types';
import { TableTypeFormDialog } from './TableTypeFormDialog';
import { TableTypeDetail } from './TableTypeDetail';

interface Props {
  project: Project;
  onChange: () => void;
}

/** Masa tipinin doluluk durumu: eksik kalemleri listeler */
function typeStatus(tt: TableType): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const empty = tt.parts.filter(isPlaceholderPart).length;
  if (tt.parts.length === 0) issues.push('Parça yok');
  else if (empty > 0) issues.push(`${empty} parça eksik`);
  if (tt.fasteners.length === 0) issues.push('Bağlantı elemanı yok');
  return { ok: issues.length === 0, issues };
}

export function TableTypesTab({ project, onChange }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<TableType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(project.tableTypes[0]?.id || null);
  const { toast } = useToast();

  // Seçili tip silinirse / yeni tip eklenirse seçimi geçerli tut
  useEffect(() => {
    if (!project.tableTypes.some((t) => t.id === selectedId)) {
      setSelectedId(project.tableTypes[project.tableTypes.length - 1]?.id || null);
    }
  }, [project.tableTypes, selectedId]);

  const selected = project.tableTypes.find((t) => t.id === selectedId) || null;
  const doneCount = project.tableTypes.filter((t) => typeStatus(t).ok).length;

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

  const openNew = () => { setEditing(null); setOpenForm(true); };

  if (project.tableTypes.length === 0) {
    return (
      <>
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <h4 className="font-semibold text-slate-900">Henüz masa tipi yok</h4>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Bir projede birden fazla masa tipi olabilir. Örn. Tip-1 (28 panel, 80 adet) + Tip-2 (32 panel, 20 adet).
          </p>
          <Button className="mt-4" onClick={openNew}>
            <Plus className="w-4 h-4" />
            İlk Masa Tipini Ekle
          </Button>
        </div>
        <TableTypeFormDialog open={openForm} onOpenChange={setOpenForm} projectId={project.id} editing={editing} onSaved={() => { setOpenForm(false); onChange(); }} />
      </>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)] items-start">
      {/* ---------- Sol: masa tipi listesi (sabit) ---------- */}
      <aside className="bg-white border border-slate-200 rounded-xl xl:sticky xl:top-[4.5rem] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-200 bg-slate-50">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" /> Masa Tipleri
            </p>
            <p className="text-[11px] text-slate-500">{doneCount}/{project.tableTypes.length} tamamlandı</p>
          </div>
          <Button size="sm" onClick={openNew} title="Masa tipi ekle">
            <Plus className="w-3.5 h-3.5" /> Ekle
          </Button>
        </div>

        <ul className="flex xl:flex-col overflow-x-auto xl:overflow-visible xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto divide-x xl:divide-x-0 xl:divide-y divide-slate-100">
          {project.tableTypes.map((tt) => {
            const isSel = tt.id === selectedId;
            const st = typeStatus(tt);
            return (
              <li key={tt.id} className="min-w-[200px] xl:min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(tt.id)}
                  className={`w-full text-left px-3 py-2.5 border-l-[3px] transition-colors ${isSel ? 'border-primary bg-primary-50' : 'border-transparent hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm font-semibold ${isSel ? 'text-primary-dark' : 'text-slate-900'}`}>{tt.name}</span>
                    {st.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-success" aria-label="Tamamlandı" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" aria-label="Eksik var" />
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-slate-500 tabular-nums">
                    <span>{tt.tableCount} masa · {tt.panelsPerTable} panel</span>
                    <span className="font-semibold text-slate-700">{formatNumber(tt.totals?.grandTotal || 0)} t</span>
                  </div>
                  {!st.ok && <p className="mt-0.5 text-[11px] font-medium text-amber-700 truncate">{st.issues.join(' · ')}</p>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ---------- Sağ: seçili tipin düzenleme alanı ---------- */}
      {selected && (
        <section className="bg-white border border-slate-200 rounded-xl min-w-0">
          <SelectedHeader
            tt={selected}
            onEdit={() => { setEditing(selected); setOpenForm(true); }}
            onDelete={() => handleDelete(selected.id, selected.name)}
          />
          <div className="p-4">
            <TableTypeDetail key={selected.id} projectId={project.id} tableType={selected} onChange={onChange} />
          </div>
        </section>
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

/** Düzenlenen tipin başlığı: kaydırırken üstte sabit kalır */
function SelectedHeader({ tt, onEdit, onDelete }: { tt: TableType; onEdit: () => void; onDelete: () => void }) {
  const t = tt.totals;
  const st = typeStatus(tt);
  return (
    <div className="sticky top-14 z-10 bg-white/95 backdrop-blur border-b border-slate-200 rounded-t-xl px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="min-w-0 mr-auto">
          <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Düzenlenen masa tipi</p>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900 truncate">{tt.name}</h4>
            {st.ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-soft-foreground bg-success-soft border border-success/30 rounded px-1.5 py-0.5">
                <CheckCircle2 className="w-3 h-3" /> Tamam
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                <AlertCircle className="w-3 h-3" /> {st.issues.join(' · ')}
              </span>
            )}
          </div>
        </div>
        <Stat label="Masa" value={String(tt.tableCount)} />
        <Stat label="Panel/Masa" value={String(tt.panelsPerTable)} />
        <Stat label="Tek Masa" value={`${formatNumber(t?.totalWeightPerTable || 0)} kg`} />
        <Stat label="Toplam" value={`${formatNumber(t?.grandTotal || 0)} t`} strong />
        <Stat label="Güç" value={`${formatNumber(t?.totalPowerMW || 0)} MWp`} />
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit} title="Masa tipini düzenle"><Edit2 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:bg-red-50 hover:text-red-700" title="Sil"><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="leading-tight">
      <p className="text-[10px] text-slate-500 uppercase font-medium">{label}</p>
      <p className={`text-sm tabular-nums ${strong ? 'font-bold text-primary-dark' : 'font-semibold text-slate-800'}`}>{value}</p>
    </div>
  );
}
