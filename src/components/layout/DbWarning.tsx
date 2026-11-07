import { AlertTriangle } from 'lucide-react';

export function DbWarning({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Veritabanı bağlı değil</p>
        <p className="text-amber-700">
          Proje verileri şu an görüntülenemiyor. Vercel ortam değişkenlerine <code className="font-mono">DATABASE_URL</code> eklendiğinde veriler otomatik görünecek.
        </p>
      </div>
    </div>
  );
}
