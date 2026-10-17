export type SortOrder = 'asc' | 'desc';

/** Страница списка с серверной пагинацией; `page` начинается с 1 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
