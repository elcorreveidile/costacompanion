import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";

export default async function ClienteDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Obtener datos del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .single() as { data: { nombre: string | null; rol: string } | null; error: null };

  const nombre = profile?.nombre || user.email;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
            Bienvenido, {nombre}
          </h1>
          <p className="text-lg text-(--ink)/70">
            Tu área de cliente
          </p>
        </div>

        {/* Cards de navegación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/cliente/reservas"
            className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--green)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              Mis reservas
            </h3>
            <p className="text-sm text-(--ink)/60">
              Consulta y gestiona tus citas con acompañantes.
            </p>
          </Link>

          <Link
            href="/cliente/solicitudes"
            className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--terra)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              Mis solicitudes
            </h3>
            <p className="text-sm text-(--ink)/60">
              Revisa las solicitudes a medida y las respuestas de los acompañantes.
            </p>
          </Link>
        </div>

        {/* Información de cuenta */}
        <div className="bg-(--bone-2) rounded-lg p-6 shadow-sm border border-(--line) mb-4">
          <h3 className="font-medium text-(--green) mb-2">Información de tu cuenta</h3>
          <div className="text-sm text-(--ink)/70 space-y-1">
            <p>Email: {user.email}</p>
            <p>Rol: Cliente</p>
            {profile?.nombre && <p>Nombre: {profile.nombre}</p>}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--terra)', color: 'var(--bone)' }}
          >
            Ver mi perfil
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border font-medium text-sm transition-opacity hover:opacity-70"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'transparent' }}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
