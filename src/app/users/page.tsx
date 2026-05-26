'use client';

import { Users, Mail, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { TableWrap, Table, THead, TBody, TR, TH, TD, Empty } from '@/components/ui/table-primitives';
import { Badge } from '@/components/ui/badge';

/**
 * Local mod — auth eklenene kadar tek kullanıcı (mevcut profil) gösteriliyor.
 * Çoklu kullanıcı yönetimi Supabase entegrasyonu sonrası gelecek.
 */
export default function UsersPage() {
  return (
    <main className="flex-1 p-6">
      <PageHeader
        title="Kullanıcılar"
        description="Platforma erişimi olan tüm kullanıcılar"
        icon={Users}
      />

      <Alert variant="info" className="mb-4">
        Lokal sürümde kullanıcı yönetimi tek hesap üzerinden çalışır. Çoklu kullanıcı + rol yönetimi
        Supabase entegrasyonu sonrası aktif olacak.
      </Alert>

      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-soft">
        <div className="mb-4">
          <h3 className="font-display text-sm font-bold text-text tracking-tight">Mevcut Kullanıcı</h3>
        </div>
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>Ad Soyad</TH>
                <TH>E-posta</TH>
                <TH>Rol</TH>
                <TH>Durum</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD className="font-semibold text-text">Ozan Seyfi</TD>
                <TD className="text-text2 inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-text3" />
                  ozan.seyfi@kontrolmatik.com
                </TD>
                <TD>
                  <Badge variant="success" className="inline-flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Yönetici
                  </Badge>
                </TD>
                <TD>
                  <Badge variant="success">Aktif</Badge>
                </TD>
              </TR>
            </TBody>
          </Table>
        </TableWrap>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
        <p className="text-sm text-text2">
          <strong className="text-text">Çoklu kullanıcı desteği yakında.</strong> Şu an proje verileri
          tek hesabın localStorage'ında tutuluyor.
        </p>
      </div>
    </main>
  );
}
