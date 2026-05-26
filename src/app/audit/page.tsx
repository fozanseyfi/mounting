import { History } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { TableWrap, Table, THead, TBody, TR, TH, Empty } from '@/components/ui/table-primitives';

export default function AuditPage() {
  return (
    <main className="flex-1 p-6">
      <PageHeader
        title="Aktivite Kayıtları"
        description="Sistem üzerindeki yazma işlemlerinin kaydı"
        icon={History}
      />

      <Alert variant="info" className="mb-4">
        Lokal sürümde audit log iskelet halinde. Supabase entegrasyonu sonrası tüm yazma işlemleri
        (proje oluşturma/güncelleme, parça ekleme/silme, fiyat değişikliği, vb.) burada listelenecek.
      </Alert>

      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-soft">
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>Tarih</TH>
                <TH>Kullanıcı</TH>
                <TH>Aksiyon</TH>
                <TH>Varlık</TH>
              </TR>
            </THead>
            <TBody>
              <Empty colSpan={4}>Henüz kayıt yok.</Empty>
            </TBody>
          </Table>
        </TableWrap>
      </div>
    </main>
  );
}
