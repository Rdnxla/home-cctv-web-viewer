import { createBrowserRouter } from 'react-router'
import { Component as Root } from '@/app/layouts/empty/EmptyLayout'
import { Component as MainLayout } from '@/app/layouts/main/MainLayout'

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      {
        path: '/',
        lazy: () => import('@/pages/auth/Auth'),
      },
    ],
  },
  {
    Component: MainLayout,
    children: [
      {
        path: '/dashboard',
        lazy: () => import('@/pages/client-dashboard/ClientDashboard'),
      },
      {
        path: '/events',
        lazy: () => import('@/pages/event-list/EventList'),
      },
    ],
  },
])