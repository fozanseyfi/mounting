'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Boxes, Wallet, Box, FileBarChart } from 'lucide-react';
import type { Project, TableType } from '@/types';
import { TableTypesTab } from './TableTypesTab';
import { CostTab } from './CostTab';
import { SummaryTab } from './SummaryTab';

const TableDesigner = dynamic(() => import('./TableDesigner').then((m) => m.TableDesigner), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl">
      <p className="text-sm text-slate-500">Masa tasarımcısı yükleniyor...</p>
    </div>
  ),
});

export function ProjectTabs({ project }: { project: Project }) {
  const router = useRouter();
  function refresh() { router.refresh(); }

  return (
    <Tabs defaultValue="types" className="w-full">
      <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-3xl">
        <TabsTrigger value="types" className="gap-2"><Boxes className="w-4 h-4" /> Masa Tipleri <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{project.tableTypes.length}</span></TabsTrigger>
        <TabsTrigger value="cost" className="gap-2"><Wallet className="w-4 h-4" /> Maliyet</TabsTrigger>
        <TabsTrigger value="3d" className="gap-2"><Box className="w-4 h-4" /> 3D</TabsTrigger>
        <TabsTrigger value="summary" className="gap-2"><FileBarChart className="w-4 h-4" /> Özet & Rapor</TabsTrigger>
      </TabsList>

      <TabsContent value="types">
        <TableTypesTab project={project} onChange={refresh} />
      </TabsContent>
      <TabsContent value="cost">
        <CostTab project={project} onChange={refresh} />
      </TabsContent>
      <TabsContent value="3d">
        <DesignerWrapper project={project} />
      </TabsContent>
      <TabsContent value="summary">
        <SummaryTab project={project} />
      </TabsContent>
    </Tabs>
  );
}

function DesignerWrapper({ project }: { project: Project }) {
  const [selectedId, setSelectedId] = useState<string>(project.tableTypes[0]?.id || '');
  const selected = project.tableTypes.find((t) => t.id === selectedId) || project.tableTypes[0];

  if (!selected) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
        <p className="text-slate-500">Masa tasarlamak için önce bir masa tipi ekleyin</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Masa Tipi:</span>
        {project.tableTypes.map((tt) => (
          <button
            key={tt.id}
            onClick={() => setSelectedId(tt.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedId === tt.id ? 'bg-primary text-white' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'}`}
          >
            {tt.name}
          </button>
        ))}
      </div>
      <TableDesigner tableType={selected} tiltAngle={project.tiltAngle} project={project} />
    </div>
  );
}
