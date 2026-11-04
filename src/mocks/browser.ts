import {setupWorker} from 'msw/browser';
import {archiveHandlers, authHandlers, eventHandlers, nvrHandlers} from './handlers';

export const worker = setupWorker(...authHandlers, ...nvrHandlers, ...eventHandlers, ...archiveHandlers);
