import ExcelJS from 'exceljs';
import type { Project } from '@/types';
import { formatNumber } from '@/lib/utils';

const GREEN = 'FF2D7D46';
const YELLOW = 'FFFFEB3B';
const BLUE = 'FF2196F3';
const BORDER = 'FFCBD5E1';

export async function downloadExcel(project: Project) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Solar BOM Hesaplama';
  workbook.created = new Date();

  const t = project.totals!;
  const c = project.cost;
  const sym = 'USD';

  // =========== Özet ===========
  const summary = workbook.addWorksheet('Özet');
  summary.columns = [{ width: 38 }, { width: 25 }];
  applyTitleRow(summary, 'SOLAR BOM — PROJE ÖZETİ', 2);
  let r = 3;
  const meta: [string, string | number][] = [
    ['Proje Adı', project.name],
    ['Müşteri', project.customer || '—'],
    ['Lokasyon', project.location || '—'],
    ['Tarih', new Date().toLocaleDateString('tr-TR')],
    ['Panel Gücü', `${project.panelWattage} Wp`],
    ['Eğim Açısı', `${project.tiltAngle}°`],
    ['Masa Tipi Sayısı', project.tableTypes.length],
    ['Toplam Masa', t.totalTables],
  ];
  for (const [k, v] of meta) {
    summary.getCell(`A${r}`).value = k;
    summary.getCell(`B${r}`).value = v;
    r++;
  }
  r++;
  applyTitleRow(summary, 'KPI METRİKLERİ', 2, r);
  r++;
  const kpis: [string, string | number][] = [
    ['Toplam Sac (Çelik) [ton]', formatNumber(t.totalSteelWeight, 3)],
    ['Toplam Galvaniz [ton]', formatNumber(t.totalGalvanizingWeight, 3)],
    ['Toplam Bağlantı Elemanı [ton]', formatNumber(t.totalFastenerWeight, 3)],
    ['GRAND TOTAL [ton]', formatNumber(t.grandTotal, 3)],
    ['Toplam Panel [adet]', t.totalPanels],
    ['Toplam Güç [MW]', formatNumber(t.totalPowerMW, 3)],
    ['Ton / MWp', formatNumber(t.kgPerMW / 1000, 2)],
  ];
  for (const [k, v] of kpis) {
    summary.getCell(`A${r}`).value = k;
    summary.getCell(`B${r}`).value = v;
    if (String(k).includes('GRAND')) {
      summary.getRow(r).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      });
    }
    r++;
  }

  if (c) {
    r++;
    applyTitleRow(summary, 'MALİYET ÖZETİ', 2, r);
    r++;
    const costs: [string, string][] = [
      ['Sac (Çelik) Maliyeti', `${formatNumber(c.steelCost, 0)} ${sym}`],
      ['Galvaniz Maliyeti', `${formatNumber(c.galvanizingCost, 0)} ${sym}`],
      ['Büküm + İşçilik', `${formatNumber(c.bendLaborCost, 0)} ${sym}`],
      ['Bağlantı Elemanları', `${formatNumber(c.fastenerCost, 0)} ${sym}`],
      ['Nakliye', `${formatNumber(c.transportationCost, 0)} ${sym}`],
      ['Diğer Giderler', `${formatNumber(c.otherCosts, 0)} ${sym}`],
      ['TOPLAM MALİYET', `${formatNumber(c.totalCost, 0)} ${sym}`],
      ['USD / MWp', `${formatNumber(c.costPerMW, 0)} USD / MWp`],
      ['Ton / MWp', `${formatNumber(t.kgPerMW / 1000, 2)} Ton / MWp`],
    ];
    for (const [k, v] of costs) {
      summary.getCell(`A${r}`).value = k;
      summary.getCell(`B${r}`).value = v;
      if (k === 'TOPLAM MALİYET') {
        summary.getRow(r).eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        });
      }
      r++;
    }
  }
  borderAll(summary, 1, 1, r - 1, 2);

  // =========== Masa Tipi Özeti ===========
  const types = workbook.addWorksheet('Masa Tipleri');
  types.columns = [
    { header: 'Tip', width: 28 },
    { header: 'Açıklama', width: 30 },
    { header: 'Masa Adedi', width: 12 },
    { header: 'Panel/Masa', width: 12 },
    { header: 'Tek Masa (kg)', width: 14 },
    { header: 'Toplam Tonaj (ton)', width: 16 },
    { header: 'MWp', width: 10 },
  ];
  types.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  for (const tt of project.tableTypes) {
    const tot = tt.totals!;
    types.addRow([
      tt.name,
      tt.description || '',
      tt.tableCount,
      tt.panelsPerTable,
      Number(tot.totalWeightPerTable.toFixed(2)),
      Number(tot.grandTotal.toFixed(3)),
      Number(tot.totalPowerMW.toFixed(3)),
    ]);
  }
  const totalRow = types.addRow(['TOPLAM', '', t.totalTables, '', '', Number(t.grandTotal.toFixed(3)), Number(t.totalPowerMW.toFixed(3))]);
  totalRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } };
    cell.font = { bold: true };
  });
  borderAll(types, 1, 1, types.rowCount, 7);

  // =========== One sheet per table type ===========
  for (const tt of project.tableTypes) {
    const sheet = workbook.addWorksheet(`BOM - ${shorten(tt.name, 25)}`);
    sheet.columns = [
      { header: 'Kod', width: 8 },
      { header: 'Parça Adı', width: 24 },
      { header: 'Profil', width: 10 },
      { header: 'Kalınlık (mm)', width: 12 },
      { header: 'Kenarlar (mm)', width: 24 },
      { header: 'Açılım (mm)', width: 12 },
      { header: 'Uzunluk (mm)', width: 12 },
      { header: 'Adet/Masa', width: 10 },
      { header: 'Fire %', width: 8 },
      { header: 'Birim (kg)', width: 12 },
      { header: 'Toplam (kg)', width: 12 },
      { header: 'Galvaniz (kg)', width: 13 },
    ];
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    tt.parts.forEach((p) => {
      sheet.addRow([
        p.code, p.name, p.profileType,
        p.thickness,
        p.edges.map((e, i) => `${String.fromCharCode(97 + i)}=${e}`).join(' '),
        Number(p.developedWidth.toFixed(2)),
        p.length, p.quantityPerTable, p.spareRatio,
        Number(p.unitWeight.toFixed(4)),
        Number(p.totalWeightPerTable.toFixed(2)),
        Number(p.galvanizingWeight.toFixed(2)),
      ]);
    });

    // Fasteners section header
    if (tt.fasteners.length > 0) {
      sheet.addRow([]);
      const sec = sheet.addRow(['BAĞLANTI ELEMANLARI']);
      sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, 12);
      sec.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5E6CC' } };
        cell.font = { bold: true };
      });
      const fhead = sheet.addRow(['Kod', 'Detay', 'Ölçü', 'Uzunluk', 'Kalite', '', '', 'Adet', 'Fire %', 'Birim (kg)', 'Toplam (kg)', '']);
      fhead.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      });
      tt.fasteners.forEach((f) => {
        sheet.addRow([
          f.universalCode, f.detail, f.size, f.length || '', f.grade,
          '', '',
          f.quantityPerTable, f.spareRatio,
          Number(f.unitWeight.toFixed(4)),
          Number(f.totalWeightPerTable.toFixed(3)),
          '',
        ]);
      });
    }

    // Totals row
    const tot = tt.totals!;
    const tRow = sheet.addRow([
      '', `${tt.name} — TEK MASA TOPLAM`, '', '', '', '', '', '', '', '',
      Number((tot.steelWeightPerTable + tot.fastenerWeightPerTable).toFixed(2)),
      Number(tot.galvanizingWeightPerTable.toFixed(2)),
    ]);
    tRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } };
      cell.font = { bold: true };
    });
    borderAll(sheet, 1, 1, sheet.rowCount, 12);
  }

  const buf = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(project.name)}-BOM.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function applyTitleRow(ws: ExcelJS.Worksheet, title: string, span: number, row = 1) {
  ws.mergeCells(row, 1, row, span);
  const cell = ws.getCell(row, 1);
  cell.value = title;
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 13 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(row).height = 26;
}

function borderAll(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = {
        top: { style: 'thin', color: { argb: BORDER } },
        left: { style: 'thin', color: { argb: BORDER } },
        bottom: { style: 'thin', color: { argb: BORDER } },
        right: { style: 'thin', color: { argb: BORDER } },
      };
    }
  }
}

function shorten(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
