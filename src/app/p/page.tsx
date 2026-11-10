'use client';

import { useEffect, useState } from 'react';
import { FileDown, Loader2, LinkIcon } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { decodeShare, isShareExpired, type SharePayload } from '@/lib/share-link';
import { buildBomReportHtml } from '@/lib/export/report-html';
import { formatDate } from '@/lib/utils';

type State = { kind: 'loading' } | { kind: 'invalid' } | { kind: 'expired'; p: SharePayload } | { kind: 'ok'; p: SharePayload; html: string };

/** Paylaşım linki — giriş gerektirmeyen, salt okunur proje raporu */
export default function SharedReportPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  // Aynı sekmede farklı link yapıştırılırsa yeniden çöz
  useEffect(() => {
    const onHash = () => window.location.reload();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const code = window.location.hash.replace(/^#/, '');
    if (!code) {
      setState({ kind: 'invalid' });
      return;
    }
    decodeShare(code).then((p) => {
      if (!p) return setState({ kind: 'invalid' });
      if (isShareExpired(p.e)) return setState({ kind: 'expired', p });
      document.title = `Solar BOM - ${p.p.name}`;
      setState({ kind: 'ok', p, html: buildBomReportHtml(p.p, { preparedBy: p.by }) });
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#eef1f5] dark:bg-background">
      {/* Araç çubuğu (yazdırmada gizli) */}
      <header className="no-print sticky top-0 z-10 border-b bg-white/95 backdrop-blur dark:bg-card">
        <div className="mx-auto flex max-w-[230mm] items-center gap-3 px-4 py-2.5">
          <BrandMark className="size-8 shrink-0" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold text-slate-900">Solar BOM — paylaşılan rapor</p>
            {state.kind === 'ok' && (
              <p className="truncate text-xs text-slate-500">
                {state.p.by && (
                  <>
                    Paylaşan: <span data-no-i18n>{state.p.by}</span> ·{' '}
                  </>
                )}
                {state.p.e ? `${formatDate(state.p.e)} tarihine kadar geçerli` : 'Süresiz link'}
              </p>
            )}
          </div>
          {state.kind === 'ok' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#16304f] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f4e8c]"
            >
              <FileDown className="size-4" /> PDF olarak kaydet
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[230mm] px-4 py-6">
        {state.kind === 'loading' && (
          <div className="flex justify-center py-24 text-slate-500">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {(state.kind === 'invalid' || state.kind === 'expired') && (
          <div className="mx-auto max-w-md rounded-lg border bg-white p-8 text-center">
            <LinkIcon className="mx-auto mb-3 size-8 text-slate-400" />
            <h1 className="text-lg font-semibold text-slate-900">
              {state.kind === 'expired' ? 'Linkin süresi dolmuş' : 'Link geçersiz'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {state.kind === 'expired'
                ? 'Bu paylaşım linkinin geçerlilik süresi sona erdi. Güncel rapor için linki gönderen kişiden yeni bir link isteyin.'
                : 'Link eksik veya hatalı kopyalanmış olabilir. Linkin tamamını kopyaladığınızdan emin olun.'}
            </p>
          </div>
        )}

        {state.kind === 'ok' && (
          <div className="rounded-md bg-white p-[11mm] shadow-sm print:p-0 print:shadow-none">
            <div id="bom-report" className="on-screen" dangerouslySetInnerHTML={{ __html: state.html }} />
          </div>
        )}
      </main>
    </div>
  );
}
