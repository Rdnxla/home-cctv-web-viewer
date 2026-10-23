export const ROUTES = {
  archive: '/archive',
  /** Архив камеры; имя параметра совпадает с разбором URL на странице архива (`pages/archive/model`) */
  cameraArchive: (id: string) => `/archive?camera=${encodeURIComponent(id)}`,
  cameraDetail: (id: string) => `/${encodeURIComponent(id)}/detail`,
  cameraDetailPattern: '/:id/detail',
  dashboard: '/dashboard',
  events: '/events',
} as const;
