import {setupServer} from 'msw/node'
import {
  authHandlers,
  viewsHandlers,
} from './handlers'

export const server = setupServer(...authHandlers, ...viewsHandlers)
