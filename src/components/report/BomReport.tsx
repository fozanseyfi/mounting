'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Project } from '@/types';
import { buildBomReportHtml } from '@/lib/export/report-html';
import { readProfile } from '@/lib/local-profile';

/**
 * Kurumsal PDF raporu (Fizibilite ile aynı yöntem): rapor HTML'i body'ye portal edilir,
 * tarayıcının yazdır penceresi açılır → "PDF olarak kaydet".
 */
function PrintPortal({ html, onDone }: { html: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!html) return;
    document.body.classList.add('bom-printing');
    const prevTitle = document.title;
    const after = () => {
      document.body.classList.remove('bom-printing');
      document.title = prevTitle;
      window.removeEventListener('afterprint', after);
      onDone();
    };
    window.addEventListener('afterprint', after);
    // Fontlar ve EN çevirisi otursun diye kısa bekleme
    const t = setTimeout(() => {
      (document.fonts?.ready ?? Promise.resolve()).then(() => window.print());
    }, 250);
    return () => {
      clearTimeout(t);
      window.removeEventListener('afterprint', after);
      document.body.classList.remove('bom-printing');
    };
  }, [html, onDone]);

  if (typeof document === 'undefined') return null;
  return createPortal(<div id="bom-report">{html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null}</div>, document.body);
}

/** Satırlardaki / şeritteki "PDF Rapor Al" düğmeleri için: print(project) çağrılır, sayfada tek `printer` render edilir. */
export function useBomReport() {
  const [html, setHtml] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const print = useCallback((project: Project) => {
    setBusyId(project.id);
    setTimeout(() => {
      try {
        // Kaydedilen PDF'in dosya adı sekme başlığından gelir
        document.title = `Solar BOM - ${project.name}`;
        setHtml(buildBomReportHtml(project, { preparedBy: readProfile().fullName }));
      } finally {
        setBusyId(null);
      }
    }, 20);
  }, []);

  const done = useCallback(() => setHtml(null), []);
  const printer = <PrintPortal html={html} onDone={done} />;
  return { print, busyId, printer };
}
