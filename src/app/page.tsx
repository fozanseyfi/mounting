import Link from 'next/link';
import { Plus, Layers, Weight, Zap, FolderKanban, TrendingUp, Activity, ArrowRight, Calendar } from 'lucide-react';
import { prisma, safeQuery } from '@/lib/db';
import { DbWarning } from '@/components/layout/DbWarning';
import { mapProject } from '@/lib/projectMapper';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ProjectTonnageChart, MaterialBreakdownChart } from '@/components/dashboard/DashboardCharts';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatDate } from '@/lib/utils';
import { PROJECT_STATUS } from '@/lib/constants/steel';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { data: rawProjects, dbError } = await safeQuery(() => prisma.project.findMany({
    include: {
      tableTypes: { include: { parts: true, fasteners: true } },
      pricing: true,
    },
    orderBy: { updatedAt: 'desc' },
  }), []);
  const projects = rawProjects.map(mapProject);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const grandTonnage = projects.reduce((sum, p) => sum + (p.totals?.grandTotal || 0), 0);
  const totalPowerMW = projects.reduce((sum, p) => sum + (p.totals?.totalPowerMW || 0), 0);
  const totalPanels = projects.reduce((sum, p) => sum + (p.totals?.totalPanels || 0), 0);
  const totalSteel = projects.reduce((sum, p) => sum + (p.totals?.totalSteelWeight || 0), 0);
  const totalGalvanizing = projects.reduce((sum, p) => sum + (p.totals?.totalGalvanizingWeight || 0), 0);
  const totalFasteners = projects.reduce((sum, p) => sum + (p.totals?.totalFastenerWeight || 0), 0);
  const avgKgPerMW = totalPowerMW > 0 ? (grandTonnage * 1000) / totalPowerMW : 0;

  const chartData = projects.slice(0, 8).reverse().map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name,
    ton: p.totals?.grandTotal || 0,
    mw: p.totals?.totalPowerMW || 0,
  }));

  const pieData = [
    { name: 'Sac (Çelik)', value: totalSteel },
    { name: 'Galvaniz Kaplama', value: totalGalvanizing },
    { name: 'Bağlantı Elemanı', value: totalFasteners },
  ];

  return (
    <>
      <TopBar title="Dashboard" subtitle="Solar GES konstrüksiyon projelerinin genel görünümü" />

      <main className="flex-1 p-6 space-y-6">
        <DbWarning show={dbError} />
        {/* Hero / Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl hero-gradient p-8 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Hoş geldiniz</p>
            <h2 className="text-3xl font-bold mt-2">Solar BOM Hesaplama Platformu</h2>
            <p className="text-white/80 mt-2 leading-relaxed">
              Solar Güneş Enerjisi Santrali projelerinizde çelik konstrüksiyonun toplam ağırlığını,
              galvaniz kaplama, bağlantı elemanları ve sac fire dahil tek tıkla hesaplayın.
            </p>
            <div className="flex gap-3 mt-5">
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link href="/projects/new">
                  <Plus className="w-4 h-4" />
                  Yeni Proje Oluştur
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Link href="/projects">
                  Tüm Projeleri Gör
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="white">
              <circle cx="100" cy="100" r="80" />
              <circle cx="100" cy="100" r="60" />
              <circle cx="100" cy="100" r="40" />
            </svg>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Toplam Proje"
            value={String(totalProjects)}
            subValue={`${activeProjects} aktif`}
            icon={FolderKanban}
            gradient="kpi-gradient-green"
          />
          <KpiCard
            label="Toplam Tonaj"
            value={formatNumber(grandTonnage)}
            subValue="ton"
            icon={Weight}
            gradient="kpi-gradient-blue"
          />
          <KpiCard
            label="Kurulu Güç"
            value={formatNumber(totalPowerMW)}
            subValue={`MW · ${formatNumber(totalPanels, 0)} panel`}
            icon={Zap}
            gradient="kpi-gradient-orange"
          />
          <KpiCard
            label="Ortalama"
            value={formatNumber(avgKgPerMW, 1)}
            subValue="kg / MW"
            icon={TrendingUp}
            gradient="kpi-gradient-purple"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Proje Bazlı Tonaj Karşılaştırması
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Son 8 projenin toplam çelik ağırlığı</p>
              </div>
            </div>
            <ProjectTonnageChart data={chartData} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Malzeme Dağılımı
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Toplam tonaj kırılımı</p>
            </div>
            <MaterialBreakdownChart data={pieData} />
          </div>
        </div>

        {/* Recent projects table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Son Projeler</h3>
              <p className="text-xs text-slate-500 mt-0.5">En son güncellenmiş projeler</p>
            </div>
            <Button asChild variant="soft" size="sm">
              <Link href="/projects">
                Tümünü Gör
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-3">Proje Adı</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-3">Müşteri</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-3">Masa</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-3">Tonaj</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-3">Güç (MW)</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-3">Durum</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase px-6 py-3">Güncellendi</th>
                  <th className="text-right text-xs font-semibold text-slate-600 uppercase px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <FolderKanban className="w-7 h-7 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Henüz proje yok</p>
                          <p className="text-sm text-slate-500 mt-1">İlk projenizi oluşturmak için aşağıdaki butona tıklayın</p>
                        </div>
                        <Button asChild size="sm" className="mt-2">
                          <Link href="/projects/new">
                            <Plus className="w-4 h-4" />
                            İlk Projeyi Oluştur
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {projects.slice(0, 6).map((p) => {
                  const status = PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS] || PROJECT_STATUS.DRAFT;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-primary">
                          {p.name}
                        </Link>
                        {p.location && <p className="text-xs text-slate-500 mt-0.5">{p.location}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.customer || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 tabular-nums">{p.totals?.totalTables || 0}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 tabular-nums">
                        {formatNumber(p.totals?.grandTotal || 0)} <span className="text-xs text-slate-500 font-normal">ton</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 tabular-nums">{formatNumber(p.totals?.totalPowerMW || 0)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(p.updatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/projects/${p.id}`}>
                            Aç <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
