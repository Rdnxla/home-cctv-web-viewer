import './app/global.scss';
import '@radix-ui/themes/styles.css';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {RouterProvider} from 'react-router/dom';
import {router} from '@/app/routes';

const queryClient = new QueryClient();

async function enableMocking() {
  // GitHub Pages has no backend, so the `pages` build ships the mocks as a demo
  if (!import.meta.env.DEV && import.meta.env.MODE !== 'pages') {
    return;
  }
  const {worker} = await import('./mocks/browser');
  return worker.start({
    quiet: true,
    serviceWorker: {url: `${import.meta.env.BASE_URL}mockServiceWorker.js`},
  });
}

const container = document.querySelector('#root');

enableMocking()
  .then(() => {
    if (container) {
      const root = createRoot(container);
      root.render(
        <StrictMode>
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <RouterProvider router={router} />
          </QueryClientProvider>
        </StrictMode>
      );
    }
  })
  .catch(error => {
    throw new Error(`Failed to enable mocking: ${error}`);
  });
