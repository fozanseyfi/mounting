'use client';

import { handleLocalApi } from '@/lib/local-db';

/**
 * Veritabanı yokken (yerel mod) tarayıcıdaki fetch('/api/projects…') ve
 * fetch('/api/catalog') çağrılarını localStorage veritabanına yönlendirir.
 * Bileşenler hiçbir değişiklik olmadan çalışmaya devam eder.
 */

let installed = false;

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        window.location.origin
      );
      const isLocal =
        url.origin === window.location.origin &&
        (url.pathname.startsWith('/api/projects') || url.pathname === '/api/catalog');
      if (isLocal) {
        const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
        let body: Record<string, unknown> = {};
        if (typeof init?.body === 'string' && init.body) body = JSON.parse(init.body);
        const res = handleLocalApi(method, url.pathname, body);
        if (res) {
          return new Response(JSON.stringify(res.body ?? null), {
            status: res.status,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (err) {
      console.error('[local-db]', err);
      return new Response(JSON.stringify({ error: 'Yerel kayıt hatası' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return realFetch(input, init);
  };
}

export function LocalApiShim({ enabled }: { enabled: boolean }) {
  // Render sırasında kurulur ki çocuk bileşenlerin ilk effect'lerinden önce hazır olsun.
  if (enabled) install();
  return null;
}
