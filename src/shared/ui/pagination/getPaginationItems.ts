type PaginationItem = number | 'end-ellipsis' | 'start-ellipsis';

/** Края (первая и последняя), текущая, соседи с каждой стороны и два многоточия */
const FIXED_ITEMS = 5;

function range(from: number, to: number) {
  return Array.from({length: to - from + 1}, (_, offset) => from + offset);
}

/**
 * Номера страниц для пагинации с постоянным числом элементов, чтобы кнопки не прыгали:
 * `1 2 3 4 5 … 20`, `1 … 9 10 11 … 20`, `1 … 16 17 18 19 20`.
 */
export function getPaginationItems(page: number, totalPages: number, siblings = 1): PaginationItem[] {
  if (totalPages <= siblings * 2 + FIXED_ITEMS) return range(1, totalPages);

  const siblingsStart = Math.max(Math.min(page - siblings, totalPages - siblings * 2 - 2), 3);
  const siblingsEnd = Math.min(Math.max(page + siblings, siblings * 2 + 3), totalPages - 2);

  return [
    1,
    siblingsStart > 3 ? 'start-ellipsis' : 2,
    ...range(siblingsStart, siblingsEnd),
    siblingsEnd < totalPages - 2 ? 'end-ellipsis' : totalPages - 1,
    totalPages,
  ];
}
