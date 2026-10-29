import axios from 'axios';
import { env } from '@/config/env';
import { installInterceptors } from './interceptors';
import { installMocks } from './mock';

let unauthorizedHandler: () => void = () => {};

/** The auth store registers its logout + redirect here. */
export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 20000,
  withCredentials: false,
  headers: { 'Accept-Language': 'lo' },
});

installInterceptors(api, { onUnauthorized: () => unauthorizedHandler() });

if (env.NEXT_PUBLIC_API_MODE === 'mock') {
  installMocks(api);
}
