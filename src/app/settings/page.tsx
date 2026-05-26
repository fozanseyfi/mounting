import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Database, Palette, Info } from 'lucide-react';
import { STEEL_DENSITY, GALVANIZING_DENSITY, DEFAULT_SPARE_RATIO } from '@/lib/constants/steel';

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Ayarlar" subtitle="Hesaplama sabitleri ve sistem bilgileri" />
      <main className="flex-1 p-6 space-y-6 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> Hesaplama Sabitleri</CardTitle>
            <CardDescription>Standart değerler — değişikliği için kaynak kodu güncelleyin (lib/constants/steel.ts)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ConstBox label="Çelik Yoğunluğu" value={`${STEEL_DENSITY} g/cm³`} hint="7850 kg/m³" />
            <ConstBox label="Galvaniz Kaplama" value={`${GALVANIZING_DENSITY} kg/m²`} hint="Sıcak daldırma 70 µm (500 g/m² — EN ISO 1461)" />
            <ConstBox label="Varsayılan Fire Oranı" value={`%${DEFAULT_SPARE_RATIO}`} hint="Yeni parçalarda varsayılan" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" /> Veritabanı</CardTitle>
            <CardDescription>SQLite yerel veritabanı — yedek için prisma/dev.db dosyasını kopyalayın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>📁 Konum: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">prisma/dev.db</code></p>
            <p>🔄 Sıfırlama: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">npx prisma db push --force-reset</code></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="w-5 h-5" /> Sistem Bilgileri</CardTitle>
            <CardDescription>Solar BOM uygulaması teknik bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <InfoRow label="Uygulama" value="Solar BOM v1.0" />
            <InfoRow label="Framework" value="Next.js 14 (App Router)" />
            <InfoRow label="UI" value="TailwindCSS + Radix UI" />
            <InfoRow label="3D" value="Three.js / React Three Fiber" />
            <InfoRow label="Veritabanı" value="SQLite (Prisma ORM)" />
            <InfoRow label="Lisans" value="Dahili kullanım" />
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function ConstBox({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
      <p className="text-xs uppercase font-semibold text-primary-dark/70">{label}</p>
      <p className="text-xl font-bold text-primary-dark tabular-nums mt-1">{value}</p>
      <p className="text-xs text-slate-600 mt-1">{hint}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
