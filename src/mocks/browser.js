import {setupWorker} from 'msw/browser';
import {authHandlers, eventHandlers, nvrHandlers} from './handlers';

export const worker = setupWorker(...authHandlers, ...nvrHandlers, ...eventHandlers);
