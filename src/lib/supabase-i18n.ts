// Helper to select locale-appropriate columns from Supabase
// and to map raw data to locale-appropriate values with Spanish fallback.

/**
 * Returns the select fragment for a locale-aware column.
 * When locale is 'en', it selects both `{col}_en` and `{col}`
 * so the raw data can be mapped with `localizeItem` / `localizeItems`.
 * When locale is 'es', it just returns the original column.
 *
 * @example
 * supabase.from('productos').select(`id, ${localeColumn('title', locale)}`)
 */
export function localeColumn(col: string, locale: string): string {
  if (locale === 'en') {
    return `${col}_en, ${col}`;
  }
  return col;
}

/**
 * Maps a single raw item to use locale-appropriate values.
 * For 'en' locale, uses `title_en` / `description_en` with
 * Spanish fallback when the English column is NULL.
 * For 'es' locale, returns the item unchanged.
 */
export function localizeItem<T extends Record<string, any>>(item: T, locale: string): T {
  if (locale !== 'en') return item;
  return {
    ...item,
    title: item.title_en ?? item.title,
    description: item.description_en ?? item.description,
    subtitle: item.subtitle_en ?? item.subtitle,
    includes: item.includes_en ?? item.includes,
    quote: item.quote_en ?? item.quote,
    position: item.position_en ?? item.position,
  };
}

/**
 * Maps an array of raw items to use locale-appropriate values.
 */
export function localizeItems<T extends Record<string, any>>(items: T[], locale: string): T[] {
  return items.map((item) => localizeItem(item, locale));
}
