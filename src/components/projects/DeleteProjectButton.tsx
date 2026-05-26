'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

export function DeleteProjectButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    setBusy(true);
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) {
      toast(`"${name}" silindi`, 'success');
      setOpen(false);
      router.refresh();
    } else {
      toast('Silme sırasında hata oluştu', 'error');
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        title="Sil"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Projeyi sil</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-slate-800">{name}</span> projesini ve tüm parça/bağlantı elemanlarını
              kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? 'Siliniyor...' : 'Evet, sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
