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

const TAB =
  'rounded-b-none rounded-t px-4 py-2 text-[13px] font-semibold text-[#b3c2d8] hover:bg-white/10 hover:text-white data-[state=active]:bg-[#f4f5f7] data-[state=active]:text-[#16304f] data-[state=active]:shadow-none data-[state=active]:hover:bg-[#f4f5f7]';

export function ProjectTabs({ project }: { project: Project }) {
  const router = useRouter();
  function refresh() { router.refresh(); }

  return (
    <Tabs defaultValue="types" className="w-full">
      {/* Fizibilite model sekmeleri gibi: koyu şerit, aktif sekme açık zemin (içerik ile birleşir) */}
      <TabsList className="project-tabs flex h-auto w-full justify-start gap-0.5 overflow-x-auto rounded-md rounded-b-none bg-[#16304f] p-1 pb-0 text-[#b3c2d8]">
        <TabsTrigger value="types" className={TAB}><Boxes className="w-4 h-4" /> Masa Tipleri <span className="ml-1 rounded bg-white/15 px-1.5 text-[11px] tabular-nums">{project.tableTypes.length}</span></TabsTrigger>
        <TabsTrigger value="cost" className={TAB}><Wallet className="w-4 h-4" /> Maliyet</TabsTrigger>
        <TabsTrigger value="3d" className={TAB}><Box className="w-4 h-4" /> 3D</TabsTrigger>
        <TabsTrigger value="summary" className={TAB}><FileBarChart className="w-4 h-4" /> Özet & Rapor</TabsTrigger>
      </TabsList>

      <TabsContent className="mt-0 rounded-b-md border border-t-0 bg-[#f4f5f7] p-3" value="types">
        <TableTypesTab project={project} onChange={refresh} />
      </TabsContent>
      <TabsContent className="mt-0 rounded-b-md border border-t-0 bg-[#f4f5f7] p-3" value="cost">
        <CostTab project={project} onChange={refresh} />
      </TabsContent>
      <TabsContent className="mt-0 rounded-b-md border border-t-0 bg-[#f4f5f7] p-3" value="3d">
        <DesignerWrapper project={project} />
      </TabsContent>
      <TabsContent className="mt-0 rounded-b-md border border-t-0 bg-[#f4f5f7] p-3" value="summary">
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
