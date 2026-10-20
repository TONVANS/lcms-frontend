import type { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { register as registerAuth } from './handlers/auth';

type Handler = (mock: MockAdapter) => void;

// Handler modules (src/lib/api/mock/handlers/*.ts) each export `register`.
// Later tasks append their `register` functions here.
const handlers: Handler[] = [registerAuth];

export function installMocks(instance: AxiosInstance, opts?: { delay?: number }): MockAdapter {
  const delay = opts?.delay ?? (process.env.NODE_ENV === 'test' ? 0 : 300);
  const mock = new MockAdapter(instance, { delayResponse: delay });
  for (const register of handlers) register(mock);
  return mock;
}
