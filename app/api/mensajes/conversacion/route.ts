import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getMensajesConversacion } from "@/lib/mensajes/actions";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const otherUserId = new URL(request.url).searchParams.get("otherUserId");
  if (!otherUserId) {
    return NextResponse.json({ error: "Falta otherUserId" }, { status: 400 });
  }

  const mensajes = await getMensajesConversacion(user.id, otherUserId);
  return NextResponse.json(mensajes);
}
