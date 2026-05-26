# Vercel Deploy Rehberi

## 1. Vercel'e Proje İmport Et

1. https://vercel.com/new adresine git
2. **Import Git Repository** → `fozanseyfi/mounting` seç
3. Framework otomatik tanınır: **Next.js**
4. **Deploy** butonuna bas — yaklaşık 2 dakikada deploy hazır

## 2. Mevcut Durum

✅ **Statik sayfalar çalışır:** Anasayfa, Nasıl Çalışır, İletişim, Diğer Platformlar, Profilim vb.

⚠️ **DB bağımlı sayfalar henüz çalışmaz:** Dashboard, Projeler, DIN Katalog (kullanıcı kütüphanesi), Raporlar.

Bunlar sayfa açıldığında "DB bulunamadı" hatası verir. Storage eklendiğinde otomatik çalışacak.

## 3. Daha Sonra: Supabase Bağlantısı

Hazır olduğunda:

1. Supabase'de yeni proje oluştur → **Settings → Database** → **Connection string** (Mode: `Transaction`)
2. Vercel proje sayfası → **Settings → Environment Variables**
3. Yeni env var ekle:
   - Key: `DATABASE_URL`
   - Value: Supabase'den aldığın connection string
   - Environments: Production, Preview, Development (hepsi)
4. **Save** → **Deployments → Redeploy**

İlk push'ta şemayı Supabase'e atmak için:
```bash
# Lokal .env'e DATABASE_URL kaydet (Supabase URL)
echo 'DATABASE_URL="postgresql://postgres.xxx:xxx@xxx.supabase.com:6543/postgres"' > .env
npx prisma db push
# (Opsiyonel) Seed data
npx tsx prisma/seed.ts
```

## (Opsiyonel) Lokal Geliştirme

Lokalde de Postgres gerek. En kolay yöntem Docker:
```bash
docker run -d --name solar-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=solar_bom \
  postgres:16

echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/solar_bom"' > .env
npm run db:push
npm run db:seed
npm run dev
```

## Sonraki push'lar

`git push` yeterli — Vercel otomatik yeniden build eder.
