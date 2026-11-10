import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '@/types';
import { formatNumber } from '@/lib/utils';

export async function downloadPDF(project: Project) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const t = project.totals!;
  const c = project.cost;
  const sym = 'USD';

  // Cover
  doc.setFillColor(45, 125, 70);
  doc.rect(0, 0, 297, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SOLAR BOM RAPORU', 148, 20, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Solar GES Konstrüksiyon Tonaj ve Maliyet Raporu', 148, 30, { align: 'center' });
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString('tr-TR'), 148, 38, { align: 'center' });

  // Meta
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, 14, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 68;
  const meta: [string, string][] = [
    ['Müşteri', project.customer || '—'],
    ['Lokasyon', project.location || '—'],
    ['Panel Gücü', `${project.panelWattage} Wp`],
    ['Eğim Açısı', `${project.tiltAngle}°`],
    ['Masa Tipi', `${project.tableTypes.length} tip · ${t.totalTables} masa`],
  ];
  meta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${k}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(v), 50, y);
    y += 6;
  });

  // KPI block - right side
  const kpiX = 165;
  let kpiY = 60;
  doc.setFillColor(33, 150, 243);
  doc.roundedRect(kpiX, kpiY, 120, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`GRAND TOTAL: ${formatNumber(t.grandTotal)} ton`, kpiX + 60, kpiY + 9, { align: 'center' });
  kpiY += 18;

  doc.setTextColor(30, 30, 30);
  const kpis: [string, string][] = [
    ['Toplam Çelik', `${formatNumber(t.totalSteelWeight)} ton`],
    ['Toplam Galvaniz', `${formatNumber(t.totalGalvanizingWeight)} ton`],
    ['Toplam Bağlantı', `${formatNumber(t.totalFastenerWeight)} ton`],
    ['Toplam Güç', `${formatNumber(t.totalPowerMW)} MWp`],
    ['Toplam Panel', `${formatNumber(t.totalPanels, 0)} adet`],
    ['Ton / MWp', formatNumber(t.kgPerMW / 1000, 2)],
  ];
  doc.setFontSize(9);
  kpis.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(k, kpiX, kpiY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(v, kpiX + 120, kpiY, { align: 'right' });
    kpiY += 6;
  });

  // Cost block on cover (if pricing set)
  if (c) {
    doc.setFillColor(45, 125, 70);
    doc.roundedRect(14, 130, 270, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOPLAM ÇELİK MALİYETİ: ${formatNumber(c.totalCost, 0)} ${sym}`, 148, 140, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatNumber(c.costPerMW, 0)} USD / MWp · ${formatNumber(t.kgPerMW / 1000, 2)} Ton / MWp`, 148, 146, { align: 'center' });
  }

  // === Page 2: Masa Tipi Özeti ===
  doc.addPage();
  doc.setFillColor(45, 125, 70);
  doc.rect(0, 0, 297, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('MASA TİPLERİ ÖZETİ', 14, 12);

  autoTable(doc, {
    startY: 24,
    head: [['Tip', 'Açıklama', 'Adet', 'Panel/Masa', 'Tek Masa (kg)', 'Toplam (ton)', 'MWp']],
    body: project.tableTypes.map((tt) => {
      const tot = tt.totals!;
      return [
        tt.name,
        tt.description || '—',
        String(tt.tableCount),
        String(tt.panelsPerTable),
        formatNumber(tot.totalWeightPerTable, 2),
        formatNumber(tot.grandTotal, 3),
        formatNumber(tot.totalPowerMW, 3),
      ];
    }),
    foot: [['TOPLAM', '', String(t.totalTables), '', '', formatNumber(t.grandTotal, 3), formatNumber(t.totalPowerMW, 3)]],
    headStyles: { fillColor: [45, 125, 70], textColor: 255, fontSize: 10 },
    footStyles: { fillColor: [255, 235, 59], textColor: 30, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // === Cost breakdown page ===
  if (c) {
    doc.addPage();
    doc.setFillColor(45, 125, 70);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('MALİYET ANALİZİ', 14, 12);

    autoTable(doc, {
      startY: 24,
      head: [['Kalem', 'Birim Fiyat', 'Kütle / Sabit', 'Toplam', '%']],
      body: [
        ['Sac (Çelik)', `${formatNumber(project.pricing!.steelPricePerKg, 2)} ${sym}/kg`, `${formatNumber(t.totalSteelWeight * 1000, 0)} kg`, `${formatNumber(c.steelCost, 0)} ${sym}`, `${formatNumber((c.steelCost / c.totalCost) * 100, 1)}%`],
        ['Galvaniz Kaplama', `${formatNumber(project.pricing!.galvanizingPricePerKg, 2)} ${sym}/kg`, `${formatNumber(t.totalGalvanizingWeight * 1000, 0)} kg`, `${formatNumber(c.galvanizingCost, 0)} ${sym}`, `${formatNumber((c.galvanizingCost / c.totalCost) * 100, 1)}%`],
        ['Büküm + İşçilik', `${formatNumber(project.pricing!.bendLaborPerKg, 2)} ${sym}/kg çelik`, `${formatNumber(t.totalSteelWeight * 1000, 0)} kg`, `${formatNumber(c.bendLaborCost, 0)} ${sym}`, `${formatNumber((c.bendLaborCost / c.totalCost) * 100, 1)}%`],
        ['Bağlantı Elemanları', `${formatNumber(project.pricing!.fastenerPricePerKg, 2)} ${sym}/kg`, `${formatNumber(t.totalFastenerWeight * 1000, 1)} kg`, `${formatNumber(c.fastenerCost, 0)} ${sym}`, `${formatNumber((c.fastenerCost / c.totalCost) * 100, 1)}%`],
        ['Nakliye (Sabit)', '—', '—', `${formatNumber(c.transportationCost, 0)} ${sym}`, `${formatNumber((c.transportationCost / c.totalCost) * 100, 1)}%`],
        ['Diğer Giderler', '—', '—', `${formatNumber(c.otherCosts, 0)} ${sym}`, `${formatNumber((c.otherCosts / c.totalCost) * 100, 1)}%`],
      ],
      foot: [['TOPLAM MALİYET', '', '', `${formatNumber(c.totalCost, 0)} ${sym}`, '100%']],
      headStyles: { fillColor: [45, 125, 70], textColor: 255, fontSize: 10 },
      footStyles: { fillColor: [45, 125, 70], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: finalY,
      head: [['Birim Maliyet', 'Değer']],
      body: [
        ['USD / MWp', `${formatNumber(c.costPerMW, 0)} USD / MWp`],
        ['Ton / MWp', `${formatNumber(t.kgPerMW / 1000, 2)} Ton / MWp`],
      ],
      headStyles: { fillColor: [33, 150, 243], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      margin: { left: 14, right: 150 },
    });
  }

  // === Per-type detail pages ===
  for (const tt of project.tableTypes) {
    doc.addPage();
    doc.setFillColor(45, 125, 70);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${tt.name} — SEHPA PARÇALARI`, 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tt.tableCount} masa · ${tt.panelsPerTable} panel/masa`, 290, 12, { align: 'right' });

    autoTable(doc, {
      startY: 24,
      head: [['Kod', 'Parça Adı', 'Profil', 'Kalınlık', 'Kenarlar (a, b, c…)', 'Açılım', 'Uzunluk', 'Adet', 'Birim (kg)', 'Toplam (kg)', 'Galv (kg)']],
      body: tt.parts.map((p) => [
        p.code, p.name, p.profileType,
        formatNumber(p.thickness, 1),
        p.edges.map((e, i) => `${String.fromCharCode(97 + i)}=${e}`).join(' '),
        formatNumber(p.developedWidth, 1),
        String(p.length),
        String(p.quantityPerTable),
        formatNumber(p.unitWeight, 3),
        formatNumber(p.totalWeightPerTable, 2),
        formatNumber(p.galvanizingWeight, 2),
      ]),
      headStyles: { fillColor: [45, 125, 70], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    if (tt.fasteners.length > 0) {
      const startY = (doc as any).lastAutoTable.finalY + 6;
      autoTable(doc, {
        startY,
        head: [['Bağlantı Kodu', 'Detay', 'Ölçü', 'Uzunluk', 'Kalite', 'Birim (kg)', 'Adet/Masa', 'Fire %', 'Toplam (kg)']],
        body: tt.fasteners.map((f) => [
          f.universalCode, f.detail, f.size, f.length || '—', f.grade,
          formatNumber(f.unitWeight, 4),
          String(f.quantityPerTable),
          formatNumber(f.spareRatio, 1),
          formatNumber(f.totalWeightPerTable, 3),
        ]),
        headStyles: { fillColor: [121, 85, 72], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
    }
  }

  // Page footers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Solar BOM · Kontrolmatik · Sayfa ${i} / ${pages}`, 148, 205, { align: 'center' });
  }

  doc.save(`${slugify(project.name)}-rapor.pdf`);
}

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
