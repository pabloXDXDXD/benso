'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

// Bump version to invalidate browser caches. Stale entries from previous deploys
// hydrate synchronously and can differ from the prerendered HTML (React error #418).
// v4: the price base changed from CUP to USD, so a cached `price_num` from
// before the migration would be read as USD and show the wrong price.
const CACHE_KEY = 'swr-cache-v4';

function localStorageProvider() {
  const map = new Map<string, unknown>();

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        for (const [key, value] of Object.entries(parsed)) {
          map.set(key, value);
        }
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }

    window.addEventListener('beforeunload', () => {
      const obj: Record<string, unknown> = {};
      for (const [key, value] of map.entries()) {
        obj[key] = value;
      }
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
      } catch {
        // storage unavailable
      }
    });
  }

  return map;
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider as any,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: true,
        errorRetryCount: 2,
        dedupingInterval: 60_000,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
