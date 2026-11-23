/*
 * Giriş sayfasının BU PLATFORMA ÖZGÜ kısmı. Sayfanın geri kalanı
 * components/auth/login-kit.tsx'te — o dosya bütün platformlarda birebir aynıdır.
 */
import type { LoginPlatform } from '@/components/auth/login-kit';
import { BrandMark } from '@/components/layout/BrandMark';
import manifest from '@/lib/tanitim/manifest.json';
import { TOUR } from '@/lib/tanitim/config';

interface TourModule { id: string; title: string; steps: { img: string; title: string }[] }
const MODULES = (manifest.modules as TourModule[]).filter((m) => m.steps.length > 0);

function shot(moduleId: string, step: number) {
  const m = MODULES.find((x) => x.id === moduleId) ?? MODULES[0];
  const s = m?.steps[Math.min(step, (m?.steps.length ?? 1) - 1)];
  return { id: m?.id ?? moduleId, img: s?.img ?? '', title: s?.title ?? '' };
}

const hero = shot('masa-tipleri', 3);

export const LOGIN_PLATFORM: LoginPlatform = {
  id: 'bom',
  name: 'Solar BOM',
  fullName: 'Konstrüksiyon BoM Platformu',
  mark: <BrandMark />,
  accent: TOUR.accent,
  accentDark: TOUR.accentDark,
  intro: {
    eyebrow: 'GES konstrüksiyonu için',
    title: 'Sehpanın her parçası, toplam tonaj ve maliyet, tek hesapta.',
    text:
      'Panel ölçüsünü ve masa düzenini girin; profillerden bağlantı elemanlarına kadar parça listesi, ağırlık ve maliyet kendiliğinden çıkar. Masayı 3B görürsünüz, raporu Excel ya da PDF olarak alırsınız.',
    points: [
      { title: 'Masa tipleri', text: 'Panel dizilimi, eğim ve sehpa ölçüleri' },
      { title: 'Parça listesi', text: 'Profiller, bağlantı elemanları ve DIN kataloğu' },
      { title: 'Tonaj ve maliyet', text: 'Parça bazında ağırlık, birim fiyat ve toplam' },
      { title: '3B görünüm ve rapor', text: 'Masa tasarımı, özet rapor; Excel ve PDF' },
    ],
  },
  hero: { img: hero.img, caption: `Gerçek ekran: ${hero.title}`, href: `/tanitim#${hero.id}` },
  privacy: [
    'Giriş profiliniz yalnızca bu tarayıcıda tutulur',
    'Yerel modda projeler tarayıcıda saklanır',
    'Üçüncü taraf izleme ya da reklam yok',
    'Şifreli giriş yakında',
  ],
  tour: {
    text: TOUR.promoText,
    modules: MODULES.map((m) => ({ id: m.id, title: m.title })),
    total: MODULES.reduce((n, m) => n + m.steps.length, 0),
    previews: TOUR.previews.map((p) => ({ ...shot(p.id, p.step), label: p.label })),
  },
  links: { register: null },
};
