import type { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { register as registerAlerts } from './handlers/alerts';
import { register as registerAuth } from './handlers/auth';
import { register as registerDocuments } from './handlers/documents';
import { register as registerGc } from './handlers/gc';
import { register as registerHistory } from './handlers/history';
import { register as registerHome } from './handlers/home';
import { register as registerLegal } from './handlers/legal';
import { register as registerLookups } from './handlers/lookups';
import { register as registerNotifications } from './handlers/notifications';
import { register as registerPpa } from './handlers/ppa';

type Handler = (mock: MockAdapter) => void;

// Handler modules (src/lib/api/mock/handlers/*.ts) each export `register`.
// Later tasks append their `register` functions here.
const handlers: Handler[] = [
  registerAuth,
  registerGc,
  registerHome,
  registerAlerts,
  registerDocuments,
  registerPpa,
  registerLegal,
  registerLookups,
  registerHistory,
  registerNotifications,
];

export function installMocks(instance: AxiosInstance, opts?: { delay?: number }): MockAdapter {
  const delay = opts?.delay ?? (process.env.NODE_ENV === 'test' ? 0 : 300);
  const mock = new MockAdapter(instance, { delayResponse: delay });
  for (const register of handlers) register(mock);
  return mock;
}
