'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>{t('title')}</h2>
      <p style={{ marginBottom: '2rem', color: 'var(--text-light)' }}>
        {t('description')}
      </p>
      <Link href="/" className="btn-primary">
        {t('goHome')}
      </Link>
    </div>
  );
}
