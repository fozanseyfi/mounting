import Link from 'next/link';
import { Share2, ArrowRight, ShieldCheck, Eye, FolderKanban, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SharePage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  return (
    <main className="flex-1 p-6">
      <PageHeader
        title="Public Paylaşım"
        description="Müşteriye/yatırımcıya read-only proje linki gönderin"
        icon={Share2}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <FeatureCard
          icon={Eye}
          title="Read-only erişim"
          text="Linki açan kişi sadece görüntüleyebilir; değişiklik yapamaz, dışarı aktaramaz."
        />
        <FeatureCard
          icon={Lock}
          title="Süre + iptal"
          text="30 günlük token üretilir, istediğiniz an iptal edebilirsiniz."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Maliyet gizliliği"
          text="Birim fiyat / toplam maliyet kalemleri public linkte gizlenir."
        />
      </div>

      <Alert variant="info" className="mb-4">
        Paylaşım <strong>proje bazında</strong> oluşturulur. Aşağıdaki listeden bir projeyi açıp{' '}
        <strong>"Public Link Oluştur"</strong> butonu ile token üretebilirsiniz. (Public link özelliği
        sonraki sürümde aktifleştirilecek.)
      </Alert>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-text tracking-tight">Projelerim</h3>
            <p className="text-xs text-text2 mt-0.5">Bir projeyi seçin ve içinden paylaşım linki üretin</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/projects">
              Tüm Projeler <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
        <div>
          {projects.length === 0 ? (
            <div className="px-6 py-12 text-center text-text3 text-sm">
              Henüz proje yok.
              <Link href="/projects/new" className="text-brand font-semibold ml-1 hover:underline">
                İlk projenizi oluşturun
              </Link>
              .
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {projects.map((p) => (
                <li key={p.id} className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-bg2 transition-colors">
                  <div className="min-w-0 flex-1">
                    <Link href={`/projects/${p.id}`} className="font-semibold text-text hover:text-brand">
                      {p.name}
                    </Link>
                    <p className="text-xs text-text3 mt-0.5 inline-flex items-center gap-2 flex-wrap">
                      <span>{p.customer || '—'}</span>
                      <span>·</span>
                      <span>{formatDate(p.updatedAt)}</span>
                    </p>
                  </div>
                  <Badge variant="secondary">{p.status}</Badge>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/projects/${p.id}`}>
                      Aç <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 shadow-soft">
        <h3 className="font-display text-sm font-bold text-text tracking-tight mb-3 flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-brand" />
          Public Linkte Görünür Modüller
        </h3>
        <ul className="text-sm text-text2 space-y-1.5 list-disc list-inside ml-1">
          <li>Proje özeti (KPI: tonaj, MW, masa adedi)</li>
          <li>Masa tipleri ve her birinin tek-masa ağırlığı</li>
          <li>Sehpa parçaları + bağlantı elemanları detayı</li>
          <li>3D önizleme (read-only)</li>
          <li className="text-text3">Birim/toplam maliyet — <strong>gizli</strong></li>
          <li className="text-text3">Tedarikçi/fiyat detayları — <strong>gizli</strong></li>
        </ul>
      </div>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 text-brand shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h4 className="font-display text-sm font-bold text-text tracking-tight">{title}</h4>
          <p className="text-xs text-text2 mt-1 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
