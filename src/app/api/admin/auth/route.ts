import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Contraseña inválida' },
        { status: 401 }
      );
    }

    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('4h')
      .sign(SECRET);

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 400 }
    );
  }
}
