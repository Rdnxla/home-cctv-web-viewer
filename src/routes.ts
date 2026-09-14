import { createBrowserRouter } from 'react-router'
import { Component as Root } from '@/app/app'

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
])