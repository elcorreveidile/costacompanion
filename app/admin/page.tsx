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
        <div className="bg-(--bone-2) rounded-lg p-8 shadow-sm border border-(--line) mb-6">
          <h2 className="font-display text-xl font-medium text-(--green) mb-4">
            Gestión de la plataforma
          </h2>
          <p className="text-(--ink) mb-6">
            Próximamente podrás gestionar acompañantes, anunciantes, suscripciones y moderar contenido desde aquí.
          </p>

          {/* Acciones disponibles */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center px-6 py-3 bg-(--terra) hover:bg-(--terra-soft) text-(--bone) font-medium rounded-md transition-colors duration-200"
            >
              Ver mi perfil
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 bg-(--bone-2) hover:bg-(--line) text-(--ink) font-medium rounded-md transition-colors duration-200"
              >
                Cerrar sesión
              </button>
            </form>
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
