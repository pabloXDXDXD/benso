import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - /api, /_next, /_vercel
  // - files with dots (favicon.ico, etc.)
  // - /team (admin login routes use their own auth)
  matcher: '/((?!api|_next|_vercel|team|.*\\..*).*)',
};
