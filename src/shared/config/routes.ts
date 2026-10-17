/** Пути маршрутов для ссылок из слоёв ниже `app` (сам роутер — `src/router/routes.ts`) */
// TODO: вынести в основной файл маршрутов
export const ROUTES = {
  archive: '/archive',
  /** Архив камеры; имя параметра совпадает с разбором URL на странице архива (`pages/archive/model`) */
  cameraArchive: (id: string) => `/archive?camera=${encodeURIComponent(id)}`,
  cameraDetail: (id: string) => `/${encodeURIComponent(id)}/detail`,
  dashboard: '/dashboard',
  events: '/events',
} as const;
