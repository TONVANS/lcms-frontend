import axios from 'axios';
import { env } from '@/config/env';
import { installInterceptors } from './interceptors';

let unauthorizedHandler: () => void = () => {};
let tokenRefreshedHandler: (token: string, rawUser?: unknown) => void = () => {};

/** The auth store registers its logout + redirect here. */
export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

export function setTokenRefreshedHandler(fn: (token: string, rawUser?: unknown) => void): void {
  tokenRefreshedHandler = fn;
}

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 20000,
  withCredentials: false,
  headers: { 'Accept-Language': 'lo' },
});

installInterceptors(api, {
  onUnauthorized: () => unauthorizedHandler(),
  onTokenRefreshed: (token, rawUser) => tokenRefreshedHandler(token, rawUser),
});
