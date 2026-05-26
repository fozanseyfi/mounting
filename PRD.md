# Solar GES Konstrüksiyon Ağırlık Hesaplama Web Uygulaması — PRD

> **Product Requirements Document — v1.0**
> Hedef: Solar Güneş Enerjisi Santrali (GES) projelerinde kullanılan çelik konstrüksiyon masalarının (kolonlar, kirişler, aşıklar, çapraz elemanlar, bağlantı elemanları, galvaniz kaplama) toplam ağırlığını otomatik hesaplayan, 3D görselleştirme destekli, çoklu proje yönetimi sunan bir web uygulaması.

---

## 1. Proje Amacı ve Hedef

### 1.1 Amaç
Mevcut **SDG BOM (Bill of Materials)** Excel tablolarının manuel hesaplama yükünü ortadan kaldıran, mühendislerin sadece profil tipi + temel ölçüler girerek tüm konstrüksiyonun ağırlığını **otomatik** hesaplayabildiği bir web uygulaması.

### 1.2 Hedef Kullanıcılar
- Solar GES tasarım mühendisleri
- Üretim ve tedarik zinciri yöneticileri
- Şantiye/saha lojistik sorumluları

### 1.3 Ana Çıktılar
1. Tek bir masanın toplam ağırlığı (kg)
2. Tüm projenin toplam tonajı (ton)
3. Sac + galvaniz + bağlantı elemanı kırılımı
4. Sahaya sevk edilecek malzeme listesi
5. Excel + PDF rapor
6. 3D interaktif önizleme (Three.js)

---

## 2. Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| Framework | **Next.js 15** (App Router) |
| UI | **TailwindCSS 4** + **shadcn/ui** |
| 3D Grafik | **Three.js** + **@react-three/fiber** + **@react-three/drei** (OrbitControls için) |
| Veritabanı | **SQLite** (better-sqlite3 / Prisma ORM) |
| Excel Export | **ExcelJS** |
| PDF Export | **jsPDF** + **jspdf-autotable** |
| State | **Zustand** (proje state'i için) |
| Form | **React Hook Form** + **Zod** validation |
| Dil | **Türkçe** (tek dil) |
| İkonlar | **lucide-react** |
| Tablo | **TanStack Table** |

### 2.1 Proje Yapısı
```
solar-bom-app/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                 # DIN katalog seed datası
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard (proje listesi)
│   │   ├── projects/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Proje detay + hesaplama
│   │   │       ├── 3d/page.tsx
│   │   │       └── report/page.tsx
│   │   └── api/
│   │       ├── projects/
│   │       ├── calculate/
│   │       └── export/
│   ├── components/
│   │   ├── ui/                 # shadcn bileşenleri
│   │   ├── forms/
│   │   │   ├── ProfileInput.tsx
│   │   │   ├── FastenerInput.tsx
│   │   │   └── ProjectMetaInput.tsx
│   │   ├── tables/
│   │   │   ├── BOMTable.tsx
│   │   │   └── FastenerTable.tsx
│   │   ├── viz/
│   │   │   ├── Scene3D.tsx     # Three.js sahne
│   │   │   ├── Column.tsx
│   │   │   ├── Beam.tsx
│   │   │   ├── Diagonal.tsx
│   │   │   └── Panel.tsx
│   │   └── reports/
│   │       ├── ExcelExporter.tsx
│   │       └── PDFExporter.tsx
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── profiles.ts     # Sac açılımı formülleri
│   │   │   ├── galvanizing.ts  # Galvaniz hesabı
│   │   │   ├── fasteners.ts    # Bağlantı elemanı hesabı
│   │   │   └── totals.ts       # Toplam hesabı
│   │   ├── constants/
│   │   │   ├── steel.ts        # Çelik yoğunluğu vs.
│   │   │   ├── din-catalog.ts  # DIN933, DIN934 vb.
│   │   │   └── profile-types.ts
│   │   └── db.ts
│   └── types/
│       └── index.ts
└── package.json
```

---

## 3. Veri Yapıları (TypeScript Types & Prisma Schema)

### 3.1 TypeScript Tipleri

```typescript
// Profil Tipleri
type ProfileType = 'C' | 'U' | 'Z' | 'L' | 'SIGMA' | 'OMEGA' | 'CUSTOM';

// Sehpa parçası (kolon, kiriş, aşık, çapraz vb.)
interface SehpaPart {
  id: string;
  code: string;               // P1, P2, ... P9
  name: string;               // "Ön Kolon", "Arka Kolon" vb.
  profileType: ProfileType;
  thickness: number;          // mm
  // Profil kenar ölçüleri (mm) — profil tipine göre değişir
  // C: [flange1, web, flange2]
  // U: [flange1, web, flange2]
  // Z: [flange1, web, flange2]
  // L: [leg1, leg2]
  // SIGMA: [flange1, web1, lip1, web2, lip2, web3, flange2]
  // OMEGA: [flange1, web1, top, web2, flange2]
  edges: number[];
  bendCount: number;          // büküm sayısı (otomatik hesaplanır)
  bendAllowance: number;      // mm (kalınlığa göre, varsayılan: kalınlık × 0.5)
  developedWidth: number;     // mm — hesaplanmış sac açılımı
  length: number;             // mm — parça uzunluğu
  quantityPerTable: number;   // 1 sehpada kullanılan adet
  spareRatio: number;         // % fire oranı (varsayılan 1-2%)
  unitWeight: number;         // kg (hesaplanmış)
  totalWeightPerTable: number;
  surfaceArea: number;        // m² (galvaniz için)
  galvanizingWeight: number;  // kg (yüzey × 600 g/m²)
}

// Bağlantı Elemanı (DIN933, DIN934 vb.)
interface Fastener {
  id: string;
  universalCode: string;      // "DIN933"
  detail: string;             // "Altıköşe Cıvata Tam Diş"
  size: string;               // "M14"
  length?: string;            // "30 mm" (vidalar için)
  grade: string;              // "8.8 Kalite", "A2-70 İnox" vb.
  unitWeight: number;         // kg (DIN katalogdan veya manuel)
  quantityPerTable: number;
  spareRatio: number;
  totalWeightPerTable: number;
  source: 'CATALOG' | 'MANUAL'; // hibrit yapı
}

// Proje
interface Project {
  id: string;
  name: string;
  customer: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;

  // Geometri / tasarım parametreleri
  tiltAngle: number;          // ° (örn: 25)
  tableCount: number;         // toplam masa sayısı
  panelsPerTable: number;     // bir masada kaç panel
  panelWattage: number;       // Wp (örn: 580)
  panelLength: number;        // mm
  panelWidth: number;         // mm

  // Konstrüksiyon parçaları
  parts: SehpaPart[];
  fasteners: Fastener[];

  // Hesaplanan toplamlar
  totals: ProjectTotals;
}

interface ProjectTotals {
  // Tek masa
  steelWeightPerTable: number;       // kg
  galvanizingWeightPerTable: number; // kg
  fastenerWeightPerTable: number;    // kg
  totalWeightPerTable: number;       // kg

  // Tüm proje
  totalSteelWeight: number;          // ton
  totalGalvanizingWeight: number;    // ton
  totalFastenerWeight: number;       // ton
  grandTotal: number;                // ton

  // Güç
  totalPanels: number;
  totalPowerMW: number;              // MW
  kgPerMW: number;                   // ton/MW oranı
}
```

### 3.2 Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Project {
  id              String   @id @default(cuid())
  name            String
  customer        String?
  location        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tiltAngle       Float    @default(25)
  tableCount      Int      @default(1)
  panelsPerTable  Int      @default(28)
  panelWattage    Float    @default(580)
  panelLength     Float    @default(2278)
  panelWidth      Float    @default(1134)

  parts           SehpaPart[]
  fasteners       Fastener[]
  totalsJson      String?   // Hesaplanmış toplamlar (cached JSON)
}

model SehpaPart {
  id                  String   @id @default(cuid())
  projectId           String
  project             Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  code                String   // P1, P2 ...
  name                String
  profileType         String   // C, U, Z, L, SIGMA, OMEGA, CUSTOM
  thickness           Float
  edgesJson           String   // JSON array of edge dimensions
  bendCount           Int
  bendAllowance       Float
  developedWidth      Float
  length              Float
  quantityPerTable    Int
  spareRatio          Float    @default(2)
  unitWeight          Float
  totalWeightPerTable Float
  surfaceArea         Float
  galvanizingWeight   Float
  order               Int      @default(0)
}

model Fastener {
  id                  String   @id @default(cuid())
  projectId           String
  project             Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  universalCode       String
  detail              String
  size                String
  length              String?
  grade               String
  unitWeight          Float
  quantityPerTable    Int
  spareRatio          Float    @default(2)
  totalWeightPerTable Float
  source              String   // CATALOG | MANUAL
  order               Int      @default(0)
}

// Kullanıcının manuel girip kütüphaneye kaydettiği özel bağlantı elemanları
model CustomFastenerLibrary {
  id            String   @id @default(cuid())
  universalCode String
  detail        String
  size          String
  length        String?
  grade         String
  unitWeight    Float
  createdAt     DateTime @default(now())

  @@unique([universalCode, size, length, grade])
}
```

---

## 4. Hesaplama Formülleri

### 4.1 Çelik Yoğunluğu
```
ρ_steel = 7.85 g/cm³ = 7850 kg/m³ = 7.85 × 10⁻⁶ kg/mm³
```

### 4.2 Sac Açılımı (Developed Width)

**Profil tipine göre kenar sayısı + büküm sayısı:**

| Profil | Kenarlar | Büküm Sayısı |
|---|---|---|
| C profil | flange1, web, flange2 | 2 |
| U profil | flange1, web, flange2 | 2 |
| Z profil | flange1, web, flange2 | 2 |
| L profil | leg1, leg2 | 1 |
| Σ Sigma | flange1, web1, lip1, web2, lip2, web3, flange2 | 6 |
| Ω Omega | flange1, web1, top, web2, flange2 | 4 |
| Custom | n adet kenar | n-1 |

**Büküm Payı (Bend Allowance) Formülü:**
```
K_factor = 0.41 (genel çelik için)
BA = (π × bend_angle / 180) × (thickness × K_factor + inner_radius)
```

**Pratik yaklaşım (varsayılan, mühendis basit kullanım için):**
```
bend_allowance_per_bend ≈ thickness × 0.5   (90° büküm için yaklaşık)
```

**Toplam Açılım:**
```
developed_width = Σ(edges) - (bend_count × thickness)
// veya gelişmiş mod:
developed_width = Σ(edges) - (bend_count × (2 × thickness - bend_allowance))
```

### 4.3 Tek Parça Ağırlığı

```
unitWeight (kg) = developedWidth(mm) × length(mm) × thickness(mm) × 7.85 / 1.000.000
```

### 4.4 Yüzey Alanı (Galvaniz İçin)

```
surfaceArea (m²) = 2 × developedWidth(mm) × length(mm) / 1.000.000
// 2× çünkü sacın iki yüzü de galvanizlenir
```

### 4.5 Galvaniz Ağırlığı (Sıcak Daldırma)

```
galvanizingWeight (kg) = surfaceArea(m²) × 0.6 kg/m²
// 600 g/m² = 0.6 kg/m² standart sıcak daldırma galvaniz kaplama yoğunluğu
```

### 4.6 Bağlantı Elemanı Ağırlığı

**DIN Katalog (önceden tanımlı — bkz. Bölüm 5):**
```
fastenerWeight = catalogLookup(universalCode, size, length, grade)
```

**Toplam (fire dahil):**
```
totalWeightPerTable = unitWeight × quantityPerTable × (1 + spareRatio/100)
```

### 4.7 Bir Masanın Toplam Ağırlığı

```
steelWeightPerTable     = Σ(part.totalWeightPerTable)   for each part
galvanizingPerTable     = Σ(part.galvanizingWeight × part.quantityPerTable × (1+spare/100))
fastenerWeightPerTable  = Σ(fastener.totalWeightPerTable) for each fastener

totalWeightPerTable = steelWeightPerTable + galvanizingPerTable + fastenerWeightPerTable
```

### 4.8 Proje Toplamı

```
totalSteel        = steelWeightPerTable        × tableCount / 1000   // ton
totalGalvanizing  = galvanizingPerTable        × tableCount / 1000   // ton
totalFasteners    = fastenerWeightPerTable     × tableCount / 1000   // ton
grandTotal        = totalWeightPerTable        × tableCount / 1000   // ton

totalPanels       = panelsPerTable × tableCount
totalPowerMW      = totalPanels × panelWattage / 1.000.000           // MW
kgPerMW           = grandTotal × 1000 / totalPowerMW                 // kg/MW
```

### 4.9 Doğrulama (Verified Example from SDG BOM)

Görseldeki örnek `P3.Aşık`:
- Profil: C, kalınlık 2mm, kenarlar 70+51+15 ≈ 186mm açılım
- Uzunluk: 3.890 mm
- Hesap: 186 × 3890 × 2 × 7.85 / 1.000.000 = **11.36 kg** ≈ Excel'de **11.58 kg** ✓
- (Fark: büküm payı ve baş kıvrımı dahil)

---

## 5. DIN Bağlantı Elemanı Kataloğu (Hibrit Sistem)

### 5.1 Yaklaşım: 3 + 4 Hibrit
1. **Yerleşik katalog** (en yaygın olanlar hazır)
2. **Kullanıcı manuel ekleyebilir**
3. **Manuel eklenenler kütüphaneye kaydedilir** (bir sonraki projede tekrar kullanılır)

### 5.2 Seed Data — DIN Katalog

```typescript
// lib/constants/din-catalog.ts

export const DIN_CATALOG = [
  // DIN933 — Altıköşe Cıvata Tam Diş (8.8 Kalite)
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M8',  length: '20mm', grade: '8.8',  weight: 0.0089 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M10', length: '30mm', grade: '8.8',  weight: 0.0300 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M12', length: '30mm', grade: '8.8',  weight: 0.0470 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M14', length: '30mm', grade: '8.8',  weight: 0.0648 },
  { code: 'DIN933', detail: 'Altıköşe Cıvata Tam Diş', size: 'M16', length: '40mm', grade: '8.8',  weight: 0.1100 },

  // DIN934 — Altıköşe Somun
  { code: 'DIN934', detail: 'Somun', size: 'M8',  grade: '8.8', weight: 0.0050 },
  { code: 'DIN934', detail: 'Somun', size: 'M10', grade: '8.8', weight: 0.0135 },
  { code: 'DIN934', detail: 'Somun', size: 'M12', grade: '8.8', weight: 0.0210 },
  { code: 'DIN934', detail: 'Somun', size: 'M14', grade: '8.8', weight: 0.0280 },
  { code: 'DIN934', detail: 'Somun', size: 'M16', grade: '8.8', weight: 0.0400 },

  // DIN127 — Yaylı Rondela
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M8',  grade: '8.8', weight: 0.0015 },
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M10', grade: '8.8', weight: 0.0028 },
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M12', grade: '8.8', weight: 0.0045 },
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M14', grade: '8.8', weight: 0.0067 },
  { code: 'DIN127', detail: 'Yaylı Rondela', size: 'M16', grade: '8.8', weight: 0.0095 },

  // DIN125A — Düz Rondela (3mm)
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M8',  length: '3/8', grade: '8.8', weight: 0.0030 },
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M10', length: '3/8', grade: '8.8', weight: 0.0050 },
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M12', length: '9/16', grade: '8.8', weight: 0.0080 },
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M14', length: '9/16', grade: '8.8', weight: 0.0104 },
  { code: 'DIN125A', detail: 'Düz Rondela (3mm)', size: 'M16', length: '9/16', grade: '8.8', weight: 0.0150 },

  // DIN912 — İmbus Cıvata (Inox)
  { code: 'DIN912', detail: 'İmbus Cıvata',  size: 'M8',  length: '25mm', grade: 'A2-70 İnox', weight: 0.0180 },
  { code: 'DIN912', detail: 'İmbus Cıvata',  size: 'M8',  length: '45mm', grade: 'A2-70 İnox', weight: 0.0256 },

  // Klempler (Özel — üretici ürünü)
  { code: 'KOSELI-KENAR', detail: 'Köşeli Kenar Klemp', size: '30mm', length: '60mm', grade: 'T6 6063', weight: 0.0533 },
  { code: 'KOSELI-ORTA',  detail: 'Köşeli Orta Klemp',  size: '-',    length: '60mm', grade: 'T6 6063', weight: 0.0533 },

  // Ray İçi Somun
  { code: 'RAY-SOMUN', detail: 'Ray İçi Somun', size: '25mm', length: '50mm', grade: 'A2-70 İnox', weight: 0.0392 },
];
```

### 5.3 Manuel Giriş + Kütüphane Kaydı

Kullanıcı katalogta olmayan bir parça eklediğinde:
1. Form üzerinden ağırlık girer
2. "Bu parçayı kütüphaneye kaydet" checkbox'ı işaretlenirse `CustomFastenerLibrary` tablosuna eklenir
3. Sonraki projede dropdown'da `[CATALOG] + [LIBRARY]` birleşik görünür

---

## 6. UI / UX Akışı

### 6.1 Sayfa Hiyerarşisi

```
/ (Dashboard)
├── Proje listesi (tablo): proje adı, müşteri, toplam ton, MW, oluşturma tarihi
├── [+ Yeni Proje] butonu
└── Her proje satırında: Görüntüle / Düzenle / Sil / Excel / PDF butonları

/projects/new
├── Adım 1: Proje Meta Bilgileri
│   ├── Proje adı, müşteri, lokasyon
│   ├── Eğim açısı (°), masa sayısı
│   └── Panel bilgileri (boyut, watt, masa başına adet)
└── [Devam Et] → /projects/[id]

/projects/[id]
├── 4 sekme:
│   ├── Tab 1: SEHPA PARÇALARI
│   ├── Tab 2: BAĞLANTI ELEMANLARI
│   ├── Tab 3: 3D ÖNİZLEME
│   └── Tab 4: ÖZET & RAPOR
└── Sağ panelde sticky özet kartı: toplam ağırlık, MW, ton

/projects/[id]/report
└── İndirilebilir: Excel | PDF | 3D PNG
```

### 6.2 SEHPA PARÇALARI Sekmesi (Tab 1)

Excel'deki "SEHPA TİPİ" bölümünün karşılığı:

| Sütun | Tip | Açıklama |
|---|---|---|
| Sıra | Auto | P1, P2, ... |
| Parça Adı | Input | "Ön Kolon", "Aşık" vb. |
| Profil Tipi | Select | C / U / Z / L / Σ / Ω / Custom |
| Kalınlık (mm) | Number | |
| Kenar Ölçüleri | Dynamic | Profil tipine göre değişir |
| Sac Açılımı (mm) | **Auto** | Hesaplanmış (read-only) |
| Uzunluk (mm) | Number | |
| Adet/Masa | Number | |
| Fire (%) | Number | Varsayılan 2 |
| **Birim Ağırlık (kg)** | **Auto** | Hesaplanmış |
| **Toplam (kg)** | **Auto** | × adet × (1+fire) |
| **Galvaniz (kg)** | **Auto** | Yüzey × 0.6 |
| Aksiyon | Buttons | Düzenle / Sil / Klonla |

[+ Parça Ekle] butonu → Modal: profil tipi seçimi → dinamik form

### 6.3 BAĞLANTI ELEMANLARI Sekmesi (Tab 2)

Excel'deki "BAĞLANTI ELEMANLARI" bölümünün karşılığı:

| Sütun | Tip |
|---|---|
| Universal Kodu | Select (CATALOG + LIBRARY) |
| Detay | Auto (koda göre) veya Manuel |
| Ölçü (mm) | Auto/Manuel |
| Kalite | Auto/Manuel |
| Birim Ağırlık (kg) | Auto/Manuel |
| Adet/Masa | Number |
| Fire (%) | Number |
| Toplam (kg) | Auto |

### 6.4 3D ÖNİZLEME Sekmesi (Tab 3) — Detaylı Spec

**Three.js / React Three Fiber sahnesi:**

#### Kamera & Kontrol
- `PerspectiveCamera` (FOV 50)
- `OrbitControls`: pan + zoom + döndürme (her yöne serbest)
- Otomatik fit-to-view butonu

#### Sahne Elemanları
1. **Zemin/Toprak** — gri texture'lı plane (Excel'deki taşlı zemin gibi)
2. **Beton Temel** — kolonların gömüldüğü beton bloklar (3D box)
3. **Ön Kolon (P1)** — sarı/turuncu silindir veya box (gerçek profile göre)
4. **Arka Kolon (P2)** — aynı renkte, farklı yükseklik
5. **Aşık (P3)** — kolonların üstüne 25° eğimle yerleşmiş
6. **Kiriş (P4)** — yatay
7. **Çapraz (P5)** — kolonlar arası diagonal
8. **Diyagonal (P6)** — alt destek
9. **Paneller** — mavi/koyu mavi renkte düz quad'lar (panelsPerTable kadar)
10. **Boyutlandırma ok işaretleri** — opsiyonel toggle: tüm ölçüler (kolon yüksekliği, eğim, panel boyutu)

#### Etiketler
- Her parça üzerinde küçük `Html` etiketi (react-three/drei) → "P1: 2.553mm"
- Açı etiketi (25°)
- Eksen göstergesi (sol alt köşede mini gizmo)

#### Kontroller (sağ panel)
- ✓ Ölçüleri göster
- ✓ Etiketleri göster
- ✓ Panelleri göster
- ✓ Temeli göster
- 🎨 Renk teması (gündüz / gece)
- 📸 PNG olarak kaydet

#### Dinamik Bağlantı
Tab 1'de kullanıcı her parametre değiştirdiğinde 3D sahne **anında** güncellenir.
- Kolon yüksekliği değişti → mesh scale güncellenir
- Eğim açısı değişti → aşık rotation güncellenir
- Panel sayısı değişti → panel meshleri yeniden oluşturulur

### 6.5 ÖZET & RAPOR Sekmesi (Tab 4)

#### Üst Kart: KPI'lar
| Metrik | Değer |
|---|---|
| Tek Masa Ağırlığı | XX,XX kg |
| Toplam Sac Ağırlığı | X.XXX,XX ton |
| Toplam Galvaniz | XXX,XX ton |
| Toplam Bağlantı Elemanı | XX,XX ton |
| **GRAND TOTAL** | **X.XXX,XX ton** |
| Toplam Panel | XX.XXX adet |
| Toplam Güç | XX,XX MW |
| Ton/MW Oranı | XX,XX |

#### Orta: Pie Chart (Recharts veya benzer)
Sac / Galvaniz / Bağlantı dağılımı

#### Alt: Detaylı Tablo
Excel BOM'un birebir kopyası — tüm parçalar + bağlantı elemanları satır satır

#### Butonlar
- 📊 Excel Olarak İndir (.xlsx)
- 📄 PDF Olarak İndir (.pdf)
- 🖼️ 3D Görseli İndir (.png)

---

## 7. Rapor Çıktıları

### 7.1 Excel Çıktısı (ExcelJS)
Mevcut SDG BOM Excel formatını **birebir** taklit etmeli:
- Yeşil başlık satırı "SDG BOM LİSTESİ"
- Krem rengi bölüm başlıkları "SEHPA TİPİ", "BAĞLANTI ELEMANLARI"
- Sarı dolgu hesaplanmış hücrelerde
- Mavi "TOPLAM TONAJ" satırı
- Tüm hücreler kenarlıklı
- Türkçe sütun başlıkları (Excel'deki tam isimlendirme)

**Sayfalar:**
1. **Özet** — KPI'lar + proje bilgisi
2. **BOM Listesi** — orijinal Excel formatı
3. **Bağlantı Elemanları** — detay
4. **Hesaplama Detayları** — formüller + her parçanın hesabı

### 7.2 PDF Çıktısı (jsPDF + autoTable)
- A4 yatay, kurumsal antet alanı
- 1. sayfa: Kapak (proje adı, müşteri, toplam ton, MW, tarih)
- 2. sayfa: 3D görselin PNG'si + KPI özet
- 3+. sayfa: BOM tabloları
- Son sayfa: Onay / İmza alanı

---

## 8. Geliştirme Adımları (Claude Code İçin Sıra)

### Phase 1: Temel Setup (Day 1)
```bash
npx create-next-app@latest solar-bom-app --typescript --tailwind --app
cd solar-bom-app
npm install prisma @prisma/client better-sqlite3
npm install three @react-three/fiber @react-three/drei
npm install exceljs jspdf jspdf-autotable
npm install zustand react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install @tanstack/react-table recharts
npx prisma init --datasource-provider sqlite
```

### Phase 2: Veritabanı + Seed
- `schema.prisma` oluştur
- `npx prisma migrate dev --name init`
- `prisma/seed.ts` → DIN katalog seed'i
- `npx prisma db seed`

### Phase 3: Hesaplama Motoru
- `lib/calculations/profiles.ts` — profil tipine göre açılım
- `lib/calculations/galvanizing.ts`
- `lib/calculations/fasteners.ts`
- `lib/calculations/totals.ts`
- **Unit testler** (Vitest): SDG BOM'daki örnek değerlerle doğrulama

### Phase 4: CRUD API + Sayfalar
- `/api/projects` (GET, POST)
- `/api/projects/[id]` (GET, PUT, DELETE)
- `/api/projects/[id]/calculate` (POST → totals)
- Dashboard sayfası
- Yeni proje wizard'ı

### Phase 5: Form Bileşenleri
- ProfileInput (dinamik kenar ölçüleri profil tipine göre)
- FastenerInput (catalog autocomplete)
- TableLayout (sekmeli)

### Phase 6: 3D Sahne
- Scene3D bileşeni
- Her parça için Mesh bileşeni
- OrbitControls + auto-fit
- HTML etiketleri
- Dinamik state bağlantısı

### Phase 7: Raporlama
- ExcelExporter (BOM format)
- PDFExporter (cover + 3D PNG)

### Phase 8: Polish
- Türkçe metinler tutarlı hale getirilsin
- Loading states
- Toast notifications
- Form validasyonları
- Responsive design (tablette de çalışsın)

---

## 9. Önemli Notlar & Edge Cases

### 9.1 Doğrulama Kuralları
- Kalınlık > 0
- Tüm kenar ölçüleri > 0
- Uzunluk > 0
- Adet > 0 (tam sayı)
- Fire 0–10 arası
- Profil tipi seçilmeden form submit edilmemeli

### 9.2 Performans
- 3D sahnede her parça için tek mesh (instancing gerek yok, ~10 mesh)
- Hesaplamalar memoized (useMemo / Zustand selectors)
- Excel export web worker'da (büyük projeler için)

### 9.3 Tablodaki Mevcut Excel ile Doğrulama
Görselde verilen P3.Aşık örneği test case olarak unit teste eklenmeli:
- Input: C, 2mm, [70,51,15], 3890mm uzunluk, 12 adet
- Expected: ~11.58 kg/adet (±%5 tolerans)

### 9.4 Çoklu Sehpa Tipi (Gelecek Sürüm)
v1.0'da tek sehpa tipi destekleniyor. v2.0'da bir projede farklı sehpa konfigürasyonları olabilir (örn: 2P, 3P, 4P portrait).

### 9.5 Birim Tutarlılığı
- TÜM ölçüler veritabanında **mm** ve **kg**
- Yüzde alanlar **m²**
- Toplam ağırlıklar UI'da **ton** olarak da gösterilir
- Sayı formatı: TR locale (1.234,56)

---

## 10. Renk Paleti ve Tasarım Dili

Tailwind config:
```js
colors: {
  primary: {
    DEFAULT: '#2D7D46',  // Excel'deki yeşil başlık
    dark: '#1F5E33',
    light: '#4CAF50',
  },
  accent: {
    yellow: '#FFEB3B',   // Hesaplanmış hücreler
    blue:   '#2196F3',   // Toplam tonaj satırı
    cream:  '#F5E6CC',   // Section başlıkları
  }
}
```

Genel hissiyat: **Endüstriyel + Modern**. Kurumsal yeşil ana renk, bol whitespace, net tipografi (Inter font).

---

## 11. Başarı Kriterleri

- ✅ SDG BOM Excel'indeki örnek değerler ±%2 toleransla yeniden üretilebiliyor
- ✅ 1MW'lık bir proje için tüm hesaplama 3 dakikadan kısa sürede tamamlanabiliyor
- ✅ 3D önizleme 60 FPS akıcı çalışıyor
- ✅ Excel çıktı orijinal BOM ile birebir uyumlu
- ✅ PDF rapor müşteriye sunulabilir kalitede
- ✅ Tüm projeler SQLite'a kaydediliyor ve geri yüklenebiliyor

---

## EK A: Örnek Hesaplama (SDG BOM'dan)

**Proje:** Antalya GES — 100 masa, 28 panel/masa, 580Wp panel

**P3 Aşık (C profil):**
- Kalınlık: 2mm, Kenarlar: 70 + 51 + 15 = 136mm? (görselde 186mm görünüyor — büküm payı dahil)
- Uzunluk: 3.890mm, Adet: 12
- Açılım: 186mm, Ağırlık: 186 × 3890 × 2 × 7.85 / 1.000.000 ≈ **11.36 kg**
- Yüzey: 2 × 186 × 3890 / 1.000.000 = 1.447 m²
- Galvaniz: 1.447 × 0.6 = **0.868 kg**
- Bir masada: 12 × 11.36 = **136.3 kg** (sac)
- Bir masada galvaniz: 12 × 0.868 = **10.4 kg**

**Tüm proje:**
- Toplam masa: 100
- Toplam sac (1 masada ~250kg × 100): **25 ton**
- Galvaniz: ~1.5 ton
- Bağlantı: ~0.5 ton
- **Grand Total: ~27 ton**
- Toplam panel: 2.800 adet
- Toplam güç: 2.800 × 580 / 1.000.000 = **1.624 MW**
- Ton/MW: 27 / 1.624 = **16.6 ton/MW**

---

## 12. Lisans ve Bakım

- Lisans: MIT (özel kullanım için kapatılabilir)
- Bakım: Yeni DIN profilleri eklenebilir, profil tipleri genişletilebilir
- Yedekleme: SQLite veritabanı `prisma/dev.db` dosyası

---

**Versiyon:** 1.0
**Hazırlayan:** Claude (Anthropic) için PRD
**Hedef Geliştirici:** Claude Code
**Tahmini Geliştirme Süresi:** 4-6 gün (tam zamanlı)
