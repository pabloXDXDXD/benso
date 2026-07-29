'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
] as const;

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('languageSelector');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (code: string) => {
    const path = pathname || '/';
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.replace(path, { locale: code });
    setOpen(false);
  };

  const current = locale.toUpperCase();

  return (
    <div className="language-dropdown" ref={ref}>
      <button
        className="language-dropdown-trigger"
        onClick={() => setOpen(!open)}
        aria-label={t('ariaLabel', { locale })}
        aria-expanded={open}
      >
        <Globe size={14} />
        <span>{current}</span>
      </button>

      {open && (
        <div className="language-dropdown-menu">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              className={`language-dropdown-item${l.code === locale ? ' active' : ''}`}
              onClick={() => select(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}