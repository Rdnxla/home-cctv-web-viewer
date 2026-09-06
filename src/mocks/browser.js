import {setupWorker} from 'msw/browser';
import {authHandlers, nvrHandlers} from './handlers';

export const worker = setupWorker(...authHandlers, ...nvrHandlers);
