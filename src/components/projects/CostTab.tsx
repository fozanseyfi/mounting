'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type { Project, PricingConfig, CostBreakdown } from '@/types';
import { calculateCost } from '@/lib/calculations/totals';
import { formatNumber } from '@/lib/utils';

/** Tüm maliyetler USD */
const DEFAULT: PricingConfig = {
  steelPricePerKg: 0,
  galvanizingPricePerKg: 0,
  bendLaborPerKg: 0,
  fastenerPricePerKg: 0,
  transportationFlat: 0,
  otherCosts: 0,
  currency: 'USD',
  notes: '',
};

const usd = (v: number, d = 0) => `${formatNumber(v, d)} USD`;

export function CostTab({ project, onChange }: { project: Project; onChange: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<PricingConfig>({ ...(project.pricing || DEFAULT), currency: 'USD' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({ ...(project.pricing || DEFAULT), currency: 'USD' });
  }, [project.pricing]);

  const t = project.totals!;
  const cost: CostBreakdown = useMemo(() => calculateCost(t, form), [t, form]);
  const tonPerMWp = t.totalPowerMW > 0 ? t.grandTotal / t.totalPowerMW : 0;

  function update<K extends keyof PricingConfig>(k: K, v: PricingConfig[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setBusy(true);
    const res = await fetch(`/api/projects/${project.id}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, currency: 'USD' }),
    });
    setBusy(false);
    if (res.ok) {
      toast('Maliyet bilgileri kaydedildi', 'success');
      onChange();
    } else {
      toast('Kaydedilemedi', 'error');
    }
  }

  const rows: {
    key: keyof PricingConfig;
    label: string;
    unit: string;
    qty: string;
    subtotal: number;
  }[] = [
    { key: 'steelPricePerKg', label: 'Çelik Sac', unit: 'USD / kg', qty: `${formatNumber(t.totalSteelWeight * 1000, 0)} kg`, subtotal: cost.steelCost },
    { key: 'galvanizingPricePerKg', label: 'Galvaniz Kaplama', unit: 'USD / kg', qty: `${formatNumber(t.totalGalvanizingWeight * 1000, 0)} kg`, subtotal: cost.galvanizingCost },
    { key: 'bendLaborPerKg', label: 'Büküm + İşçilik', unit: 'USD / kg çelik', qty: `${formatNumber(t.totalSteelWeight * 1000, 0)} kg`, subtotal: cost.bendLaborCost },
    { key: 'fastenerPricePerKg', label: 'Bağlantı Elemanları', unit: 'USD / kg', qty: `${formatNumber(t.totalFastenerWeight * 1000, 1)} kg`, subtotal: cost.fastenerCost },
    { key: 'transportationFlat', label: 'Nakliye', unit: 'USD (sabit)', qty: '—', subtotal: cost.transportationCost },
    { key: 'otherCosts', label: 'Diğer Giderler', unit: 'USD (sabit)', qty: '—', subtotal: cost.otherCosts },
  ];

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ---------- Sol: birim fiyat tablosu ---------- */}
      <section className="rounded-md border bg-white">
        <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Birim Fiyatlar</h3>
            <p className="text-[11px] text-slate-500">Tüm tutarlar USD — toplam anında hesaplanır</p>
          </div>
          <Button size="sm" onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Kaydet
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-[13px]">
            <thead>
              <tr className="bg-slate-100 text-[11px] text-slate-600">
                <th className="px-3 py-1.5 text-left font-semibold">Kalem</th>
                <th className="px-2 py-1.5 text-right font-semibold">Birim Fiyat</th>
                <th className="px-2 py-1.5 text-left font-semibold">Birim</th>
                <th className="px-2 py-1.5 text-right font-semibold">Miktar</th>
                <th className="px-3 py-1.5 text-right font-semibold">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-slate-100">
                  <td className="px-3 py-1 font-medium text-slate-800">{r.label}</td>
                  <td className="px-2 py-1 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={(form[r.key] as number) || ''}
                      onChange={(e) => update(r.key, (parseFloat(e.target.value) || 0) as never)}
                      placeholder="0"
                      className="h-7 w-28 rounded border border-slate-300 bg-white px-2 text-right tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-2 py-1 text-[12px] text-slate-500">{r.unit}</td>
                  <td className="px-2 py-1 text-right tabular-nums text-slate-600">{r.qty}</td>
                  <td className="px-3 py-1 text-right font-semibold tabular-nums text-slate-900">{usd(r.subtotal)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-primary-dark">
                <td colSpan={4} className="px-3 py-1.5 text-right text-xs">TOPLAM MALİYET</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{usd(cost.totalCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border-t px-3 py-2">
          <textarea
            value={form.notes || ''}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Maliyet kalemleri hakkında notlar..."
            rows={2}
            className="w-full resize-y rounded border border-slate-300 bg-white px-2 py-1.5 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </section>

      {/* ---------- Sağ: özet ---------- */}
      <aside className="space-y-3">
        <div className="rounded-md border bg-white">
          <div className="border-b bg-[#16304f] px-3 py-2 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Toplam Çelik Maliyeti</p>
            <p className="text-xl font-bold tabular-nums">{usd(cost.totalCost)}</p>
          </div>
          <dl className="divide-y text-[13px]">
            <div className="flex justify-between px-3 py-1.5">
              <dt className="text-slate-500">Birim maliyet</dt>
              <dd className="font-semibold tabular-nums text-slate-900">{formatNumber(cost.costPerMW, 0)} USD / MWp</dd>
            </div>
            <div className="flex justify-between px-3 py-1.5">
              <dt className="text-slate-500">Çelik yoğunluğu</dt>
              <dd className="font-semibold tabular-nums text-slate-900">{formatNumber(tonPerMWp, 1)} Ton / MWp</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border bg-white">
          <h4 className="border-b px-3 py-1.5 text-xs font-semibold text-slate-700">Kalem Dağılımı</h4>
          <table className="w-full whitespace-nowrap text-[12px]">
            <tbody>
              {[
                ['Sac (Çelik)', cost.steelCost],
                ['Galvaniz', cost.galvanizingCost],
                ['Büküm + İşçilik', cost.bendLaborCost],
                ['Bağlantı', cost.fastenerCost],
                ['Nakliye', cost.transportationCost],
                ['Diğer', cost.otherCosts],
              ].map(([label, v]) => {
                const pct = cost.totalCost > 0 ? ((v as number) / cost.totalCost) * 100 : 0;
                return (
                  <tr key={label as string} className="border-t border-slate-100 first:border-0">
                    <td className="px-3 py-1 text-slate-700">{label}</td>
                    <td className="w-14 px-1 py-1">
                      <div className="h-1.5 overflow-hidden rounded-sm bg-slate-100">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-1 py-1 text-right tabular-nums text-slate-500">{formatNumber(pct, 1)}%</td>
                    <td className="px-3 py-1 text-right font-semibold tabular-nums text-slate-900">{usd(v as number)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border bg-white">
          <h4 className="border-b px-3 py-1.5 text-xs font-semibold text-slate-700">Hesaplama Tabanı</h4>
          <dl className="space-y-0.5 px-3 py-1.5 text-[12px]">
            <KV k="Toplam Çelik" v={`${formatNumber(t.totalSteelWeight * 1000, 0)} kg`} />
            <KV k="Toplam Galvaniz" v={`${formatNumber(t.totalGalvanizingWeight * 1000, 0)} kg`} />
            <KV k="Toplam Bağlantı" v={`${formatNumber(t.totalFastenerWeight * 1000, 1)} kg`} />
            <KV k="GRAND TOTAL" v={`${formatNumber(t.grandTotal, 2)} ton`} bold />
            <KV k="Kurulu Güç" v={`${formatNumber(t.totalPowerMW, 2)} MWp`} />
          </dl>
        </div>
      </aside>
    </div>
  );
}

function KV({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'mt-0.5 border-t border-slate-200 pt-0.5' : ''}`}>
      <dt className="text-slate-500">{k}</dt>
      <dd className={`tabular-nums ${bold ? 'font-bold text-primary-dark' : 'font-medium text-slate-700'}`}>{v}</dd>
    </div>
  );
}
