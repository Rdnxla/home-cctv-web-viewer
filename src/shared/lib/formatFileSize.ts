const UNITS = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
const BASE = 1024;

const numberFormat = new Intl.NumberFormat('ru', {maximumFractionDigits: 1});

/** `1,8 ГБ` */
export function formatFileSize(bytes: number) {
  let value = Math.max(0, bytes);
  let unitIndex = 0;
  while (value >= BASE && unitIndex < UNITS.length - 1) {
    value /= BASE;
    unitIndex += 1;
  }
  return `${numberFormat.format(value)} ${UNITS[unitIndex] ?? ''}`;
}
