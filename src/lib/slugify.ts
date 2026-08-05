import type { Evento, Producto, Servicio } from '@/hooks/useData';

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

export function productSlug(product: Producto, all: Producto[]): string {
  const base = slugify(product.title);
  const colliding = all.filter((p) => slugify(p.title) === base);
  if (colliding.length <= 1) return base;
  return colliding[0].id === product.id ? base : `${base}-${product.id}`;
}

export function findProductBySlug(productos: Producto[], slug: string): Producto | undefined {
  return productos.find(
    (product) =>
      slug === slugify(product.title) || slug === `${slugify(product.title)}-${product.id}`,
  );
}

export function eventoSlug(event: Evento, all: Evento[]): string {
  const base = slugify(event.title);
  const colliding = all.filter((e) => slugify(e.title) === base);
  if (colliding.length <= 1) return base;
  return colliding[0].id === event.id ? base : `${base}-${event.id}`;
}

export function findEventoBySlug(eventos: Evento[], slug: string): Evento | undefined {
  return eventos.find(
    (event) =>
      slug === slugify(event.title) || slug === `${slugify(event.title)}-${event.id}`,
  );
}
