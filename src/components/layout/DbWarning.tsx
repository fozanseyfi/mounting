import { AlertTriangle, HardDrive } from 'lucide-react';

export function DbWarning({ show, local = false }: { show: boolean; local?: boolean }) {
  if (local) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info-soft/50 px-4 py-3 text-sm text-info-soft-foreground">
        <HardDrive className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">Yerel mod — projeler bu tarayıcıda saklanıyor</p>
          <p className="text-info-soft-foreground/85">
            Kayıtlar bu cihazın tarayıcısında tutulur; başka cihazda veya tarayıcı verisi silinirse görünmez.
            Supabase bağlandığında ortak veritabanına geçilecek.
          </p>
        </div>
      </div>
    );
  }
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
