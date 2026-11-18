# Platform tanıtımı — ekran çekimi

Tanıtım sayfası (`/tanitim`, `/platform-tanitimi`) `public/tanitim/*.webp` görüntülerini ve
`src/lib/tanitim/manifest.json` dosyasını kullanır. İkisi de `scripts/tour/capture.mjs` ile üretilir.

1. `npx next dev -p 5000` — `DATABASE_URL` tanımlı olmadan (yerel mod, veriler tarayıcıda)
2. `node scripts/tour/capture.mjs [bölüm-id ...]` — bölüm verilmezse hepsi çekilir.

Demo verisi çekimin başında arayüzden oluşturulur: demo profil, 12 MWp proje, iki masa tipi,
gerçekçi parça ölçüleri, DIN bağlantı elemanları ve birim maliyetler. Görüntüler 1440×900, 2×
(2880×1800) kayıpsız WebP olarak kaydedilir. `scripts/tour/engine.mjs` bütün platformlarda aynıdır.
