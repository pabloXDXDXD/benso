import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_TABLES = ['productos', 'servicios', 'eventos', 'pedidos', 'citas'];

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth) throw new Error('No autorizado');

  const { payload } = await jwtVerify(auth, SECRET);
  if (payload.role !== 'admin') throw new Error('No autorizado');
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req);

    const { table, action, id, data, orderBy, ascending, page, pageSize } = await req.json();

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Tabla "${table}" no permitida` },
        { status: 400 }
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
        return NextResponse.json(
          { error: `Acción "${action}" no válida` },
          { status: 400 }
        );
    }

    return NextResponse.json({ data: result });
  } catch (err: any) {
    if (err?.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // JWT expired or invalid
    if (err?.code === 'ERR_JWT_EXPIRED' || err?.code === 'ERR_JWS_INVALID') {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    console.error('Admin query error:', err);
    return NextResponse.json(
      { error: err?.message || 'Error del servidor' },
      { status: 500 }
    );
  }
}
