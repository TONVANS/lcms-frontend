export const ROUTES = {
  home: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  forbidden: '/forbidden',
  notifications: '/notifications',
} as const;

export const PUBLIC_ROUTES: string[] = ['/login', '/forgot-password'];
