import type MockAdapter from 'axios-mock-adapter';
import {
  MOCK_CONTRACT_TYPES,
  MOCK_DEPARTMENTS,
  MOCK_PROJECT_TYPES,
} from '@/features/lookups/mocks/lookups.mock';
import { endpoints } from '../../endpoints';
import { getMockSessionUser } from '../session';

const UNAUTHORIZED = {
  statusCode: 401,
  message: 'Unauthorized',
  error: 'Unauthorized',
};

export function register(mock: MockAdapter): void {
  const serve = (data: unknown) => (): [number, unknown] =>
    getMockSessionUser() ? [200, { data }] : [401, UNAUTHORIZED];

  mock.onGet(endpoints.departments.dropdown).reply(serve(MOCK_DEPARTMENTS));
  mock.onGet(endpoints.contractTypes.dropdown).reply(serve(MOCK_CONTRACT_TYPES));
  mock.onGet(endpoints.powerContracts.projectTypes).reply(serve(MOCK_PROJECT_TYPES));
}
