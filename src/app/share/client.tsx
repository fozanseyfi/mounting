'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Share2, Copy, Check, Plus, X, Mail, MessageSquare, QrCode, Download, Send, Trash2, ExternalLink, Loader2,
} from 'lucide-react';
import type { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { appLocale } from '@/lib/i18n';
import { readProfile } from '@/lib/local-profile';
import { getShares, addShare, removeShare, type ShareLink } from '@/lib/local-admin';
import { encodeShare, shareUrl, shareableProject, isShareExpired } from '@/lib/share-link';

const VALIDITY = [
  { days: 7, label: '7 gün' },
  { days: 30, label: '30 gün' },
  { days: 90, label: '90 gün' },
  { days: 0, label: 'Süresiz' },
];

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Paylaşım Linkleri — Fizibilite platformundaki ile aynı akış */
export function ShareLinksClient({ projects }: { projects: Project[] }) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<ShareLink | null>(null);

  useEffect(() => {
    const load = () => setLinks(getShares());
    load();
    window.addEventListener('admin:updated', load);
    return () => window.removeEventListener('admin:updated', load);
  }, []);

  function remove(l: ShareLink) {
    if (
      !confirm(
        'Link listeden kaldırılsın mı? Daha önce gönderdiğiniz link son geçerlilik tarihine kadar açılmaya devam eder — proje verisi linkin içinde taşınıyor.'
      )
    )
      return;
    removeShare(l.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Share2 className="size-5 text-primary" /> Paylaşım Linkleri
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Projenin raporunu salt okunur bir linkle e-posta, WhatsApp, mesaj veya karekodla gönderin
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Link Oluştur
        </Button>
      </div>

      <section className="rounded-md border bg-white">
        <h2 className="border-b px-4 py-2.5 text-sm font-semibold">Oluşturulan linkler</h2>
        {links.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">
            Henüz link oluşturmadınız. <b>Link Oluştur</b> ile bir proje seçin; linki açan kişi o projenin raporunu görür,
            giriş yapması gerekmez.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs text-slate-600">
                  <th className="px-4 py-2 font-semibold">Proje</th>
                  <th className="px-3 py-2 font-semibold">Oluşturma</th>
                  <th className="px-3 py-2 font-semibold">Geçerlilik</th>
                  <th className="px-3 py-2 font-semibold">Maliyet</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {links.map((l) => {
                  const expired = isShareExpired(l.expiresAt);
                  return (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-900" data-no-i18n>{l.projectName}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(l.createdAt)}</td>
                      <td className="px-3 py-2">
                        {expired ? (
                          <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">Süresi doldu</span>
                        ) : l.expiresAt ? (
                          <span className="text-slate-600">{formatDate(l.expiresAt)}</span>
                        ) : (
                          <span className="text-slate-600">Süresiz</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{l.includeCost ? 'Dahil' : 'Gizli'}</td>
                      <td className="px-4 py-1.5">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setSending(l)} disabled={expired}>
                            <Send className="size-3.5" /> Gönder
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(l)} aria-label="Listeden kaldır" title="Listeden kaldır">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white px-4 py-3">
        <h2 className="mb-1.5 text-sm font-semibold">Link nasıl çalışır?</h2>
        <ul className="ml-1 list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Linki açan kişi projenin raporunu görür ve PDF olarak kaydedebilir; projeyi değiştiremez.</li>
          <li>
            Link, <b>oluşturulduğu andaki</b> proje verisini taşır. Projede sonradan yaptığınız değişiklikler gönderilmiş
            linke yansımaz — güncel hâli için yeni link oluşturun.
          </li>
          <li>Maliyet bilgisini paylaşmak istemezseniz linki oluştururken &quot;Maliyeti dahil et&quot; seçeneğini kapatın.</li>
          <li>Süresi dolan link açılmaz. Listeden kaldırmak, gönderilmiş linki kapatmaz.</li>
        </ul>
      </section>

      {creating && (
        <CreateDialog
          projects={projects}
          onClose={() => setCreating(false)}
          onCreated={(l) => {
            setCreating(false);
            setSending(l);
          }}
        />
      )}
      {sending && <SendDialog link={sending} onClose={() => setSending(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn('max-h-[92vh] w-full overflow-y-auto rounded-lg border bg-white shadow-lg', wide ? 'max-w-xl' : 'max-w-md')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="-mr-1 p-1 text-slate-400 hover:text-slate-600" aria-label="Kapat">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function CreateDialog({ projects, onClose, onCreated }: { projects: Project[]; onClose: () => void; onCreated: (l: ShareLink) => void }) {
  const [projectId, setProjectId] = useState('');
  const [days, setDays] = useState(30);
  const [includeCost, setIncludeCost] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const p = projects.find((x) => x.id === projectId);
    if (!p) {
      setError('Lütfen paylaşılacak projeyi seçin.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const now = new Date();
      const expiresAt = days > 0 ? isoDay(new Date(now.getTime() + days * 864e5)) : null;
      const code = await encodeShare({
        v: 1,
        p: shareableProject(p, includeCost),
        by: readProfile().fullName,
        c: now.toISOString(),
        ...(expiresAt ? { e: expiresAt } : {}),
      });
      onCreated(addShare({ projectId: p.id, projectName: p.name, url: shareUrl(code), expiresAt, includeCost }));
    } catch {
      setError('Link oluşturulamadı. Tarayıcınız güncel değilse güncelleyip tekrar deneyin.');
      setBusy(false);
    }
  }

  return (
    <Dialog title="Link oluştur" onClose={onClose}>
      {projects.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Paylaşmak için önce bir proje oluşturmanız gerekiyor.</p>
          <Link href="/projects/new" className="inline-flex text-sm font-semibold text-primary hover:underline">
            Yeni proje oluştur →
          </Link>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Hangi proje paylaşılacak?</span>
            <select
              autoFocus
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setError(null);
              }}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Proje adı seçin…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} data-no-i18n>
                  {p.name} — {formatNumber(p.totals?.totalPowerMW || 0)} MWp
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Geçerlilik süresi</span>
            <div className="grid grid-cols-4 gap-1.5">
              {VALIDITY.map((v) => (
                <button
                  key={v.days}
                  type="button"
                  onClick={() => setDays(v.days)}
                  className={cn(
                    'h-9 rounded-md border text-xs font-semibold transition-colors',
                    days === v.days ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={includeCost} onChange={(e) => setIncludeCost(e.target.checked)} className="size-4 accent-[#1f4e8c]" />
            Maliyeti dahil et (birim fiyatlar ve toplam maliyet raporda görünür)
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={busy || !projectId}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Link oluştur
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.38 9.38 0 0 1 9.42 9.44c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.32 11.32 0 0 0 12.05.72C5.79.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.33 11.33 0 0 0 5.42 1.38h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z" />
    </svg>
  );
}

function SendDialog({ link, onClose }: { link: ShareLink; onClose: () => void }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [sender, setSender] = useState('');
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => setSender(readProfile().fullName), []);

  const en = appLocale() === 'en';
  const until = link.expiresAt ? formatDate(link.expiresAt) : '';
  const subject = en ? `${link.projectName} — mounting structure BOM report` : `${link.projectName} — konstrüksiyon BOM raporu`;
  const body = en
    ? `Hello,\n\nYou can view the mounting structure tonnage and BOM report of the “${link.projectName}” project at the link below:\n\n${link.url}\n\n` +
      (until ? `The link is valid until ${until}.\n\n` : '') +
      sender
    : `Merhaba,\n\n“${link.projectName}” projesinin konstrüksiyon tonaj ve malzeme listesi (BOM) raporunu aşağıdaki linkten görüntüleyebilirsiniz:\n\n${link.url}\n\n` +
      (until ? `Link ${until} tarihine kadar geçerlidir.\n\n` : '') +
      sender;
  const shortText = en ? `“${link.projectName}” BOM report: ${link.url}` : `“${link.projectName}” BOM raporu: ${link.url}`;

  useEffect(() => {
    QRCode.toDataURL(link.url, { errorCorrectionLevel: 'L', margin: 2, width: 320, color: { dark: '#0B2350', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link.url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Kopyalanamadı — linki seçip elle kopyalayın.', 'error');
    }
  }

  function downloadQr() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `${link.projectName.replace(/[^\p{L}\p{N}]+/gu, '-')}-karekod.png`;
    a.click();
  }

  const channel =
    'flex h-20 flex-col items-center justify-center gap-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900';

  return (
    <Dialog title={`Gönder — ${link.projectName}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Proje linki</span>
          <div className="flex items-center gap-2">
            <input
              value={link.url}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 font-mono text-xs"
              data-no-i18n
            />
            <Button onClick={copy} className="shrink-0">
              {copied ? (
                <>
                  <Check className="size-4" /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Kopyala
                </>
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {link.expiresAt ? `${formatDate(link.expiresAt)} tarihine kadar geçerli.` : 'Süresiz.'}{' '}
            {link.includeCost ? 'Maliyet bilgisi dahil.' : 'Maliyet bilgisi gizli.'}{' '}
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              Linki aç <ExternalLink className="size-3" />
            </a>
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Gönderme seçenekleri</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <a className={channel} href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
              <Mail className="size-[18px]" /> E-posta
            </a>
            <a className={channel} href={`https://wa.me/?text=${encodeURIComponent(shortText)}`} target="_blank" rel="noopener noreferrer">
              <span className="text-[#25D366]">
                <WhatsAppIcon />
              </span>{' '}
              WhatsApp
            </a>
            <a className={channel} href={`sms:?&body=${encodeURIComponent(shortText)}`}>
              <MessageSquare className="size-[18px]" /> Mesaj (SMS)
            </a>
            <button type="button" className={cn(channel, showQr && 'border-primary bg-primary/5 text-primary')} onClick={() => setShowQr((v) => !v)}>
              <QrCode className="size-[18px]" /> Karekod
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Mesaj seçeneği telefonda SMS uygulamasını açar; bilgisayarda telefonunuz bağlıysa (ör. Windows “Telefon Bağlantısı”,
            Mac “Mesajlar”) oradan gönderilir.
            {canNativeShare && (
              <>
                {' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => navigator.share({ title: subject, text: shortText, url: link.url }).catch(() => {})}
                >
                  Diğer uygulamalarla paylaş
                </button>
              </>
            )}
          </p>
        </div>

        {showQr && (
          <div className="flex flex-col items-center gap-4 rounded-md border p-4 sm:flex-row">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt={`${link.projectName} karekodu`} width={180} height={180} className="rounded" />
            ) : (
              <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-slate-500">Karekod üretilemedi</div>
            )}
            <div className="space-y-3 text-sm text-slate-600">
              <p>Telefon kamerasıyla okutunca rapor açılır. Sunumda ekrana yansıtabilir veya PNG olarak indirip dokümana ekleyebilirsiniz.</p>
              <Button variant="outline" size="sm" onClick={downloadQr} disabled={!qr}>
                <Download className="size-3.5" /> PNG indir
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
