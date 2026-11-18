/**
 * Solar BOM (Mounting) — tanıtım ekran görüntüleri + src/lib/tanitim/manifest.json.
 *
 *   npx next dev -p 5000                                 (ayrı terminalde, DATABASE_URL olmadan → yerel mod)
 *   node scripts/tour/capture.mjs [bölüm-id ...]
 *
 * Yerel modda projeler tarayıcıda (localStorage) tutulur; demo verisi çekimin başında arayüzden
 * oluşturulur: demo profille giriş, bir GES projesi, iki masa tipi, parçalar ve bağlantı elemanları.
 */
import path from "node:path";
import { launch, autoDialogs, noSmoothScroll, go, settle, sleep, byText, fill, waitPath } from "./lib.mjs";
import { VW, VH, mark, press, scrollTo, toTop, modalButton, runTour } from "./engine.mjs";

const MANIFEST = path.resolve("src/lib/tanitim/manifest.json");
const DEMO = { name: "Deniz Aydın", email: "deniz.aydin@demo-enerji.example" };
const PROJECT = { name: "Konya Karapınar 12 MWp GES", customer: "Demo Enerji A.Ş.", location: "Konya, Karapınar" };
const TYPES = [
  { name: "Tip-A 2x14 Dikey", desc: "Ana saha — 28 panelli standart masa", panels: 28, count: 600 },
  { name: "Tip-B 2x10 Dikey", desc: "Saha kenarları ve köşeler", panels: 20, count: 195 },
];
const FASTENERS = [
  { find: ["DIN933", "M12 · 30mm"], qty: 48 },
  { find: ["DIN934", "M12"], qty: 48 },
  { find: ["DIN127", "M12"], qty: 48 },
];
let projectUrl = "";

// ---------------------------------------------------------------- yardımcılar
/** Açılır listede (Radix Select) metin parçalarını içeren seçeneği seç. */
async function pickOption(page, parts) {
  const h = await page.evaluateHandle((ps) => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    return [...document.querySelectorAll("[role=option]")].find((o) => ps.every((p) => norm(o.textContent).includes(p))) || null;
  }, parts);
  const el = h.asElement();
  if (!el) throw new Error(`Seçenek yok: ${parts.join(" / ")}`);
  await el.evaluate((n) => n.scrollIntoView({ block: "center" }));
  await el.click();
  await sleep(400);
}
/** Açık penceredeki görünür sayı alanları (sırasıyla). */
const dialogNumbers = (page) => page.$$("[role=dialog] input[type=number]");
async function openProject(page, tabLabel) {
  await go(page, new URL(projectUrl).pathname, 1800);
  if (tabLabel) await press(page, await byText(page, tabLabel, "main button"), 1500);
}
async function openType(page, name) {
  await press(page, await byText(page, name, "main button"), 1200);
}
async function addType(page, t, first) {
  await press(page, await byText(page, first ? "İlk Masa Tipini Ekle" : "Ekle", "main button"), 900);
  await fill(page, 'input[placeholder^="Tip-1"]', t.name);
  await fill(page, '[role=dialog] textarea', t.desc);
  const nums = await dialogNumbers(page);
  await fill(page, nums[0], String(t.panels));
  await fill(page, nums[1], String(t.count));
}
/**
 * Sehpa parçalarının gerçekçi ölçüleri (C profil): kalınlık, uzunluk, a-b-c kenarları (mm), masa başına adet.
 * Penceredeki sayı alanlarının sırası: kalınlık, uzunluk, a, b, c, adet, fire, büküm payı.
 */
const PARTS = [
  ["Ön Kolon", 2.5, 2200, 60, 120, 60, 4],
  ["Arka Kolon", 2.5, 3200, 60, 120, 60, 4],
  ["Kiriş", 2.0, 3800, 50, 100, 50, 4],
  ["Aşık", 1.5, 6800, 40, 80, 40, 4],
  ["Çapraz", 2.0, 2600, 40, 60, 40, 4],
  ["Payanda", 2.0, 1900, 40, 60, 40, 4],
  ["Ek Elemanı", 2.0, 450, 50, 100, 50, 8],
];
async function fillParts(page) {
  for (const [name, t, len, a, b, c, qty] of PARTS) {
    // Pencere bazen bir önceki pencerenin kapanma animasyonu yüzünden açılmıyor: 3 kez dene
    for (let i = 0; ; i++) {
      await press(page, await byText(page, name, "main td, main span"), 900);
      const btn = await modalButton(page, "Güncelle", 4000).catch(() => null);
      if (btn) {
        const nums = await dialogNumbers(page);
        const vals = [t, len, a, b, c, qty];
        for (let k = 0; k < vals.length && k < nums.length; k++) await fill(page, nums[k], String(vals[k]));
        await sleep(200);
        await btn.click();
        break;
      }
      if (i === 2) throw new Error(`Parça penceresi açılmadı: ${name}`);
      await page.keyboard.press("Escape");
      await sleep(800);
    }
    await sleep(700);
  }
}
async function addFastener(page, f) {
  await press(page, await byText(page, "Bağlantı Elemanları", "main button"), 800);
  // Pencere bazen önceki pencerenin kapanma animasyonu yüzünden açılmıyor: 3 kez dene
  for (let i = 0; ; i++) {
    await press(page, await byText(page, "Bağlantı Elemanı Ekle", "main button"), 900);
    const ok = await page.waitForSelector("[role=dialog]", { visible: true, timeout: 4000 }).catch(() => null);
    if (ok || i === 2) break;
    await page.keyboard.press("Escape");
    await sleep(600);
  }
  await press(page, await byText(page, "Bir bağlantı elemanı seçin...", "[role=dialog] button"), 600);
  await pickOption(page, f.find);
  const nums = await dialogNumbers(page);
  await fill(page, nums[nums.length - 2], String(f.qty));
}

// ---------------------------------------------------------------- senaryo
const MODULES = [
  {
    id: "giris",
    group: "Başlarken",
    title: "Giriş ve Genel Görünüm",
    intro:
      "Solar BOM, GES konstrüksiyon masalarının ağırlığını, sevk listesini ve maliyetini hesaplar. Ad soyad ve e-postayla girilir; solda bütün sayfalara giden menü, üstte hesap menüsü, dil ve gece modu bulunur.",
    steps: [
      {
        title: "Giriş ekranı",
        text: "Ad soyad ve e-posta yazılıp “Giriş Yap”a basılır. Bu bilgiler raporlarda hazırlayan olarak görünür.",
        guest: true,
        run: async (page) => {
          await go(page, "/login", 1000);
          const ins = await page.$$("form input");
          await fill(page, ins[0], DEMO.name);
          await fill(page, ins[1], DEMO.email);
          await mark(page, await byText(page, "Giriş Yap", "form button"), { click: true });
        },
      },
      {
        title: "Dashboard",
        text: "Başlıkta kayıtlı proje sayısı, toplam tonaj ve toplam güç görünür. Tabloda her projenin durumu, gücü, tonajı, çelik yoğunluğu (kg/MWp), birim maliyeti (USD/MWp) ve güncelleme tarihi yer alır; “Rapor Al” ve “Excel Al” düğmeleri raporu doğrudan indirir.",
        run: async (page) => {
          await go(page, "/", 1500);
        },
      },
      {
        title: "Hesap menüsü",
        text: "Sol üstteki adınıza tıklayınca profil, bildirimler ve çıkış seçenekleri açılır.",
        run: async (page) => {
          await go(page, "/", 800);
          const b = await page.$('[aria-label="Hesap menüsü"]');
          await press(page, b, 500);
          await mark(page, b, { click: true });
        },
        after: async (page) => page.keyboard.press("Escape"),
      },
      {
        title: "Gece modu",
        text: "Sağ üstteki ay simgesiyle koyu temaya geçilir; tercih tarayıcıda saklanır.",
        run: async (page) => {
          await go(page, "/", 800);
          await press(page, await page.$('[aria-label="Karanlık temaya geç"]'), 800);
          await mark(page, await page.$('[aria-label="Aydınlık temaya geç"]'), { click: true });
        },
        after: async (page) => {
          const b = await page.$('[aria-label="Aydınlık temaya geç"]');
          if (b) await b.click();
          await sleep(500);
        },
      },
      {
        title: "İngilizce arayüz",
        text: "TR / EN düğmesiyle menüler, başlıklar ve açıklamalar İngilizceye geçer; hesaplar aynı kalır.",
        run: async (page) => {
          await go(page, "/", 800);
          await press(page, await byText(page, "EN", "button"), 1500);
          await mark(page, await byText(page, "EN", "button"), { click: true });
        },
        after: async (page) => {
          await (await byText(page, "TR", "button")).click();
          await sleep(1200);
        },
      },
    ],
  },

  {
    id: "yeni-proje",
    group: "Proje Kurulumu",
    title: "Yeni Proje",
    intro: "Proje iki adımda açılır: proje bilgileri ve panel spesifikasyonu. Panel gücü kurulu gücün, eğim açısı 3B görünümün hesabında kullanılır.",
    steps: [
      {
        title: "Proje bilgileri",
        text: "Proje adı (zorunlu), müşteri, lokasyon ve kısa açıklama girilir; “Devam Et” ile ikinci adıma geçilir.",
        run: async (page) => {
          await go(page, "/projects/new", 1200);
          await fill(page, "#name", "Manisa OSB Çatı GES");
          await fill(page, "#customer", "Demo Tekstil A.Ş.");
          await fill(page, "#location", "Manisa OSB");
          await fill(page, "#description", "Fabrika çatısı, 2 farklı masa tipi");
          await mark(page, await byText(page, "Devam Et", "button"), { click: true });
        },
      },
      {
        title: "Panel spesifikasyonu",
        text: "Panel gücü (Wp) ve eğim açısı girilir. “Projeyi Oluştur” ile proje açılır ve masa tiplerinin girileceği proje sayfasına geçilir.",
        run: async (page) => {
          await go(page, "/projects/new", 1200);
          await fill(page, "#name", "Manisa OSB Çatı GES");
          await press(page, await byText(page, "Devam Et", "button"), 1000);
          await page.waitForSelector("#panelWattage", { visible: true, timeout: 15000 });
          await fill(page, "#panelWattage", "585");
          await mark(page, await page.$("#panelWattage"));
          await mark(page, await byText(page, "Projeyi Oluştur", "button"), { click: true });
        },
      },
      {
        title: "Proje sayfası",
        text: "Üstte projenin özet göstergeleri (masa tipi, toplam masa, panel, kurulu güç, toplam tonaj, çelik yoğunluğu, birim maliyet); altta Masa Tipleri, Maliyet, 3D ve Özet & Rapor sekmeleri bulunur.",
        run: async (page) => {
          await openProject(page);
          await mark(page, await byText(page, "Masa Tipleri", "main button"));
        },
      },
    ],
  },

  {
    id: "masa-tipleri",
    group: "Proje Kurulumu",
    title: "Masa Tipleri ve Parçalar",
    intro:
      "Sahadaki her farklı masa bir masa tipidir. Her tipin sehpa parçaları (kolon, kiriş, aşık, çapraz…) profil ölçüleriyle, bağlantı elemanları DIN katalogdan girilir; ağırlık ve galvaniz otomatik hesaplanır.",
    steps: [
      {
        title: "Yeni masa tipi",
        text: "Masa tipi adı, açıklaması, masa başına panel sayısı ve sahada bu tipten kaç masa olduğu girilir. Toplam panel sayısı pencerenin altında anında görünür.",
        run: async (page) => {
          await openProject(page);
          await addType(page, { name: "Tip-C 2x12 Dikey", desc: "Trafo köşkü çevresi", panels: 24, count: 40 }, false);
          await mark(page, await modalButton(page, "Ekle"), { click: true });
        },
        after: async (page) => page.keyboard.press("Escape"),
      },
      {
        title: "Masa tipleri listesi",
        text: "Soldaki listede her tipin masa ve panel sayısı ile tonajı görünür. Bir tipe tıklayınca sağda o tipin parçaları açılır.",
        run: async (page) => {
          await openProject(page);
          await openType(page, TYPES[0].name);
          await mark(page, await byText(page, TYPES[0].name, "main button"), { click: true });
        },
      },
      {
        title: "Sehpa parçaları",
        text: "Yeni tipte yedi standart parça hazır gelir: ön ve arka kolon, kiriş, aşık, çapraz, payanda ve ek elemanı. Tabloda profil, kalınlık, kenar ölçüleri, açılım, uzunluk, adet ve ağırlıklar listelenir.",
        run: async (page) => {
          await openProject(page);
          await openType(page, TYPES[0].name);
          await mark(page, await byText(page, "Sehpa Parçaları", "main button"));
        },
      },
      {
        title: "Parça detayı",
        text: "Bir parçaya tıklayınca profil tipi (C, U, Omega, L…), kalınlık, uzunluk ve kenar ölçüleri girilir. Şema ölçüleri gösterir; sac açılımı, birim ağırlık, masa başına ağırlık ve galvaniz anında hesaplanır.",
        run: async (page) => {
          await openProject(page);
          await openType(page, TYPES[0].name);
          await press(page, await byText(page, "Aşık", "main td, main span"), 1000);
          const nums = await dialogNumbers(page);
          await mark(page, nums[0], { center: false });
          await mark(page, await byText(page, "BİRİM AĞIRLIK", "[role=dialog] span, [role=dialog] div, [role=dialog] p").catch(() => null) || nums[1], { center: false });
        },
        after: async (page) => page.keyboard.press("Escape"),
      },
      {
        title: "Yeni parça ekleme",
        text: "Standart dışı bir eleman için “Parça Ekle” kullanılır; aynı pencerede kod, ad ve ölçüler girilir.",
        run: async (page) => {
          await openProject(page);
          await openType(page, TYPES[0].name);
          await press(page, await byText(page, "Parça Ekle", "main button"), 900);
          await fill(page, 'input[placeholder^="Örn: Ön Kolon"]', "Taban Plakası");
          await mark(page, await page.$('input[placeholder^="Örn: Ön Kolon"]'), { center: false });
        },
        after: async (page) => page.keyboard.press("Escape"),
      },
      {
        title: "Bağlantı elemanları",
        text: "Cıvata, somun ve rondelalar ikinci sekmede listelenir: DIN kodu, ölçü, kalite, birim ağırlık, masa başına adet ve fire.",
        run: async (page) => {
          await openProject(page);
          await openType(page, TYPES[0].name);
          await press(page, await byText(page, "Bağlantı Elemanları", "main button"), 900);
          await mark(page, await byText(page, "Bağlantı Elemanı Ekle", "main button"));
        },
      },
      {
        title: "DIN katalogdan seçim",
        text: "“Bağlantı Elemanı Ekle” penceresinde eleman DIN katalogdan seçilir; kod, ölçü, kalite ve birim ağırlık otomatik dolar. Katalogda olmayanlar “Manuel Gir” ile eklenir.",
        run: async (page) => {
          await openProject(page);
          await openType(page, TYPES[0].name);
          await press(page, await byText(page, "Bağlantı Elemanları", "main button"), 800);
          await press(page, await byText(page, "Bağlantı Elemanı Ekle", "main button"), 900);
          await press(page, await byText(page, "Bir bağlantı elemanı seçin...", "[role=dialog] button"), 700);
        },
        after: async (page) => {
          await page.keyboard.press("Escape");
          await page.keyboard.press("Escape");
        },
      },
      {
        title: "Masa tipini düzenleme",
        text: "Kalem simgesiyle tipin adı, panel ve masa sayısı değiştirilir; çöp kutusuyla tip silinir. Değişiklik bütün toplamlara anında yansır.",
        run: async (page) => {
          await openProject(page);
          await openType(page, TYPES[1].name);
          const edit = (await page.$('[aria-label="Masa tipini düzenle"]')) || (await page.$('[title="Masa tipini düzenle"]'));
          await mark(page, edit, { click: true });
        },
      },
    ],
  },

  {
    id: "proje-ciktilari",
    group: "Sonuçlar",
    title: "Maliyet, 3B Görünüm ve Rapor",
    intro:
      "Parçalar girildikçe proje tonajı, çelik yoğunluğu ve maliyet otomatik hesaplanır. Masa 3B olarak incelenir; sonuçlar Excel ve PDF rapor olarak alınır.",
    steps: [
      {
        title: "Maliyet",
        text: "Çelik, galvaniz, bağlantı elemanı, işçilik ve nakliye birim fiyatları girilir; proje maliyeti ve MWp başına maliyet hesaplanır. Notlar alanı rapora eklenir.",
        run: async (page) => {
          await openProject(page, "Maliyet");
          await page.waitForSelector("input[type=number]", { visible: true, timeout: 15000 });
          const nums = await page.$$("input[type=number]");
          await mark(page, nums[0], { center: false });
          await mark(page, await byText(page, "Kaydet", "main button"), { click: true, center: false });
        },
      },
      {
        title: "3D sekmesi",
        text: "3D sekmesinde her masa tipinin sehpası çizilir. Henüz çizilmemiş tipte “Masa Tasarla” düğmesi görünür; üstteki düğmelerle masa tipleri arasında geçilir.",
        run: async (page) => {
          await openProject(page, "3D");
          await sleep(2500);
          await mark(page, await byText(page, "Masa Tasarla", "main button"), { click: true });
        },
      },
      {
        title: "Masa tasarımı",
        text: "“Masa Tasarla” önce kolonları yerleştirme penceresini açar: sıra başına kolon sayısı, kolon aralıkları, yer üstü yükseklikleri ve montaj tipi (sürekli sömel, delgi beton, çakma, kalıp beton) girilir. Ardından kolon noktalarına tıklanarak kiriş, aşık, çapraz ve payanda eklenir; profiller gerçek kesitleriyle üç boyutlu çizilir.",
        run: async (page) => {
          await openProject(page, "3D");
          await sleep(2000);
          await press(page, await byText(page, "Masa Tasarla", "main button"), 2500);
        },
        after: async (page) => page.keyboard.press("Escape"),
      },
      {
        title: "Özet & rapor",
        text: "Masa tiplerine göre tonaj, sevk malzeme listesi (parça ve bağlantı elemanı toplamları) ve maliyet özeti tek sayfada. Bu sayfa PDF raporun önizlemesidir.",
        run: async (page) => {
          await openProject(page, "Özet & Rapor");
        },
      },
      {
        title: "Excel ve PDF",
        text: "“Excel Al” bütün parça ve bağlantı elemanı listesini tablo olarak, “PDF Rapor Al” özet raporu indirir.",
        run: async (page) => {
          await openProject(page);
          await mark(page, await byText(page, "Excel Al", "main button"), { center: false });
          await mark(page, await byText(page, "PDF Rapor Al", "main button"), { click: true, center: false });
        },
      },
    ],
  },

  {
    id: "projeler",
    group: "Projeler ve Kayıtlar",
    title: "Projeler, DIN Katalog ve Raporlar",
    intro: "Bütün projeler, bağlantı elemanı kataloğu ve proje raporları ayrı sayfalarda listelenir.",
    steps: [
      {
        title: "Proje listesi",
        text: "Projeler kurulu güç, masa sayısı, tonaj ve durumuyla listelenir; arama kutusuyla ada veya müşteriye göre bulunur.",
        run: async (page) => {
          await go(page, "/projects", 1200);
          await mark(page, await page.$('input[placeholder="Proje ara..."]'));
        },
      },
      {
        title: "DIN katalog",
        text: "Cıvata, somun, rondela ve diğer bağlantı elemanları DIN koduna göre ölçü, kalite ve birim ağırlıklarıyla listelenir; manuel eklenenler de burada görünür.",
        run: async (page) => {
          await go(page, "/catalog", 1200);
        },
      },
      {
        title: "Raporlar",
        text: "Her proje için rapor tek tıkla açılır; tonaj ve kurulu güç listede özetlenir.",
        run: async (page) => {
          await go(page, "/reports", 1200);
        },
      },
    ],
  },

  {
    id: "yonetim",
    group: "Yönetim",
    title: "Paylaşım, Profil ve Bildirimler",
    intro: "Proje raporunu giriş gerektirmeyen bir linkle paylaşabilir, profil bilgilerinizi ve bildirimlerinizi yönetebilirsiniz.",
    steps: [
      {
        title: "Paylaşım linkleri",
        text: "“Link Oluştur” ile bir projenin raporu salt okunur linkle paylaşılır; linkler süreleriyle listelenir.",
        run: async (page) => {
          await go(page, "/share", 1000);
          await mark(page, await byText(page, "Link Oluştur", "button"), { click: true });
        },
      },
      {
        title: "Profilim",
        text: "Ad soyad, telefon, şirket (panel) adı ve şifre bilgileri güncellenir.",
        run: async (page) => {
          await go(page, "/account", 1000);
        },
      },
      {
        title: "Bildirimler",
        text: "Proje ve paylaşım bildirimleri listelenir; tümü okundu işaretlenebilir veya silinebilir.",
        run: async (page) => {
          await go(page, "/notifications", 1000);
        },
      },
    ],
  },

  {
    id: "destek",
    group: "Destek",
    title: "Nasıl Çalışır, İletişim ve Platformlarım",
    intro: "Platformun hesap mantığı, geliştiriciyle iletişim ve aynı hesapla kullanılabilen diğer platformlar.",
    steps: [
      {
        title: "Nasıl çalışır",
        text: "Projeden rapora kadar akış ve sac açılımı, birim ağırlık, galvaniz hesaplarının formülleri anlatılır.",
        run: async (page) => {
          await go(page, "/how-it-works", 1000);
        },
      },
      {
        title: "İletişime geç",
        text: "Hata bildirimi, öneri veya soru için konu ve mesaj yazılır; mesaj e-posta uygulamanızda taslak olarak açılır.",
        run: async (page) => {
          await go(page, "/contact", 1000);
        },
      },
      {
        title: "Platformlarım",
        text: "Sol menüdeki Platformlarım bölümünden bu tanıtıma ve teklif, fizibilite, proje yönetimi ve satınalma karar destek platformlarına geçilir.",
        run: async (page) => {
          await go(page, "/platforms", 1000);
          await mark(page, await byText(page, "Platform Tanıtımı", "aside a, nav a, a"));
        },
      },
    ],
  },
];

// ---------------------------------------------------------------- çalıştır
const { browser, page } = await launch({ width: VW, height: VH });
const guestCtx = await browser.createBrowserContext();
const guest = await guestCtx.newPage();
autoDialogs(guest);
await noSmoothScroll(guest);
await guest.setViewport({ width: VW, height: VH, deviceScaleFactor: Number(process.env.TOUR_DPR || 2) });
guest.setDefaultTimeout(45_000);

try {
  // Demo profil + proje + masa tipleri + parçalar + bağlantı elemanları (yerel mod / localStorage)
  await go(page, "/login", 1000);
  const ins = await page.$$("form input");
  await fill(page, ins[0], DEMO.name);
  await fill(page, ins[1], DEMO.email);
  await (await byText(page, "Giriş Yap", "form button")).click();
  await sleep(2000);
  await go(page, "/projects/new", 1200);
  await fill(page, "#name", PROJECT.name);
  await fill(page, "#customer", PROJECT.customer);
  await fill(page, "#location", PROJECT.location);
  await fill(page, "#description", "Arazi tipi, sabit eğimli 2 sıra dikey masa");
  await press(page, await byText(page, "Devam Et", "button"), 800);
  await fill(page, "#panelWattage", "585");
  await press(page, await byText(page, "Projeyi Oluştur", "button"), 2500);
  await waitPath(page, /^\/projects\/(?!new)[^/]+$/);
  projectUrl = page.url();
  for (const [i, t] of TYPES.entries()) {
    await addType(page, t, i === 0);
    await (await modalButton(page, "Ekle")).click();
    await settle(page, 1500);
    await openType(page, t.name);
    await fillParts(page);
    for (const f of FASTENERS) {
      await addFastener(page, f);
      await (await modalButton(page, "Ekle")).click();
      await settle(page, 900);
    }
    await press(page, await byText(page, "Sehpa Parçaları", "main button"), 600);
    console.log("masa tipi hazır:", t.name);
  }

  // Maliyet birim fiyatları (USD/MWp göstergesi dolsun)
  await openProject(page, "Maliyet");
  {
    await page.waitForSelector("input[type=number]", { visible: true, timeout: 15000 });
    const nums = await page.$$("input[type=number]");
    // USD/kg (çelik, galvaniz, büküm+işçilik, bağlantı) ve sabit USD (nakliye, diğer) → ~21.000 USD/MWp
    const vals = ["1.15", "2.6", "0.35", "2.4", "18000", "5000"];
    for (let i = 0; i < Math.min(nums.length, 6); i++) await fill(page, nums[i], vals[i]);
    await press(page, await byText(page, "Kaydet", "main button"), 1200);
  }

  await runTour({
    modules: MODULES,
    pages: { main: page, guest },
    manifest: MANIFEST,
    only: process.argv.slice(2),
    hide: ["div.fixed.bottom-6.right-6"],
  });
} finally {
  await browser.close();
}
