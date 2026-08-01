import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { localizeItems } from '@/lib/supabase-i18n';

export interface Variant {
  label: string;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface Producto {
  id: number;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  price: string;
  price_num: number;
  category: string;
  icon: string;
  image: string;
  popular: boolean;
  whatsapp_link: string;
  is_active: boolean;
  variants: Variant[];
}

export interface Servicio {
  id: number;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  subtitle?: string;
  subtitle_en?: string;
  includes?: string[];
  includes_en?: string[];
  price: string;
  price_num: number;
  category: string;
  icon: string;
  image: string;
  popular: boolean;
  whatsapp_link: string;
  is_active: boolean;
}

export interface Evento {
  id: number;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  date: string;
  status: string;
  whatsapp_link: string;
  is_active: boolean;
  image: string;
  icon: string;
}

export interface Testimonial {
  id: number;
  quote: string;
  quote_en: string;
  author: string;
  position: string;
  position_en: string;
  image: string;
  is_active: boolean;
  sort_order: number;
}

export interface Faq {
  id: number;
  question: string;
  question_en: string;
  answer: string;
  answer_en: string;
  is_active: boolean;
  sort_order: number;
}

const PRODUCTOS_KEY = 'productos';
const SERVICIOS_KEY = 'servicios';
const EVENTOS_KEY = 'eventos';
const TESTIMONIALS_KEY = 'testimonials';
const FAQS_KEY = 'faqs';

function mapVariants(product: any): Producto {
  if (product.variants && Array.isArray(product.variants)) {
    product.variants = product.variants.map((v: any) => ({
      label: v.label,
      unitPrice: v.unit_price ?? v.unitPrice,
      totalPrice: v.total_price ?? v.totalPrice,
      description: v.description,
    }));
  }
  return product as Producto;
}

export function useProductos(fallbackData?: Producto[]) {
  const locale = useLocale();

  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('is_active', true)
      .order('popular', { ascending: false });

    if (error) throw error;
    return localizeItems((data || []).map(mapVariants), locale);
  }, [locale]);

  const { data, error, isLoading, mutate } = useSWR(
    [PRODUCTOS_KEY, locale],
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: !fallbackData || fallbackData.length === 0,
      revalidateOnReconnect: true,
      dedupingInterval: 30_000,
      fallbackData,
    },
  );

  return {
    productos: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    retry: () => mutate(),
  };
}

export function useServicios(fallbackData?: Servicio[]) {
  const locale = useLocale();

  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return localizeItems(data || [], locale) as Servicio[];
  }, [locale]);

  const { data, error, isLoading, mutate } = useSWR(
    [SERVICIOS_KEY, locale],
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: !fallbackData || fallbackData.length === 0,
      revalidateOnReconnect: true,
      dedupingInterval: 30_000,
      fallbackData,
    },
  );

  return {
    servicios: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    retry: () => mutate(),
  };
}

export function useEventos(fallbackData?: Evento[]) {
  const locale = useLocale();

  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return localizeItems(data || [], locale) as Evento[];
  }, [locale]);

  const { data, error, isLoading, mutate } = useSWR(
    [EVENTOS_KEY, locale],
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: !fallbackData || fallbackData.length === 0,
      revalidateOnReconnect: true,
      dedupingInterval: 30_000,
      fallbackData,
    },
  );

  return {
    eventos: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    retry: () => mutate(),
  };
}

export function useTestimonials(fallbackData?: Testimonial[]) {
  const locale = useLocale();

  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return localizeItems(data || [], locale) as Testimonial[];
  }, [locale]);

  const { data, error, isLoading } = useSWR(
    [TESTIMONIALS_KEY, locale],
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: !fallbackData || fallbackData.length === 0,
      revalidateOnReconnect: true,
      dedupingInterval: 30_000,
      fallbackData,
    },
  );

  return { testimonials: data ?? [], loading: isLoading, error: error?.message ?? null };
}

export function useFaqs(fallbackData?: Faq[]) {
  const locale = useLocale();

  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      question: locale === 'en' ? (item.question_en || item.question) : item.question,
      answer: locale === 'en' ? (item.answer_en || item.answer) : item.answer,
    })) as Faq[];
  }, [locale]);

  const { data, error, isLoading } = useSWR(
    [FAQS_KEY, locale],
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: !fallbackData || fallbackData.length === 0,
      revalidateOnReconnect: true,
      dedupingInterval: 30_000,
      fallbackData,
    },
  );

  return { faqs: data ?? [], loading: isLoading, error: error?.message ?? null };
}
