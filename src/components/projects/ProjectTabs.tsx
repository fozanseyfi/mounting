'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Boxes, Wallet, Box, FileBarChart, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
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

/** Sekme şeridinin sağındaki mavi Excel / PDF rapor düğmeleri */
function ExportButtons({ project }: { project: Project }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<'xlsx' | 'pdf' | null>(null);
  const ready = (project.totals?.grandTotal || 0) > 0;

  async function run(kind: 'xlsx' | 'pdf') {
    setBusy(kind);
    try {
      if (kind === 'pdf') {
        const { downloadPDF } = await import('@/lib/export/pdf');
        await downloadPDF(project);
        toast('PDF raporu indirildi', 'success');
      } else {
        const { downloadExcel } = await import('@/lib/export/excel');
        await downloadExcel(project);
        toast('Excel raporu indirildi', 'success');
      }
    } catch {
      toast(kind === 'pdf' ? 'PDF oluşturulamadı' : 'Excel oluşturulamadı', 'error');
    } finally {
      setBusy(null);
    }
  }

  const base =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  // Fizibilite model başlığı: ghost (çerçeveli) + primary (beyaz zemin, lacivert yazı)
  const ghost = `${base} border-white/40 bg-transparent text-white hover:bg-white/10`;
  const primary = `${base} border-white bg-white text-[#16304f] hover:bg-[#e8eef6]`;
  const title = ready ? undefined : 'Önce masa tipi ve parça girin';

  return (
    <div className="flex shrink-0 items-center gap-1.5 self-center py-1">
      <button type="button" className={ghost} disabled={!ready || busy !== null} title={title} onClick={() => run('xlsx')}>
        {busy === 'xlsx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
        Excel Al
      </button>
      <button type="button" className={primary} disabled={!ready || busy !== null} title={title} onClick={() => run('pdf')}>
        {busy === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
        PDF Rapor Al
      </button>
    </div>
  );
}

export function ProjectTabs({ project }: { project: Project }) {
  const router = useRouter();
  function refresh() { router.refresh(); }

  return (
    <Tabs defaultValue="types" className="w-full">
      {/* Fizibilite model sekmeleri gibi: koyu şerit, aktif sekme açık zemin (içerik ile birleşir) */}
      <div className="project-tabs flex items-end gap-2 rounded-md rounded-b-none bg-[#16304f] pr-2">
        <TabsList className="flex h-auto min-w-0 flex-1 justify-start gap-0.5 overflow-x-auto rounded-none bg-transparent p-1 pb-0 text-[#b3c2d8]">
          <TabsTrigger value="types" className={TAB}><Boxes className="w-4 h-4" /> Masa Tipleri <span className="ml-1 rounded bg-white/15 px-1.5 text-[11px] tabular-nums">{project.tableTypes.length}</span></TabsTrigger>
          <TabsTrigger value="cost" className={TAB}><Wallet className="w-4 h-4" /> Maliyet</TabsTrigger>
          <TabsTrigger value="3d" className={TAB}><Box className="w-4 h-4" /> 3D</TabsTrigger>
          <TabsTrigger value="summary" className={TAB}><FileBarChart className="w-4 h-4" /> Özet & Rapor</TabsTrigger>
        </TabsList>
        <ExportButtons project={project} />
      </div>

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
