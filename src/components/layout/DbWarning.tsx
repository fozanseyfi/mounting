import { AlertTriangle } from 'lucide-react';

export function DbWarning({ show, local = false }: { show: boolean; local?: boolean }) {
  // Yerel modda uyarı gösterilmez (kullanıcı isteği)
  if (local) return null;
  if (!show) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">Veritabanına ulaşılamadı</p>
        <p className="text-amber-700">Proje verileri şu an görüntülenemiyor. Lütfen biraz sonra tekrar deneyin.</p>
      </div>
    </div>
  );
}
