'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import type { TableType } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
  editing: TableType | null;
  onSaved: () => void;
}

export function TableTypeFormDialog({ open, onOpenChange, projectId, editing, onSaved }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    panelsPerTable: 28,
    tableCount: 1,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: editing?.name || '',
        description: editing?.description || '',
        panelsPerTable: editing?.panelsPerTable ?? 28,
        tableCount: editing?.tableCount ?? 1,
      });
    }
  }, [open, editing]);

  async function handleSave() {
    if (!form.name.trim()) {
      toast('Masa tipi adı zorunludur', 'error');
      return;
    }
    setBusy(true);
    const isNew = !editing?.id;
    const url = isNew
      ? `/api/projects/${projectId}/table-types`
      : `/api/projects/${projectId}/table-types/${editing!.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      onSaved();
      toast(isNew ? 'Masa tipi eklendi' : 'Güncellendi', 'success');
    } else {
      toast('Kaydedilemedi', 'error');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing?.id ? 'Masa Tipini Düzenle' : 'Yeni Masa Tipi'}</DialogTitle>
          <DialogDescription>
            Bu masa tipinin adını, panel sayısını ve sahadaki adedini belirleyin.
            Parçalar ve bağlantı elemanlarını sonraki adımda gireceksiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Masa Tipi Adı *</Label>
            <Input placeholder="Tip-1, Tip-2, Standart 28 Panel..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea placeholder="Bu tipin kullanım yeri veya özelliği" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Masa Başına Panel Sayısı *</Label>
              <Input type="number" min={1} value={form.panelsPerTable} onChange={(e) => setForm({ ...form, panelsPerTable: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Bu Tipten Kaç Masa? *</Label>
              <Input type="number" min={1} value={form.tableCount} onChange={(e) => setForm({ ...form, tableCount: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 text-xs text-slate-700">
            <p>Bu tip için toplam: <b>{(form.panelsPerTable * form.tableCount).toLocaleString('tr-TR')} panel</b></p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>İptal</Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing?.id ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
