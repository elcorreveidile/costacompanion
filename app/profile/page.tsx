import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { updateProfile, signOut } from "@/lib/auth/actions";
import { getI18n } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/config";

// Idiomas permitidos por la restricción de BD (idioma_preferido_valido).
// Etiquetas en su propio idioma → no requieren traducción.
const idiomas = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "nl", label: "Nederlands" },
  { value: "ru", label: "Русский" },
  { value: "uk", label: "Українська" },
];

export default async function ProfilePage() {
  const { locale, dict } = await getI18n();
  const t = dict.panelPerfil;

  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect(localePath(locale, "/auth/login"));

  // Obtener datos del perfil
  const [profile] = await db
    .select({
      nombre: profiles.nombre,
      rol: profiles.rol,
      telefono: profiles.telefono,
      idiomaPreferido: profiles.idiomaPreferido,
    })
    .from(profiles)
    .where(eq(profiles.id, sessionUser.id))
    .limit(1);

  const rol = profile?.rol ?? sessionUser.rol;

  const rolLabels = t.roles;

  return (
    <div className="min-h-screen bg-(--bone)">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
            {t.h1}
          </h1>
          <p className="text-lg text-(--ink)/70">
            {t.subtitulo}
          </p>
        </div>

        {/* Formulario de perfil */}
        <div className="bg-(--bone-2) rounded-lg p-8 shadow-sm border border-(--line) mb-6">
          <form action={updateProfile} className="space-y-6">
            {/* Email (solo lectura) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-(--ink) mb-2">
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                value={sessionUser.email ?? ""}
                disabled
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone)/50 text-(--ink)/50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-(--ink)/50">
                {t.emailNota}
              </p>
            </div>

            {/* Rol (solo lectura) */}
            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-(--ink) mb-2">
                {t.rol}
              </label>
              <input
                id="rol"
                type="text"
                value={rolLabels[rol as keyof typeof rolLabels] || rol || ""}
                disabled
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone)/50 text-(--ink)/50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-(--ink)/50">
                {t.rolNota}
              </p>
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-(--ink) mb-2">
                {t.nombre}
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                defaultValue={profile?.nombre || ""}
                placeholder={t.nombrePlaceholder}
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) placeholder:text-(--ink)/50 focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-(--ink) mb-2">
                {t.telefono}
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                defaultValue={profile?.telefono || ""}
                placeholder={t.telefonoPlaceholder}
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) placeholder:text-(--ink)/50 focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
              />
            </div>

            {/* Idioma preferido */}
            <div>
              <label htmlFor="idioma_preferido" className="block text-sm font-medium text-(--ink) mb-2">
                {t.idiomaPreferido}
              </label>
              <select
                id="idioma_preferido"
                name="idioma_preferido"
                defaultValue={profile?.idiomaPreferido || "es"}
                className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
              >
                {idiomas.map((idioma) => (
                  <option key={idioma.value} value={idioma.value}>
                    {idioma.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-(--ink)/50">
                {t.idiomaNota}
              </p>
            </div>

            {/* Botón de guardar */}
            <button
              type="submit"
              className="w-full bg-(--terra) hover:bg-(--terra-soft) text-(--bone) font-medium py-3 px-4 rounded-md transition-colors duration-200"
            >
              {t.guardar}
            </button>
          </form>
        </div>

        {/* Volver al dashboard */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={localePath(locale, `/${rol === "superadmin" ? "admin" : rol}`)}
            className="inline-flex items-center justify-center px-6 py-3 bg-(--bone-2) hover:bg-(--line) text-(--ink) font-medium rounded-md transition-colors duration-200 text-center"
          >
            {t.volverPanel}
          </Link>

          <form action={signOut} className="flex-1">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-(--bone-2) hover:bg-(--line) text-(--ink) font-medium rounded-md transition-colors duration-200"
            >
              {t.cerrarSesion}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
