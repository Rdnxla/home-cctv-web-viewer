import {createBrowserRouter} from 'react-router';
import {Component as Root} from '@/app/layouts/empty/EmptyLayout';
import {Component as MainLayout} from '@/app/layouts/main/MainLayout';

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      {
        lazy: () => import('@/pages/auth/Auth'),
        path: '/',
      },
    ],
  },
  {
    Component: MainLayout,
    children: [
      {
        lazy: () => import('@/pages/dashboard'),
        path: '/dashboard',
      },
      {
        lazy: () => import('@/pages/cam-page'),
        path: '/:id/detail',
      },
      {
        lazy: () => import('@/pages/event-list'),
        path: '/events',
      },
      {
        lazy: () => import('@/pages/archive'),
        path: '/archive',
      },
    ],
  },
]);
