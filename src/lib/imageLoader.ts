/**
 * Returns the correct image URL.
 * Since we deploy at the root (no basePath), images in public/
 * are served at /path directly.
 */
export function imgSrc(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Ensure the path starts with /
  return path.startsWith('/') ? path : `/${path}`;
}
