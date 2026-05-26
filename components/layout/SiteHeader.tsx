import { LogoSymbol } from "@/components/icons/LogoSymbol";
import Link from "next/link";

async function getSession() {
  // Guarda contra variables de entorno no configuradas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="w-full bg-(--green) py-4 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoSymbol
            strokeColor="#F7F4EF"
            dotColor="#E0A877"
            className="h-9 w-9 shrink-0"
          />
          <Link
            href="/"
            className="font-display text-xl font-medium tracking-tight"
            style={{ color: "var(--bone)" }}
          >
            Costa Companion
          </Link>
        </div>

        {session ? (
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-sm text-(--bone) hover:text-(--bone-2) transition-colors"
            >
              Mi perfil
            </Link>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm text-(--bone) hover:text-(--bone-2) transition-colors"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  );
}
