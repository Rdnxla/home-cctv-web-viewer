import {setupServer} from 'msw/node';
import {authHandlers, eventHandlers, nvrHandlers} from './handlers';

export const server = setupServer(...authHandlers, ...nvrHandlers, ...eventHandlers);
