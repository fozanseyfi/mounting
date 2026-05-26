'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wallet, Save, Loader2, TrendingUp, Truck, Hammer, Package, Coins, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import type { Project, PricingConfig, CostBreakdown } from '@/types';
import { calculateCost } from '@/lib/calculations/totals';
import { formatNumber } from '@/lib/utils';

const CURRENCIES = [
  { value: 'TRY', label: '₺ TL (Türk Lirası)', sym: '₺' },
  { value: 'USD', label: '$ USD', sym: '$' },
  { value: 'EUR', label: '€ EUR', sym: '€' },
];

const DEFAULT: PricingConfig = {
  steelPricePerKg: 0,
  galvanizingPricePerKg: 0,
  bendLaborPerKg: 0,
  fastenerPricePerKg: 0,
  transportationFlat: 0,
  otherCosts: 0,
  currency: 'TRY',
  notes: '',
};

export function CostTab({ project, onChange }: { project: Project; onChange: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<PricingConfig>(project.pricing || DEFAULT);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(project.pricing || DEFAULT);
  }, [project.pricing]);

  const cost: CostBreakdown = useMemo(() => calculateCost(project.totals!, form), [project.totals, form]);
  const sym = CURRENCIES.find((c) => c.value === form.currency)?.sym || '₺';

  function update<K extends keyof PricingConfig>(k: K, v: PricingConfig[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setBusy(true);
    const res = await fetch(`/api/projects/${project.id}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      toast('Maliyet bilgileri kaydedildi', 'success');
      onChange();
    } else {
      toast('Kaydedilemedi', 'error');
    }
  }

  const t = project.totals!;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Birim Fiyatlar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Maliyet kalemlerini girin — toplam anında hesaplanır</p>
            </div>
            <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <PriceRow
              icon={<Package className="w-4 h-4" />}
              label="Çelik Sac Fiyatı"
              hint={`Toplam ${formatNumber(t.totalSteelWeight * 1000, 0)} kg × birim fiyat`}
              sym={sym}
              unit="kg"
              value={form.steelPricePerKg}
              onChange={(v) => update('steelPricePerKg', v)}
              subtotal={cost.steelCost}
            />
            <PriceRow
              icon={<Coins className="w-4 h-4" />}
              label="Galvaniz Kaplama Fiyatı"
              hint={`Galvaniz kütlesi ${formatNumber(t.totalGalvanizingWeight * 1000, 0)} kg × birim fiyat`}
              sym={sym}
              unit="kg"
              value={form.galvanizingPricePerKg}
              onChange={(v) => update('galvanizingPricePerKg', v)}
              subtotal={cost.galvanizingCost}
            />
            <PriceRow
              icon={<Hammer className="w-4 h-4" />}
              label="Büküm + İşçilik"
              hint={`Çelik kütlesinin kg'ı başına işçilik`}
              sym={sym}
              unit="kg çelik"
              value={form.bendLaborPerKg}
              onChange={(v) => update('bendLaborPerKg', v)}
              subtotal={cost.bendLaborCost}
            />
            <PriceRow
              icon={<Package className="w-4 h-4" />}
              label="Bağlantı Elemanları"
              hint={`Toplam ${formatNumber(t.totalFastenerWeight * 1000, 1)} kg × birim fiyat`}
              sym={sym}
              unit="kg"
              value={form.fastenerPricePerKg}
              onChange={(v) => update('fastenerPricePerKg', v)}
              subtotal={cost.fastenerCost}
            />
            <PriceRow
              icon={<Truck className="w-4 h-4" />}
              label="Nakliye (Sabit)"
              hint="Tüm projeye sabit nakliye gideri"
              sym={sym}
              unit=""
              flat
              value={form.transportationFlat}
              onChange={(v) => update('transportationFlat', v)}
              subtotal={cost.transportationCost}
            />
            <PriceRow
              icon={<Receipt className="w-4 h-4" />}
              label="Diğer Giderler"
              hint="Müşavirlik, montaj vb. sabit kalemler"
              sym={sym}
              unit=""
              flat
              value={form.otherCosts}
              onChange={(v) => update('otherCosts', v)}
              subtotal={cost.otherCosts}
            />
          </div>

          <div className="mt-6 space-y-2">
            <Label>Notlar</Label>
            <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} placeholder="Maliyet kalemleri hakkında notlar..." rows={2} />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <Button onClick={handleSave} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Maliyet Bilgilerini Kaydet
            </Button>
          </div>
        </div>

        {/* Live total */}
        <div className="lg:col-span-2 space-y-4">
          <div className="hero-gradient text-white rounded-xl p-6 shadow-lg">
            <p className="text-xs font-semibold text-white/80 uppercase">Toplam Çelik Maliyeti</p>
            <p className="text-4xl font-bold tabular-nums mt-1">
              {formatNumber(cost.totalCost, 0)} <span className="text-base font-medium opacity-80">{sym}</span>
            </p>
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-white/70 uppercase">/ MW</p>
                <p className="font-bold tabular-nums">{formatNumber(cost.costPerMW, 0)} {sym}</p>
              </div>
              <div>
                <p className="text-xs text-white/70 uppercase">/ ton</p>
                <p className="font-bold tabular-nums">{formatNumber(cost.costPerTon, 0)} {sym}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Kalem Dağılımı</h4>
            <CostRow label="Sac (Çelik)" value={cost.steelCost} total={cost.totalCost} sym={sym} color="bg-emerald-500" />
            <CostRow label="Galvaniz" value={cost.galvanizingCost} total={cost.totalCost} sym={sym} color="bg-amber-500" />
            <CostRow label="Büküm + İşçilik" value={cost.bendLaborCost} total={cost.totalCost} sym={sym} color="bg-blue-500" />
            <CostRow label="Bağlantı" value={cost.fastenerCost} total={cost.totalCost} sym={sym} color="bg-purple-500" />
            <CostRow label="Nakliye" value={cost.transportationCost} total={cost.totalCost} sym={sym} color="bg-orange-500" />
            <CostRow label="Diğer" value={cost.otherCosts} total={cost.totalCost} sym={sym} color="bg-slate-500" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Hesaplama Tabanı
            </h4>
            <div className="space-y-1 text-xs">
              <KV k="Toplam Çelik" v={`${formatNumber(t.totalSteelWeight * 1000, 0)} kg`} />
              <KV k="Toplam Galvaniz" v={`${formatNumber(t.totalGalvanizingWeight * 1000, 0)} kg`} />
              <KV k="Toplam Bağlantı" v={`${formatNumber(t.totalFastenerWeight * 1000, 1)} kg`} />
              <KV k="GRAND TOTAL" v={`${formatNumber(t.grandTotal, 2)} ton`} bold />
              <KV k="Kurulu Güç" v={`${formatNumber(t.totalPowerMW, 2)} MW`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ icon, label, hint, sym, unit, value, onChange, subtotal, flat }: {
  icon: React.ReactNode; label: string; hint: string; sym: string; unit: string;
  value: number; onChange: (v: number) => void; subtotal: number; flat?: boolean;
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="col-span-5">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <span className="text-primary">{icon}</span>
          {label}
        </p>
        <p className="text-[11px] text-slate-500 ml-6 mt-0.5">{hint}</p>
      </div>
      <div className="col-span-4 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{sym}</span>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="pl-7 pr-2 text-right tabular-nums"
          />
        </div>
        {!flat && <span className="text-xs text-slate-500 whitespace-nowrap">/ {unit}</span>}
      </div>
      <div className="col-span-3 text-right">
        <p className="text-[10px] text-slate-500 uppercase">Toplam</p>
        <p className="text-sm font-bold text-slate-900 tabular-nums">{formatNumber(subtotal, 0)} {sym}</p>
      </div>
    </div>
  );
}

function CostRow({ label, value, total, sym, color }: { label: string; value: number; total: number; sym: string; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-900 tabular-nums font-semibold">{formatNumber(value, 0)} {sym} <span className="text-slate-400 text-[10px]">({formatNumber(pct, 1)}%)</span></span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KV({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'border-t border-slate-200 pt-1 mt-1' : ''}`}>
      <span className="text-slate-500">{k}</span>
      <span className={`tabular-nums ${bold ? 'font-bold text-primary-dark' : 'font-medium text-slate-700'}`}>{v}</span>
    </div>
  );
}
