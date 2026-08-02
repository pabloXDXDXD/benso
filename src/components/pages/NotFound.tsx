'use client';

import Link from 'next/link';

export function NotFound() {
  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Página no encontrada</h2>
      <p style={{ marginBottom: '2rem', color: 'var(--text-light)' }}>
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </p>
      <Link href="/" className="btn-primary">
        Volver al Inicio
      </Link>
    </div>
  );
}
