'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Boxes, Wrench } from 'lucide-react';
import type { TableType, SehpaPart, Fastener } from '@/types';
import { PartsTab } from './PartsTab';
import { FastenersTab } from './FastenersTab';

interface Props {
  projectId: string;
  tableType: TableType;
  onChange: () => void;
}

const SUB =
  '-mb-px rounded-none border-b-2 border-transparent px-3 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-800 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none';

export function TableTypeDetail({ projectId, tableType, onChange }: Props) {
  const [parts, setParts] = useState<SehpaPart[]>(tableType.parts);
  const [fasteners, setFasteners] = useState<Fastener[]>(tableType.fasteners);

  // Sync local state when the selected table type changes (e.g. user clicks another card)
  useEffect(() => {
    setParts(tableType.parts);
    setFasteners(tableType.fasteners);
  }, [tableType.id, tableType.parts, tableType.fasteners]);

  return (
    <Tabs defaultValue="parts" className="w-full">
      <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="parts" className={SUB}>
          <Boxes className="w-4 h-4" /> Sehpa Parçaları
          <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{parts.length}</span>
        </TabsTrigger>
        <TabsTrigger value="fasteners" className={SUB}>
          <Wrench className="w-4 h-4" /> Bağlantı Elemanları
          <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{fasteners.length}</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent className="mt-3" value="parts">
        <PartsTab projectId={projectId} tableTypeId={tableType.id} parts={parts} setParts={setParts} onChange={onChange} />
      </TabsContent>
      <TabsContent className="mt-3" value="fasteners">
        <FastenersTab projectId={projectId} tableTypeId={tableType.id} fasteners={fasteners} setFasteners={setFasteners} onChange={onChange} />
      </TabsContent>
    </Tabs>
  );
}
