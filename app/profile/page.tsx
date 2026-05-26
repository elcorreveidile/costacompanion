import { createClient } from "@/lib/supabase/server";
import { updateProfile, signOut } from "@/lib/auth/actions";
import Link from "next/link";

const idiomas = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "nl", label: "Nederlands" },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Obtener datos del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as { data: { nombre: string | null; rol: string; telefono: string | null; idioma_preferido: string | null } | null; error: null };

  const rolLabels = {
    cliente: "Cliente",
    acompanante: "Acompañante",
    anunciante: "Anunciante (Local Partner)",
    superadmin: "Superadmin",
  };

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
            Mi perfil
          </h1>
          <p className="text-lg text-(--ink)/70">
            Gestiona tu información personal
          </p>
        </div>

        {/* Formulario de perfil */}
        <div className="bg-(--bone-2) rounded-lg p-8 shadow-sm border border-(--line) mb-6">
          <form action={updateProfile} className="space-y-6">
            {/* Email (solo lectura) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-(--ink) mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone)/50 text-(--ink)/50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-(--ink)/50">
                El email no se puede cambiar
              </p>
            </div>

            {/* Rol (solo lectura) */}
            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-(--ink) mb-2">
                Rol
              </label>
              <input
                id="rol"
                type="text"
                value={rolLabels[profile?.rol as keyof typeof rolLabels] || profile?.rol}
                disabled
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone)/50 text-(--ink)/50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-(--ink)/50">
                El rol está asignado por el administrador
              </p>
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-(--ink) mb-2">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                defaultValue={profile?.nombre || ""}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) placeholder:text-(--ink)/50 focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-(--ink) mb-2">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                defaultValue={profile?.telefono || ""}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) placeholder:text-(--ink)/50 focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
              />
            </div>

            {/* Idioma preferido */}
            <div>
              <label htmlFor="idioma_preferido" className="block text-sm font-medium text-(--ink) mb-2">
                Idioma preferido
              </label>
              <select
                id="idioma_preferido"
                name="idioma_preferido"
                defaultValue={profile?.idioma_preferido || "es"}
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
              >
                {idiomas.map((idioma) => (
                  <option key={idioma.value} value={idioma.value}>
                    {idioma.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-(--ink)/50">
                Se usará para los emails y la interfaz
              </p>
            </div>

            {/* Botón de guardar */}
            <button
              type="submit"
              className="w-full bg-(--terra) hover:bg-(--terra-soft) text-(--bone) font-medium py-3 px-4 rounded-md transition-colors duration-200"
            >
              Guardar cambios
            </button>
          </form>
        </div>

        {/* Volver al dashboard */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/${profile?.rol === "superadmin" ? "admin" : profile?.rol}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-(--bone-2) hover:bg-(--line) text-(--ink) font-medium rounded-md transition-colors duration-200 text-center"
          >
            Volver a mi panel
          </Link>

          <form action={signOut} className="flex-1">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-(--bone-2) hover:bg-(--line) text-(--ink) font-medium rounded-md transition-colors duration-200"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
