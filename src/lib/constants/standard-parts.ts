/** Bir solar sehpada standart olarak bulunan parçalar.
 *  Yeni masa tipi oluşturulduğunda bu 7 parça otomatik boş şablon olarak eklenir;
 *  kullanıcı sadece ölçü/adet girerek tamamlar.
 */
export const STANDARD_PARTS = [
  { code: 'P1', name: 'Ön Kolon' },
  { code: 'P2', name: 'Arka Kolon' },
  { code: 'P3', name: 'Kiriş' },
  { code: 'P4', name: 'Aşık' },
  { code: 'P5', name: 'Çapraz' },
  { code: 'P6', name: 'Payanda' },
  { code: 'P7', name: 'Ek Elemanı' },
] as const;

/** Bir parça "henüz doldurulmamış (placeholder)" mı? */
export function isPlaceholderPart(p: { thickness: number; length: number; quantityPerTable: number }): boolean {
  return (p.thickness || 0) === 0 || (p.length || 0) === 0 || (p.quantityPerTable || 0) === 0;
}
