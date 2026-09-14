import './app/global.css'
import '@radix-ui/themes/styles.css'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {RouterProvider} from 'react-router/dom'
import {router} from '@/routes'

const queryClient = new QueryClient()

async function enableMocking() {
  if (!import.meta.env.DEV) {
    return
  }
  const {worker} = await import('./mocks/browser')
  return worker.start()
}

const container = document.querySelector('#root');

enableMocking()
  .then(() => {
    if (container) {
      const root = createRoot(container)
      root.render(
        <StrictMode>
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <RouterProvider router={router} />
          </QueryClientProvider>
        </StrictMode>
      )
    }
  })
  .catch(error => {
    throw new Error(`Failed to enable mocking: ${error}`)
  })
