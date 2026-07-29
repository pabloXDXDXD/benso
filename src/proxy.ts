import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - /api, /_next, /_vercel
  // - files with dots (favicon.ico, etc.)
  // - /admin and /team (non-localized routes with their own auth)
  matcher: '/((?!api|_next|_vercel|admin|team|.*\\..*).*)',
};
