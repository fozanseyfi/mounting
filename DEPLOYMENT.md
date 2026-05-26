# Vercel Deploy Rehberi

## 1. Vercel'e Proje İmport Et

1. https://vercel.com/new adresine git
2. **Import Git Repository** → `fozanseyfi/mounting` seç
3. Framework otomatik tanınır: **Next.js**
4. Build Command otomatik gelir: `npm run build` (zaten `vercel.json`'da)
5. **Deploy butonuna BASMA** — önce DB ekleyeceğiz

## 2. Vercel Postgres Ekle

Proje sayfasında:
1. **Storage** sekmesi → **Create Database** → **Postgres**
2. Bölge: `fra1` (Frankfurt) veya size yakını seç
3. Database adı: `solar-bom-db`
4. **Create & Continue** → otomatik olarak projeye bağlar
5. Vercel `DATABASE_URL` (+ `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, vs.) env vars'ı otomatik ekler

## 3. (Opsiyonel) İletişim Formu için Gmail

**Settings → Environment Variables**:
- `GMAIL_USER` = `bilgi@example.com`
- `GMAIL_APP_PASSWORD` = `xxxx xxxx xxxx xxxx` (Google App Password)

## 4. Deploy

1. **Deployments** sekmesi → **Redeploy** (en üst sağ)
2. Build sırasında:
   - `prisma generate` çalışır
   - `prisma db push` ile şema Postgres'e atılır
   - `next build` Next.js'i derler
3. ~2 dakika sonra deploy hazır

## 5. İlk Veri (Seed)

Vercel Postgres boş gelir. İki seçenek:

**A) Manuel via UI** — Dashboard'a girip ilk projeyi UI'dan oluşturun.

**B) Lokal seed → prod DB**
```bash
# Vercel dashboard'tan POSTGRES_PRISMA_URL'i kopyala
# Lokal .env dosyasına yapıştır
echo 'DATABASE_URL="postgresql://..."' > .env
npx prisma db push
npx tsx prisma/seed.ts
```

## Sonraki push'larda

`git push` yeterli — Vercel otomatik yeniden build eder.

## Lokal geliştirme

Lokal Postgres kurmanız gerekir (önceden SQLite vardı):
```bash
# Docker ile en kolay:
docker run -d --name solar-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=solar_bom \
  postgres:16

# Veya Neon dev DB (neon.tech)
# .env içine DATABASE_URL koyun
npm run db:push
npm run db:seed
npm run dev
```
