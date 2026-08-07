import { useCallback } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { mapVariants } from '@/lib/variants';

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
  subtitle?: string;
  includes?: string[];
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
  date: string;
  status: string;
  whatsapp_link: string;
  is_active: boolean;
  image: string;
  icon: string;
  categoria?: string;
  duracion?: string;
  modalidad?: string;
  modulos?: { title: string; description: string }[];
  disclaimer?: string;
}

export interface Testimonial {
  id: number;
  quote: string;
  author: string;
  position: string;
  image: string;
  is_active: boolean;
  sort_order: number;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  is_active: boolean;
  sort_order: number;
}

const PRODUCTOS_KEY = 'productos';
const SERVICIOS_KEY = 'servicios';
const EVENTOS_KEY = 'eventos';
const TESTIMONIALS_KEY = 'testimonials';
const FAQS_KEY = 'faqs';

export { mapVariants }; // shared with server components via @/lib/variants

export function useProductos(fallbackData?: Producto[]) {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('is_active', true)
      .order('popular', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapVariants);
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    PRODUCTOS_KEY,
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
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    SERVICIOS_KEY,
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
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    EVENTOS_KEY,
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
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }, []);

  const { data, error, isLoading } = useSWR(
    TESTIMONIALS_KEY,
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
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }, []);

  const { data, error, isLoading } = useSWR(
    FAQS_KEY,
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
