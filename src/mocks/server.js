import {setupServer} from 'msw/node'
import {
  authHandlers,
  nvrHandlers,
} from './handlers'

export const server = setupServer(...authHandlers, ...nvrHandlers)
