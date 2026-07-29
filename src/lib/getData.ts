import 'server-only';

type Locale = 'es' | 'en';

export async function getData<T>(locale: Locale, name: string): Promise<T> {
  const data = await import(`@/data/${locale}/${name}.json`);
  return data.default as T;
}