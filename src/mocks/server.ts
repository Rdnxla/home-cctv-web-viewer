import {setupServer} from 'msw/node';
import {archiveHandlers, authHandlers, eventHandlers, nvrHandlers} from './handlers';

export const server = setupServer(...authHandlers, ...nvrHandlers, ...eventHandlers, ...archiveHandlers);
