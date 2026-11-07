'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ScrollText, Filter, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { readProfile, effectivePanelName } from '@/lib/local-profile';
import { getAudit, type AuditEntry } from '@/lib/local-admin';

const RESOURCE_LABELS: Record<string, string> = {
  project: 'Proje',
  share: 'Paylaşım',
  user: 'Kullanıcı',
  settings: 'Ayarlar',
};

const RESOURCE_BADGE_TONE: Record<string, string> = {
  project: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  share: 'bg-violet-50 text-violet-700 border-violet-200',
  user: 'bg-sky-50 text-sky-700 border-sky-200',
  settings: 'bg-amber-50 text-amber-700 border-amber-200',
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [orgName, setOrgName] = useState('Solar BOM');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');

  useEffect(() => {
    const load = () => {
      setLogs(getAudit());
      setOrgName(effectivePanelName(readProfile()) || 'Solar BOM');
    };
    load();
    window.addEventListener('admin:updated', load);
    return () => window.removeEventListener('admin:updated', load);
  }, []);

  const actionOptions = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((l) => map.set(l.action, l.actionLabel));
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [logs]);

  const filtered = logs.filter((l) => (!action || l.action === action) && (!resource || l.resourceType === resource));
  const hasActiveFilter = Boolean(action) || Boolean(resource);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hero */}
        <Card className="overflow-hidden border-emerald-200 shadow-sm">
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <ScrollText className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">Yönetici Paneli</p>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Aktivite Kayıtları</h1>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    <strong className="text-slate-900">{orgName}</strong> panelindeki kim-ne-ne zaman kayıtları. Kayıt
                    silinmez, son 200 girişi listeler. Bir satıra tıkla → değişiklik detayları açılır.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtreler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4" /> Filtrele
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Aksiyon</label>
                <Select value={action || '__all__'} onValueChange={(v) => setAction(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm aksiyonlar</SelectItem>
                    {actionOptions.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Kaynak Türü</label>
                <Select value={resource || '__all__'} onValueChange={(v) => setResource(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tüm türler</SelectItem>
                    {Object.entries(RESOURCE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilter && (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAction('');
                    setResource('');
                  }}
                  className="gap-1.5"
                >
                  <X className="size-3.5" /> Filtreleri Temizle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="size-4" /> Son Kayıtlar ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                {hasActiveFilter
                  ? 'Bu filtreye uygun kayıt bulunamadı.'
                  : 'Henüz aktivite kaydı yok. Bir kullanıcı bir kaydetme işlemi yaptığında burada görünecek.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted text-muted-foreground">
                      <th className="px-4 py-2.5 text-left font-medium">Zaman</th>
                      <th className="px-4 py-2.5 text-left font-medium">Kullanıcı</th>
                      <th className="px-4 py-2.5 text-left font-medium">Aksiyon</th>
                      <th className="px-4 py-2.5 text-left font-medium">Kaynak</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((l) => {
                      const isOpen = expanded === l.id;
                      const hasDetails = l.details && Object.keys(l.details).length > 0;
                      return (
                        <Fragment key={l.id}>
                          <tr
                            className={cn(
                              'transition-colors',
                              hasDetails && 'cursor-pointer hover:bg-muted/40',
                              isOpen && 'bg-muted/30'
                            )}
                            onClick={() => hasDetails && setExpanded(isOpen ? null : l.id)}
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                              {formatDateTime(l.createdAt)}
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">{l.actorName}</td>
                            <td className="px-4 py-3 text-foreground">{l.actionLabel}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'w-fit text-[10px] font-semibold',
                                    RESOURCE_BADGE_TONE[l.resourceType] ?? 'border-slate-200 bg-slate-50 text-slate-700'
                                  )}
                                >
                                  {RESOURCE_LABELS[l.resourceType] ?? l.resourceType}
                                </Badge>
                                {l.resourceName && <span className="text-xs text-foreground">{l.resourceName}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {hasDetails &&
                                (isOpen ? (
                                  <ChevronDown className="ml-auto size-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                                ))}
                            </td>
                          </tr>
                          {isOpen && hasDetails && (
                            <tr className="bg-muted/30">
                              <td colSpan={5} className="px-4 py-3">
                                <pre className="overflow-x-auto rounded-md border bg-card p-3 text-[11px] text-foreground">
                                  {JSON.stringify(l.details, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
