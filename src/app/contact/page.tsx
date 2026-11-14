import type { Metadata } from "next";
import { ContactView } from "@/components/common/contact-view";

export const metadata: Metadata = {
  title: "İletişime Geç — Solar BOM",
};

export default function ContactPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <ContactView
        config={{
          current: "bom",
          subjectTag: "Solar BOM",
          footerTag: "konstruksiyon-bom-platformu",
          bio: "Yenilenebilir enerji sektöründe, büyük ölçekli GES projelerinin geliştirme, yatırım ve işletme süreçlerinde çalışıyorum. Bu platformu, konstrüksiyon tonajı ve malzeme listesi hesaplarını tek bir yerde, şeffaf ve hızlı yapabilmek için bireysel olarak geliştirdim; sektördeki meslektaşlarımın da işine yarayacağı inancıyla paylaşıyorum.",
          formNote: "Formu doldurun; mesajınız e-posta uygulamanız üzerinden hazır taslak olarak açılır.",
          subjectPlaceholder: "Kısa bir özet — örn. BOM Excel çıktısında birim ağırlık",
          privacy: (
            <>
              Tüm veriler hesaplar arası izole edilir. Geliştirici dahil <strong>hiçbir üçüncü taraf</strong> içeriğinizi
              görmez veya indiremez.
            </>
          ),
          disclaimerTitle: "Tahmin aracı — statik hesap yerine geçmez",
          disclaimer: (
            <>
              Platformdaki tüm hesaplamalar, marka, model ve fiyat bilgileri yalnızca <strong>bilgilendirme amaçlıdır</strong>.
              Hazırlanan BOM ve tonaj raporlarının doğruluğu, güncelliği ve uygulanabilirliği tamamen kullanıcının
              sorumluluğundadır.
            </>
          ),
          legalIntro:
            "Bu uygulama bir konstrüksiyon tonaj hesaplama yardımcısıdır. İmalat, statik onay ve resmi teklifler için tek başına bağlayıcı kabul edilemez. Platformu kullanmaya devam ederek aşağıdaki şartları kabul etmiş sayılırsınız.",
          clauses: [
            {
              title: "Bilgi Amaçlı Kullanım",
              body: (
                <>
                  Bu platform; solar GES projelerinde çelik konstrüksiyon, galvaniz ve bağlantı elemanı tonajını tahmin etmek
                  için geliştirilmiş bir <strong>hesaplama ve karar destek aracıdır</strong>. Üretilen BOM, tonaj ve maliyet
                  çıktıları <strong>resmi bir teklif, statik hesap veya imalat onayı niteliği taşımaz</strong>; herhangi bir
                  tarafa karşı bağlayıcı değildir.
                </>
              ),
            },
            {
              title: "Profil, Katalog ve Fiyat Bilgileri",
              body: (
                <>
                  Profil kesitleri, DIN katalog ağırlıkları, galvaniz kaplama kalınlıkları ve birim fiyatlar{" "}
                  <strong>tipik referans değerlerdir</strong>. Üretici toleranslarını, güncel çelik/galvaniz fiyatlarını veya
                  döviz kurlarını yansıtma garantisi vermez.{" "}
                  <strong>İmalat öncesinde üreticiden güncel ağırlık ve fiyat teyidi alınması şiddetle önerilir</strong>.
                </>
              ),
            },
            {
              title: "Hesaplama Doğruluğu",
              body: (
                <>
                  Sac açılımı, birim ağırlık, galvaniz ve fire hesapları kullanıcının girdiği ölçülere ve seçtiği varsayımlara
                  dayanır. Hesaplama motorunun çıktıları <strong>statik/mühendislik hesabı yerine geçmez</strong>. Taşıyıcı
                  sistem tasarımı ve nihai onay için yetkili mühendislere başvurulmalıdır.
                </>
              ),
            },
            {
              title: "Kullanıcı Sorumluluğu",
              body: (
                <>
                  Platform üzerinde oluşturulan BOM listelerinin, tonaj ve maliyet raporlarının{" "}
                  <strong>içeriği, doğruluğu, güncelliği, üçüncü taraflarla paylaşılması ve hukuki sonuçları tamamen
                  kullanıcının sorumluluğundadır</strong>.
                </>
              ),
            },
            {
              title: "Sorumluluk Sınırlaması",
              body: (
                <>
                  Platform sahibi ve geliştiricisi; platformun kullanımından veya kullanılamamasından, hesaplama hatalarından,
                  eksik/yanlış katalog verilerinden ve paylaşılan çıktıların yarattığı doğrudan veya dolaylı zararlardan — kâr
                  kaybı, imalat hataları, sözleşmesel cezalar dâhil — <strong>hiçbir şekilde sorumlu tutulamaz</strong>.
                </>
              ),
            },
            {
              title: "Hizmet Sunumu",
              body: (
                <>
                  Platform &quot;olduğu gibi&quot; (as-is) sunulur; kesintisiz erişim, hatasız çalışma veya belirli bir amaca
                  uygunluk konusunda <strong>hiçbir açık veya zımni garanti verilmez</strong>. Geliştirici, platformu önceden
                  bildirimde bulunmaksızın güncelleme, geçici olarak durdurma veya tamamen kapatma hakkını saklı tutar.
                </>
              ),
            },
          ],
        }}
      />
    </main>
  );
}
