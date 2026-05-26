import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMensajesConversacion } from '@/lib/mensajes/actions';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const otherUserId = searchParams.get('otherUserId');

  if (!otherUserId) {
    return NextResponse.json({ error: 'Falta otherUserId' }, { status: 400 });
  }

  const mensajes = await getMensajesConversacion(user.id, otherUserId);
  return NextResponse.json(mensajes);
}
