import { PrismaClient } from '@prisma/client';
import { calculatePart } from '../src/lib/calculations/profiles';
import { calculateFastenerTotal } from '../src/lib/calculations/totals';
import { DIN_CATALOG } from '../src/lib/constants/din-catalog';

const prisma = new PrismaClient();

interface SamplePart {
  code: string;
  name: string;
  profileType: 'C' | 'C_LIP' | 'U' | 'Z' | 'L' | 'SIGMA' | 'OMEGA' | 'I' | 'H' | 'CUSTOM';
  thickness: number;
  edges: number[];
  length: number;
  quantityPerTable: number;
  spareRatio?: number;
}

interface SampleFastener { code: string; size: string; length?: string; grade: string; qty: number; spare?: number; }

interface SampleTableType {
  name: string;
  description?: string;
  panelsPerTable: number;
  tableCount: number;
  parts: SamplePart[];
  fasteners: SampleFastener[];
}

interface SamplePricing {
  steelPricePerKg: number;
  galvanizingPricePerKg: number;
  bendLaborPerKg: number;
  fastenerPricePerKg: number;
  transportationFlat: number;
  otherCosts: number;
  currency?: string;
}

interface SampleProject {
  name: string;
  customer: string;
  location: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  panelWattage: number;
  tiltAngle: number;
  tableTypes: SampleTableType[];
  pricing?: SamplePricing;
}

const TYPICAL_FASTENERS: SampleFastener[] = [
  { code: 'DIN933', size: 'M12', length: '30mm', grade: '8.8', qty: 48 },
  { code: 'DIN934', size: 'M12', grade: '8.8', qty: 48 },
  { code: 'DIN127', size: 'M12', grade: '8.8', qty: 48 },
  { code: 'DIN125A', size: 'M12', grade: '8.8', qty: 96 },
  { code: 'KOSELI-KENAR', size: '30mm', length: '60mm', grade: 'T6 6063 Alüminyum', qty: 4 },
  { code: 'KOSELI-ORTA', size: '-', length: '60mm', grade: 'T6 6063 Alüminyum', qty: 52 },
];

const SAMPLE_PROJECTS: SampleProject[] = [
  {
    name: 'Antalya GES Saha-1',
    customer: 'AYDEM Yenilenebilir Enerji',
    location: 'Antalya / Aksu',
    description: 'Birinci faz — eğimli ve düz arazi karışık sehpa tipleri',
    status: 'ACTIVE',
    panelWattage: 580,
    tiltAngle: 25,
    pricing: {
      steelPricePerKg: 38,        // TL/kg
      galvanizingPricePerKg: 12,
      bendLaborPerKg: 8,
      fastenerPricePerKg: 95,
      transportationFlat: 120000,
      otherCosts: 25000,
    },
    tableTypes: [
      {
        name: 'Tip-1 (Standart 28 Panel)',
        description: 'Düz arazi için standart yapı',
        panelsPerTable: 28,
        tableCount: 80,
        parts: [
          { code: 'P1', name: 'Ön Kolon', profileType: 'C_LIP', thickness: 2.5, edges: [25, 80, 120, 80, 25], length: 1500, quantityPerTable: 2 },
          { code: 'P2', name: 'Arka Kolon', profileType: 'C_LIP', thickness: 2.5, edges: [25, 80, 120, 80, 25], length: 2500, quantityPerTable: 2 },
          { code: 'P3', name: 'Aşık (Purlin)', profileType: 'C', thickness: 2, edges: [70, 120, 70], length: 3890, quantityPerTable: 12 },
          { code: 'P4', name: 'Kiriş', profileType: 'U', thickness: 3, edges: [60, 100, 60], length: 3000, quantityPerTable: 2 },
          { code: 'P5', name: 'Çapraz', profileType: 'L', thickness: 4, edges: [50, 50], length: 1800, quantityPerTable: 4 },
        ],
        fasteners: TYPICAL_FASTENERS,
      },
      {
        name: 'Tip-2 (Yüksek Eğim 32 Panel)',
        description: 'Eğimli arazi için güçlendirilmiş yapı',
        panelsPerTable: 32,
        tableCount: 20,
        parts: [
          { code: 'P1', name: 'Ön Kolon (Güçlü)', profileType: 'C_LIP', thickness: 3, edges: [30, 100, 140, 100, 30], length: 1700, quantityPerTable: 2 },
          { code: 'P2', name: 'Arka Kolon (Güçlü)', profileType: 'C_LIP', thickness: 3, edges: [30, 100, 140, 100, 30], length: 2800, quantityPerTable: 2 },
          { code: 'P3', name: 'Aşık', profileType: 'C', thickness: 2.5, edges: [80, 140, 80], length: 4300, quantityPerTable: 14 },
          { code: 'P4', name: 'Diagonal', profileType: 'L', thickness: 5, edges: [60, 60], length: 2400, quantityPerTable: 4 },
        ],
        fasteners: [
          { code: 'DIN933', size: 'M14', length: '40mm', grade: '8.8', qty: 56 },
          { code: 'DIN934', size: 'M14', grade: '8.8', qty: 56 },
          { code: 'DIN127', size: 'M14', grade: '8.8', qty: 56 },
          { code: 'KOSELI-ORTA', size: '-', length: '60mm', grade: 'T6 6063 Alüminyum', qty: 60 },
        ],
      },
    ],
  },
  {
    name: 'Konya GES Mega Saha',
    customer: 'Karapınar Enerji',
    location: 'Konya / Karapınar',
    description: 'Tek tip büyük ölçek',
    status: 'ACTIVE',
    panelWattage: 600,
    tiltAngle: 28,
    pricing: {
      steelPricePerKg: 36,
      galvanizingPricePerKg: 11,
      bendLaborPerKg: 7,
      fastenerPricePerKg: 90,
      transportationFlat: 350000,
      otherCosts: 75000,
    },
    tableTypes: [
      {
        name: 'Tip-1 (Ana Sehpa)',
        panelsPerTable: 32,
        tableCount: 500,
        parts: [
          { code: 'P1', name: 'Ön Kolon', profileType: 'C_LIP', thickness: 3, edges: [30, 90, 140, 90, 30], length: 1800, quantityPerTable: 2 },
          { code: 'P2', name: 'Arka Kolon', profileType: 'C_LIP', thickness: 3, edges: [30, 90, 140, 90, 30], length: 2800, quantityPerTable: 2 },
          { code: 'P3', name: 'Aşık', profileType: 'C', thickness: 2.5, edges: [80, 140, 80], length: 4200, quantityPerTable: 14 },
          { code: 'P4', name: 'Kiriş', profileType: 'U', thickness: 3.5, edges: [70, 120, 70], length: 3500, quantityPerTable: 2 },
          { code: 'P5', name: 'Çapraz', profileType: 'L', thickness: 5, edges: [60, 60], length: 2200, quantityPerTable: 4 },
        ],
        fasteners: TYPICAL_FASTENERS,
      },
    ],
  },
  {
    name: 'İzmir Demo Pilot',
    customer: 'Solar Türkiye AŞ',
    location: 'İzmir / Bornova',
    description: 'Pilot prototip',
    status: 'DRAFT',
    panelWattage: 550,
    tiltAngle: 22,
    tableTypes: [
      {
        name: 'Tip-1',
        panelsPerTable: 24,
        tableCount: 10,
        parts: [
          { code: 'P1', name: 'Ön Kolon', profileType: 'C', thickness: 2, edges: [70, 100, 70], length: 1400, quantityPerTable: 2 },
          { code: 'P2', name: 'Arka Kolon', profileType: 'C', thickness: 2, edges: [70, 100, 70], length: 2300, quantityPerTable: 2 },
          { code: 'P3', name: 'Aşık', profileType: 'C', thickness: 1.8, edges: [65, 100, 65], length: 3600, quantityPerTable: 10 },
        ],
        fasteners: [
          { code: 'DIN933', size: 'M10', length: '30mm', grade: '8.8', qty: 32 },
          { code: 'DIN934', size: 'M10', grade: '8.8', qty: 32 },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Seed başlıyor...');
  const existingCount = await prisma.project.count();
  if (existingCount > 0) {
    console.log(`Mevcut ${existingCount} proje var, seed atlanıyor`);
    return;
  }

  for (const sp of SAMPLE_PROJECTS) {
    const project = await prisma.project.create({
      data: {
        name: sp.name,
        customer: sp.customer,
        location: sp.location,
        description: sp.description,
        status: sp.status,
        panelWattage: sp.panelWattage,
        tiltAngle: sp.tiltAngle,
      },
    });

    for (let t = 0; t < sp.tableTypes.length; t++) {
      const st = sp.tableTypes[t];
      const tt = await prisma.tableType.create({
        data: {
          projectId: project.id,
          name: st.name,
          description: st.description || null,
          panelsPerTable: st.panelsPerTable,
          tableCount: st.tableCount,
          order: t,
        },
      });

      for (let i = 0; i < st.parts.length; i++) {
        const p = st.parts[i];
        const calc = calculatePart({
          profileType: p.profileType,
          thickness: p.thickness,
          edges: p.edges,
          length: p.length,
          quantityPerTable: p.quantityPerTable,
          spareRatio: p.spareRatio ?? 2,
        });
        await prisma.sehpaPart.create({
          data: {
            tableTypeId: tt.id,
            code: p.code,
            name: p.name,
            profileType: p.profileType,
            thickness: p.thickness,
            edgesJson: JSON.stringify(p.edges),
            bendCount: calc.bendCount,
            bendAllowance: calc.bendAllowance,
            developedWidth: calc.developedWidth,
            length: p.length,
            quantityPerTable: p.quantityPerTable,
            spareRatio: p.spareRatio ?? 2,
            unitWeight: calc.unitWeight,
            totalWeightPerTable: calc.totalWeightPerTable,
            surfaceArea: calc.surfaceArea,
            galvanizingWeight: calc.galvanizingWeight,
            order: i,
          },
        });
      }

      for (let i = 0; i < st.fasteners.length; i++) {
        const f = st.fasteners[i];
        const catEntry = DIN_CATALOG.find(
          (c) => c.code === f.code && c.size === f.size && (f.length ? c.length === f.length : true) && c.grade === f.grade
        );
        const unitWeight = catEntry?.weight ?? 0.01;
        const detail = catEntry?.detail ?? f.code;
        const spareRatio = f.spare ?? 2;
        const totalWeightPerTable = calculateFastenerTotal({ unitWeight, quantityPerTable: f.qty, spareRatio });
        await prisma.fastener.create({
          data: {
            tableTypeId: tt.id,
            universalCode: f.code,
            detail,
            size: f.size,
            length: f.length || null,
            grade: f.grade,
            unitWeight,
            quantityPerTable: f.qty,
            spareRatio,
            totalWeightPerTable,
            source: 'CATALOG',
            order: i,
          },
        });
      }
    }

    if (sp.pricing) {
      await prisma.pricingConfig.create({
        data: {
          projectId: project.id,
          steelPricePerKg: sp.pricing.steelPricePerKg,
          galvanizingPricePerKg: sp.pricing.galvanizingPricePerKg,
          bendLaborPerKg: sp.pricing.bendLaborPerKg,
          fastenerPricePerKg: sp.pricing.fastenerPricePerKg,
          transportationFlat: sp.pricing.transportationFlat,
          otherCosts: sp.pricing.otherCosts,
          currency: sp.pricing.currency || 'TRY',
        },
      });
    }

    console.log(`✓ ${sp.name} (${sp.tableTypes.length} masa tipi)`);
  }

  console.log('Seed tamamlandı!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
