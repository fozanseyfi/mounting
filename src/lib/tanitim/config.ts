/**
 * Tanıtım sayfasının platforma özgü ayarları. Tanıtım bileşenleri (components/tanitim/tour-view.tsx,
 * components/auth/tour-promo.tsx) bütün platformlarda birebir aynıdır; yalnız bu dosya ve
 * manifest/görüntüler platforma göre değişir.
 */
export const TOUR = {
  /** Platformun ana rengi (vurgu, numaralar, kaydırma çubuğu) */
  accent: "#047857",
  /** Gece modunda vurgu rengi */
  accentDark: "#34d399",
  /** Tarayıcı çerçevesindeki adres */
  domain: "mounting.fozanseyfi.com",
  /** Giriş sayfasındaki tanıtım şeridinin açıklaması */
  promoText:
    "Projeden masa tiplerine, sehpa parçalarından bağlantı elemanlarına, tonaj ve maliyetten 3B görünüme ve rapora kadar bütün adımlar gerçek ekranlar üzerinden anlatılıyor: hangi değer nereye yazılır, sonuç nerede okunur.",
  /** Giriş sayfasında gösterilen örnek ekranlar (bölüm id + adım sırası, 0'dan) */
  previews: [
    { id: "masa-tipleri", step: 2, label: "Sehpa parçaları" },
    { id: "proje-ciktilari", step: 0, label: "Maliyet" },
    { id: "proje-ciktilari", step: 3, label: "Özet & rapor" },
  ],
};
