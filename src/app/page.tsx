// Root page — middleware rewrites / to the default locale (es) internally.
// English users are redirected to /en/ via the middleware.
// This component should never be reached at runtime.
export default function RootPage() {
  return null;
}
