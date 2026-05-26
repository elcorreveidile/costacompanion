import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";

export default async function AdminDashboard() {
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
            Panel de Administración
          </h1>
          <p className="text-lg text-(--ink)/70">
            Bienvenido, {nombre}
          </p>
        </div>

        {/* Tarjeta de información */}
        <div className="bg-(--bone-2) rounded-lg p-8 shadow-sm border border-(--line) mb-8">
          <h2 className="font-display text-xl font-medium text-(--green) mb-4">
            Gestión de la plataforma
          </h2>
          <p className="text-(--ink) mb-6">
            Desde aquí puedes gestionar acompañantes, anunciantes, suscripciones y moderar contenido.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center px-6 py-3 bg-(--terra) hover:opacity-80 text-(--bone) font-medium rounded-md transition-opacity duration-200"
            >
              Ver mi perfil
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 bg-(--bone-2) border border-(--line) hover:opacity-70 text-(--ink) font-medium rounded-md transition-opacity duration-200"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/acompanantes"
            className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--green)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              Acompañantes
            </h3>
            <p className="text-sm text-(--ink)/60">
              Gestiona el equipo de acompañantes: alta, edición, activar/desactivar y destacados.
            </p>
          </Link>

          <div
            className="rounded-xl border p-6 shadow-sm opacity-40"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--terra)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              Anunciantes
            </h3>
            <p className="text-sm text-(--ink)/60">Próximamente: gestión de Local Partners.</p>
          </div>

          <Link
            href="/admin/resenas"
            className="group rounded-xl border p-6 shadow-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--terra)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              Reseñas
            </h3>
            <p className="text-sm text-(--ink)/60">
              Modera y aprueba las reseñas de clientes verificados.
            </p>
          </Link>

          <div
            className="rounded-xl border p-6 shadow-sm opacity-40"
            style={{ background: 'var(--bone-2)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: 'var(--green-deep)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-(--green) mb-1">
              Analíticas
            </h3>
            <p className="text-sm text-(--ink)/60">Próximamente: reservas, ingresos y métricas.</p>
          </div>
        </div>

        {/* Información de cuenta */}
        <div className="bg-(--bone-2) rounded-lg p-6 shadow-sm border border-(--line)">
          <h3 className="font-medium text-(--green) mb-2">Información de tu cuenta</h3>
          <div className="text-sm text-(--ink)/70 space-y-1">
            <p>Email: {user.email}</p>
            <p>Rol: Superadmin</p>
            {profile?.nombre && <p>Nombre: {profile.nombre}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
