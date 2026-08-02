import type { Servicio } from '@/hooks/useData';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function serviceSlug(service: Servicio, all: Servicio[]): string {
  const base = slugify(service.title);
  const colliding = all.filter((s) => slugify(s.title) === base);
  if (colliding.length <= 1) return base;
  return colliding[0].id === service.id ? base : `${base}-${service.id}`;
}

export function findBySlug(servicios: Servicio[], slug: string): Servicio | undefined {
  return servicios.find(
    (service) =>
      slug === slugify(service.title) || slug === `${slugify(service.title)}-${service.id}`,
  );
}