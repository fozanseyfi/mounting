import { NextResponse, type NextRequest } from 'next/server';

/**
 * Veritabanı (DATABASE_URL) tanımlı değilken proje API'leri çökmek yerine
 * anlaşılır bir 503 mesajı döner; arayüz bu mesajı kullanıcıya gösterir.
 */
export function middleware(_req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        error:
          'Veritabanı bağlı değil — proje kaydedilemedi. Supabase bağlantısı (DATABASE_URL) eklendiğinde kayıt çalışacak.',
      },
      { status: 503 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/projects/:path*'],
};
