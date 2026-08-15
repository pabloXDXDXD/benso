import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const encoder = new TextEncoder();

const ALLOWED_TABLES = ['productos', 'servicios', 'eventos', 'pedidos', 'citas', 'servicio_solicitudes', 'evento_inscripciones'];

// Tables that can only be read (no insert/update/delete via this function)
const READ_ONLY_TABLES = ['servicio_solicitudes', 'evento_inscripciones'];

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['verify'],
  );

  const sigRaw = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify(
    'HMAC', key, sigRaw, encoder.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) throw new Error('Invalid signature');

  const payload = JSON.parse(atob(parts[1]));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) throw new Error('Token expirado');

  return payload;
}

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const payload = await verifyJWT(
      authHeader.replace('Bearer ', ''),
      Deno.env.get('ADMIN_JWT_SECRET')!,
    );

    if (payload.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { table, action, id, data, orderBy, ascending, page, pageSize } = await req.json();

    if (!ALLOWED_TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Tabla "${table}" no permitida` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (READ_ONLY_TABLES.includes(table) && action !== 'select') {
      return new Response(
        JSON.stringify({ error: `Tabla "${table}" es de solo lectura` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let result;

    switch (action) {
      case 'select': {
        let query = supabase
          .from(table)
          .select('*', page !== undefined ? { count: 'exact' } : undefined);

        if (orderBy) {
          query = query.order(orderBy, { ascending: ascending ?? true });
        }

        if (page !== undefined && pageSize !== undefined) {
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);
        }

        const { data: rows, error, count } = await query;
        if (error) throw error;

        result = page !== undefined
          ? { rows, total: count ?? null }
          : rows;
        break;
      }

      case 'insert': {
        const { data: rows, error } = await supabase
          .from(table)
          .insert(data)
          .select();
        if (error) throw error;
        result = rows;
        break;
      }

      case 'update': {
        const { data: rows, error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select();
        if (error) throw error;
        result = rows;
        break;
      }

      case 'delete': {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (error) throw error;
        result = { deleted: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Acción "${action}" no válida` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }

    return new Response(
      JSON.stringify({ data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error del servidor';
    const status = msg.includes('No autorizado') || msg.includes('Invalid') || msg.includes('expirado')
      ? 401
      : 500;

    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
