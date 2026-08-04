import type { Variant } from '@/hooks/useData';

/**
 * Maps raw Supabase variant rows (snake_case) to the camelCase shape used by
 * the UI. Safe to import from both server and client code (no SWR dependency).
 */
export function mapVariants<T extends { variants?: any }>(product: T): T {
  if (product.variants && Array.isArray(product.variants)) {
    product.variants = (product.variants as any[]).map((v: any) => ({
      label: v.label,
      unitPrice: v.unit_price ?? v.unitPrice,
      totalPrice: v.total_price ?? v.totalPrice,
      description: v.description,
    })) as Variant[];
  }
  return product;
}
