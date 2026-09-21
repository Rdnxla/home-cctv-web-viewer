import {setupWorker} from 'msw/browser'
import {
  authHandlers,
  viewsHandlers,
} from './handlers'

export const worker = setupWorker(
  ...authHandlers,
  ...viewsHandlers
)
