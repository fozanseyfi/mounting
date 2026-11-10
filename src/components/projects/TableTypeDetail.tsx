'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Boxes, Wrench, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TableType, SehpaPart, Fastener } from '@/types';
import { PartsTab } from './PartsTab';
import { FastenersTab } from './FastenersTab';

interface Props {
  projectId: string;
  tableType: TableType;
  onChange: () => void;
  /** Satırın sağına eklenecek düğmeler (masa tipini düzenle / sil) */
  actions?: React.ReactNode;
}

const SUB =
  '-mb-px rounded-none border-b-2 border-transparent px-3 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-800 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none';

export function TableTypeDetail({ projectId, tableType, onChange, actions }: Props) {
  const [parts, setParts] = useState<SehpaPart[]>(tableType.parts);
  const [fasteners, setFasteners] = useState<Fastener[]>(tableType.fasteners);
  const [tab, setTab] = useState<'parts' | 'fasteners'>('parts');
  // Ekle düğmesi sekme satırında; ilgili tabloya "yeni kayıt aç" sinyali gönderir
  const [addParts, setAddParts] = useState(0);
  const [addFasteners, setAddFasteners] = useState(0);

  // Sync local state when the selected table type changes (e.g. user clicks another card)
  useEffect(() => {
    setParts(tableType.parts);
    setFasteners(tableType.fasteners);
  }, [tableType.id, tableType.parts, tableType.fasteners]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'parts' | 'fasteners')} className="w-full">
      {/* Tek satır: tip adı · sekmeler · Ekle · düzenle/sil — kaydırırken üstte kalır */}
      <div className="sticky top-14 z-10 -mx-4 -mt-4 flex items-center gap-2 rounded-t-md border-b bg-white px-4 pt-1.5">
        <h4 className="mr-2 shrink-0 pb-1.5 text-sm font-bold text-slate-900">{tableType.name}</h4>
        <TabsList className="h-auto min-w-0 flex-1 justify-start gap-1 overflow-visible rounded-none bg-transparent p-0">
          <TabsTrigger value="parts" className={SUB}>
            <Boxes className="w-4 h-4" /> Sehpa Parçaları
            <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{parts.length}</span>
          </TabsTrigger>
          <TabsTrigger value="fasteners" className={SUB}>
            <Wrench className="w-4 h-4" /> Bağlantı Elemanları
            <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{fasteners.length}</span>
          </TabsTrigger>
        </TabsList>
        <div className="flex shrink-0 items-center gap-1 pb-1.5">
          {tab === 'parts' ? (
            <Button size="sm" onClick={() => setAddParts((n) => n + 1)}>
              <Plus className="w-3.5 h-3.5" /> Parça Ekle
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAddFasteners((n) => n + 1)}>
              <Plus className="w-3.5 h-3.5" /> Bağlantı Elemanı Ekle
            </Button>
          )}
          {actions}
        </div>
      </div>
      <TabsContent className="mt-3" value="parts">
        <PartsTab projectId={projectId} tableTypeId={tableType.id} parts={parts} setParts={setParts} onChange={onChange} addSignal={addParts} />
      </TabsContent>
      <TabsContent className="mt-3" value="fasteners">
        <FastenersTab projectId={projectId} tableTypeId={tableType.id} fasteners={fasteners} setFasteners={setFasteners} onChange={onChange} addSignal={addFasteners} />
      </TabsContent>
    </Tabs>
  );
}
