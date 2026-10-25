type SortOrder = 'asc' | 'desc';

interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type {PaginatedResponse, SortOrder};
