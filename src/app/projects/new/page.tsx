'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Save, Building2, Sun, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { logAudit } from '@/lib/local-admin';

const STEPS = [
  { id: 1, label: 'Proje Bilgisi', icon: Building2 },
  { id: 2, label: 'Panel Spesifikasyonu', icon: Sun },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    customer: '',
    location: '',
    description: '',
    panelWattage: 580,
    tiltAngle: 25,
  });

  const update = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function handleCreate() {
    if (!form.name.trim()) {
      toast('Proje adı zorunludur', 'error');
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'DRAFT' }),
      });
      if (res.ok) {
        const data = await res.json();
        logAudit('project.create', 'Proje oluşturuldu', 'project', form.name.trim());
        toast('Proje oluşturuldu — şimdi masa tipi ekleyin', 'success');
        router.push(`/projects/${data.id}`);
        return;
      }
      const err = await res.json().catch(() => null);
      toast(err?.error || 'Proje oluşturulamadı', 'error');
    } catch {
      toast('Sunucuya ulaşılamadı — proje oluşturulamadı', 'error');
    }
    setBusy(false);
  }

  function next() {
    if (step === 1 && !form.name.trim()) {
      toast('Proje adı zorunludur', 'error');
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  }

  return (
    <>
      <TopBar title="Yeni Proje" subtitle="Önce temel bilgiler — masa tiplerini sonra ekleyeceksiniz" />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Projelere dön
          </Link>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all', step >= s.id ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-400')}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <p className={cn('text-xs mt-2 font-medium whitespace-nowrap', step >= s.id ? 'text-slate-900' : 'text-slate-400')}>{s.label}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn('h-1 flex-1 mx-2 rounded-full transition-all', step > s.id ? 'bg-primary' : 'bg-slate-200')} />
                  )}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Proje Bilgileri</h3>
                  <p className="text-sm text-slate-500 mt-1">Projenizin temel bilgilerini girin.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="name">Proje Adı *</Label>
                    <Input id="name" placeholder="Örn: Antalya GES Saha-1" value={form.name} onChange={(e) => update('name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer">Müşteri</Label>
                    <Input id="customer" placeholder="Müşteri firma" value={form.customer} onChange={(e) => update('customer', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Lokasyon</Label>
                    <Input id="location" placeholder="Şehir / saha" value={form.location} onChange={(e) => update('location', e.target.value)} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea id="description" placeholder="Proje hakkında kısa not" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Panel Spesifikasyonu</h3>
                  <p className="text-sm text-slate-500 mt-1">Kullanılacak panelin gücü ve sehpa eğim açısı.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="panelWattage">Panel Gücü (Wp) *</Label>
                    <Input id="panelWattage" type="number" min={1} value={form.panelWattage} onChange={(e) => update('panelWattage', parseFloat(e.target.value) || 0)} />
                    <p className="text-xs text-slate-500">Tek panel gücü — toplam MW hesaplaması bu değerden yapılır</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiltAngle">Eğim Açısı (°)</Label>
                    <Input id="tiltAngle" type="number" step="0.1" min={0} max={45} value={form.tiltAngle} onChange={(e) => update('tiltAngle', parseFloat(e.target.value) || 0)} />
                    <p className="text-xs text-slate-500">Genel sehpa eğimi (yaygın: 20-30°)</p>
                  </div>
                </div>

                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mt-4">
                  <p className="text-sm font-semibold text-primary-dark">Sonraki Adım</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Proje oluşturulduktan sonra <b>masa tiplerini</b> tek tek tanımlayacaksınız.
                    Her tip için: ad, masa başına panel sayısı, masa adedi ve parçalar.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || busy}>
                <ArrowLeft className="w-4 h-4" /> Geri
              </Button>
              {step < STEPS.length ? (
                <Button onClick={next}>Devam Et <ArrowRight className="w-4 h-4" /></Button>
              ) : (
                <Button onClick={handleCreate} disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {busy ? 'Oluşturuluyor...' : 'Projeyi Oluştur'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
