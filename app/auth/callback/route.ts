import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error intercambiando código:", error);
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_token`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_user`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single() as { data: { rol: string } | null; error: null };

  if (!profile) {
    console.error("No se encontró perfil para usuario:", user.id);
    return NextResponse.redirect(`${origin}/auth/login?error=no_profile`);
  }

  // Si venía un redirect explícito (p.ej. desde /[slug]/reservar), usarlo
  const next = searchParams.get("next");
  if (next && next.startsWith("/")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const destinos: Record<string, string> = {
    cliente: "/cliente",
    acompanante: "/acompanante",
    anunciante: "/anunciante",
    superadmin: "/admin",
  };

  const destino = destinos[profile.rol] ?? "/auth/login?error=invalid_role";
  return NextResponse.redirect(`${origin}${destino}`);
}
