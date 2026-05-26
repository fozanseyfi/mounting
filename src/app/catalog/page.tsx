import { Library, Search } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/badge';
import { DIN_CATALOG } from '@/lib/constants/din-catalog';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const customs = await prisma.customFastenerLibrary.findMany({ orderBy: { createdAt: 'desc' } });

  const grouped = DIN_CATALOG.reduce<Record<string, typeof DIN_CATALOG>>((acc, c) => {
    if (!acc[c.code]) acc[c.code] = [];
    acc[c.code].push(c);
    return acc;
  }, {});

  return (
    <>
      <TopBar title="DIN Bağlantı Elemanı Kataloğu" subtitle="Yerleşik standart + Kullanıcı kütüphanesi" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatBox label="Katalog Kalemi" value={DIN_CATALOG.length} hint="DIN standart" />
          <StatBox label="Özel Kütüphane" value={customs.length} hint="Manuel ekleme" />
          <StatBox label="Standart Kod" value={Object.keys(grouped).length} hint="DIN933, DIN934..." />
        </div>

        {customs.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-amber-50 px-5 py-3 border-b border-amber-200">
              <h3 className="font-semibold text-amber-800">Kullanıcı Kütüphanesi (Manuel Eklenmiş)</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-600 uppercase">
                  <th className="text-left px-4 py-2.5">Kod</th>
                  <th className="text-left px-4 py-2.5">Detay</th>
                  <th className="text-left px-4 py-2.5">Ölçü</th>
                  <th className="text-left px-4 py-2.5">Uzunluk</th>
                  <th className="text-left px-4 py-2.5">Kalite</th>
                  <th className="text-right px-4 py-2.5">Ağırlık (kg)</th>
                </tr>
              </thead>
              <tbody>
                {customs.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5"><Badge variant="warning" className="font-mono">{c.universalCode}</Badge></td>
                    <td className="px-4 py-2.5 text-sm">{c.detail}</td>
                    <td className="px-4 py-2.5 text-sm font-mono">{c.size}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{c.length || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{c.grade}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums">{c.unitWeight.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {Object.entries(grouped).map(([code, items]) => (
          <div key={code} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-primary-50 px-5 py-3 border-b border-primary-100 flex items-center justify-between">
              <h3 className="font-semibold text-primary-dark">
                {code} <span className="text-sm text-slate-600 font-normal">({items[0].detail})</span>
              </h3>
              <span className="text-xs text-slate-500">{items.length} kalem</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-600 uppercase">
                  <th className="text-left px-4 py-2.5">Ölçü</th>
                  <th className="text-left px-4 py-2.5">Uzunluk</th>
                  <th className="text-left px-4 py-2.5">Kalite</th>
                  <th className="text-right px-4 py-2.5">Birim Ağırlık (kg)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm font-mono">{it.size}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{it.length || '—'}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{it.grade}</td>
                    <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums">{it.weight.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </main>
    </>
  );
}

function StatBox({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{hint}</p>
        </div>
        <div className="w-11 h-11 rounded-xl hero-gradient flex items-center justify-center text-white">
          <Library className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
