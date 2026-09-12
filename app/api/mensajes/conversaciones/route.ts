import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getConversaciones } from "@/lib/mensajes/actions";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const conversaciones = await getConversaciones(user.id);
  return NextResponse.json(conversaciones);
}
