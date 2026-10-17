/** Пути маршрутов для ссылок из слоёв ниже `app` (сам роутер — `src/router/routes.ts`) */
// TODO: вынести в основной файл маршрутов
export const ROUTES = {
  cameraDetail: (id: string) => `/${encodeURIComponent(id)}/detail`,
  dashboard: '/dashboard',
  events: '/events',
} as const;
