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
      <TabsList className="grid grid-cols-2 w-full max-w-lg">
        <TabsTrigger value="parts" className="gap-2">
          <Boxes className="w-4 h-4" /> Sehpa Parçaları
          <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{parts.length}</span>
        </TabsTrigger>
        <TabsTrigger value="fasteners" className="gap-2">
          <Wrench className="w-4 h-4" /> Bağlantı Elemanları
          <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{fasteners.length}</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="parts">
        <PartsTab projectId={projectId} tableTypeId={tableType.id} parts={parts} setParts={setParts} onChange={onChange} />
      </TabsContent>
      <TabsContent value="fasteners">
        <FastenersTab projectId={projectId} tableTypeId={tableType.id} fasteners={fasteners} setFasteners={setFasteners} onChange={onChange} />
      </TabsContent>
    </Tabs>
  );
}
