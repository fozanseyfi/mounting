import jsPDF from 'jspdf';
import type { Project, TableType } from '@/types';
import { formatNumber, formatDate } from '@/lib/utils';

export interface CapturedViews {
  iso: string;
  front: string;
  side: string;
  top: string;
}

const PRIMARY = [45, 125, 70] as [number, number, number];
const ACCENT = [33, 150, 243] as [number, number, number];

export function exportDesignPDF(
  project: Project,
  tableType: TableType,
  captures: CapturedViews,
  designInfo: {
    mountType: string;
    columnCount: number;
    elementCount: number;
    rowLength_mm: number;
    frontToBackDistance_mm: number;
    frontColumnHeight_mm: number;
    backColumnHeight_mm: number;
    tiltAngle: number;
  }
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ===== COVER PAGE =====
  drawHeaderBand(doc, 'TASARIM RAPORU');

  // Project info block
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, 14, 50);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Masa Tipi: ${tableType.name}`, 14, 58);

  // Meta grid (left side)
  let y = 70;
  const meta: [string, string][] = [
    ['Müşteri', project.customer || '—'],
    ['Lokasyon', project.location || '—'],
    ['Tarih', formatDate(new Date())],
    ['Panel Gücü', `${project.panelWattage} Wp`],
    ['Panel/Masa', `${tableType.panelsPerTable}`],
    ['Masa Adedi', `${tableType.tableCount}`],
  ];
  meta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${k}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(String(v), 50, y);
    y += 6;
  });

  // Design info block (right side)
  y = 70;
  const designMeta: [string, string][] = [
    ['Montaj Tipi', designInfo.mountType],
    ['Toplam Kolon', `${designInfo.columnCount}`],
    ['Toplam Eleman', `${designInfo.elementCount}`],
    ['Sıra Genişliği', `${formatNumber(designInfo.rowLength_mm, 0)} mm`],
    ['Ön-Arka Mesafe', `${formatNumber(designInfo.frontToBackDistance_mm, 0)} mm`],
    ['Yükseklik', `Ön ${designInfo.frontColumnHeight_mm} / Arka ${designInfo.backColumnHeight_mm} mm`],
    ['Eğim', `${designInfo.tiltAngle}°`],
  ];
  designMeta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${k}:`, 150, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(String(v), 195, y);
    y += 6;
  });

  // Main ISO image on cover
  try {
    doc.addImage(captures.iso, 'PNG', 14, 130, 270, 60, undefined, 'FAST');
  } catch {
    /* ignore */
  }

  drawFooter(doc, 1, 3);

  // ===== PAGE 2: 4 VIEWS GRID =====
  doc.addPage();
  drawHeaderBand(doc, 'GÖRÜNÜŞLER');

  const tileW = 132;
  const tileH = 80;
  const padX = 14;
  const padY = 35;
  const gapX = 5;
  const gapY = 10;

  const tiles: Array<{ key: keyof CapturedViews; label: string; x: number; y: number }> = [
    { key: 'iso',   label: 'İzometrik', x: padX,                 y: padY },
    { key: 'front', label: 'Ön Görünüm', x: padX + tileW + gapX, y: padY },
    { key: 'side',  label: 'Yan Görünüm', x: padX,                 y: padY + tileH + gapY },
    { key: 'top',   label: 'Üst Görünüm', x: padX + tileW + gapX, y: padY + tileH + gapY },
  ];

  for (const t of tiles) {
    // Border + label
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(t.x, t.y, tileW, tileH);
    doc.setFillColor(...ACCENT);
    doc.rect(t.x, t.y, tileW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(t.label, t.x + 2, t.y + 4.3);
    try {
      doc.addImage(captures[t.key], 'PNG', t.x + 1, t.y + 7, tileW - 2, tileH - 8, undefined, 'FAST');
    } catch {
      /* ignore */
    }
  }

  drawFooter(doc, 2, 3);

  // ===== PAGE 3: SUMMARY =====
  doc.addPage();
  drawHeaderBand(doc, 'PROJE ÖZETİ');

  const t = project.totals;
  if (t) {
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Proje Toplam Ağırlıkları', 14, 50);

    let sy = 60;
    const totals: [string, string][] = [
      ['Toplam Sac (Çelik)', `${formatNumber(t.totalSteelWeight)} ton`],
      ['Toplam Galvaniz', `${formatNumber(t.totalGalvanizingWeight)} ton`],
      ['Toplam Bağlantı', `${formatNumber(t.totalFastenerWeight)} ton`],
      ['GRAND TOTAL', `${formatNumber(t.grandTotal)} ton`],
      ['Toplam Güç', `${formatNumber(t.totalPowerMW)} MW`],
      ['Toplam Panel', `${formatNumber(t.totalPanels, 0)} adet`],
      ['kg / MW', formatNumber(t.kgPerMW, 1)],
    ];
    doc.setFontSize(11);
    totals.forEach(([k, v]) => {
      const isGrand = k === 'GRAND TOTAL';
      if (isGrand) {
        doc.setFillColor(...ACCENT);
        doc.rect(14, sy - 5, 200, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(k, 18, sy);
      doc.text(v, 210, sy, { align: 'right' });
      sy += 7;
    });
  }

  drawFooter(doc, 3, 3);

  doc.save(`${slugify(project.name)}-${slugify(tableType.name)}-tasarim.pdf`);
}

function drawHeaderBand(doc: jsPDF, title: string) {
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 297, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SOLAR BOM — KONSTRÜKSİYON TASARIMI', 14, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 22);
  // Right side: brand
  doc.setFontSize(9);
  doc.text('Kontrolmatik · solar-bom-platformu', 283, 12, { align: 'right' });
  doc.text(new Date().toLocaleString('tr-TR'), 283, 22, { align: 'right' });
}

function drawFooter(doc: jsPDF, page: number, total: number) {
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Sayfa ${page} / ${total}`, 148, 205, { align: 'center' });
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(14, 198, 283, 198);
}

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
