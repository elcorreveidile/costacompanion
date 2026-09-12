import { redirect } from "next/navigation";
import { signInWithMagicLink, signInWithPin } from "@/lib/auth/actions";
import { getSessionUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; redirect?: string }>;
}) {
  // Si ya hay sesión (p. ej. al volver del enlace mágico), no mostramos el login:
  // reenviamos al selector de rol para que el usuario acabe en su panel.
  const sessionUser = await getSessionUser();
  if (sessionUser) redirect("/post-login");

  const { dict } = await getI18n();
  const t = dict.login;
  const errores = t.errores as Record<string, string>;

  const params = await searchParams;
  const sent = params.sent === "1";
  const errorMsg = params.error ? errores[params.error] ?? errores.generico : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
            Costa Companion
          </h1>
          <p className="text-lg text-(--ink)">
            {t.subtitle}
          </p>
        </div>

        {/* Mensaje de éxito */}
        {sent && (
          <div
            className="mb-6 rounded-lg p-4 text-sm"
            style={{ background: "rgba(44,74,59,.1)", border: "1px solid rgba(44,74,59,.25)", color: "var(--green)" }}
          >
            <p className="font-medium mb-1">{t.sentTitle}</p>
            <p>{t.sentBody}</p>
          </div>
        )}

        {/* Mensaje de error */}
        {errorMsg && (
          <div
            className="mb-6 rounded-lg p-4 text-sm"
            style={{ background: "rgba(201,123,74,.1)", border: "1px solid rgba(201,123,74,.35)", color: "#7a3d12" }}
          >
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-(--bone-2) rounded-lg p-8 shadow-sm border border-(--line)">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-(--ink)">
                {t.noLlego}
              </p>
              <a
                href="/auth/login"
                className="inline-block w-full text-center bg-(--bone) hover:bg-(--bone-2) text-(--ink) font-medium py-3 px-4 rounded-md border border-(--line) transition-colors duration-200"
              >
                {t.volver}
              </a>
            </div>
          ) : (
            <form action={signInWithMagicLink} className="space-y-6">
              {params.redirect && (
                <input type="hidden" name="redirect" value={params.redirect} />
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-(--ink) mb-2">
                  {t.emailLabel}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) placeholder:text-(--ink)/50 focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-(--terra) hover:bg-(--terra-soft) text-(--bone) font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                {t.enviar}
              </button>
            </form>
          )}

          {!sent && (
            <p className="mt-6 text-sm text-(--ink)/70 text-center">
              {t.emailHelp}
            </p>
          )}

          {/* Acceso con número de usuario + PIN (acompañantes y equipo) */}
          {!sent && (
            <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--line)" }}>
              <p className="text-sm font-medium text-(--ink) mb-4 text-center">
                {t.pinTitulo}
              </p>
              <form action={signInWithPin} className="space-y-4">
                <div>
                  <label htmlFor="numeroUsuario" className="block text-sm font-medium text-(--ink) mb-2">
                    {t.numeroLabel}
                  </label>
                  <input
                    id="numeroUsuario"
                    name="numeroUsuario"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    required
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) placeholder:text-(--ink)/50 focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="pin" className="block text-sm font-medium text-(--ink) mb-2">
                    {t.pinLabel}
                  </label>
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    required
                    placeholder="••••••"
                    className="w-full px-4 py-3 rounded-md border border-(--line) bg-(--bone) text-(--ink) placeholder:text-(--ink)/50 focus:outline-none focus:ring-2 focus:ring-(--terra) focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-(--green) hover:opacity-90 text-(--bone) font-medium py-3 px-4 rounded-md transition-opacity duration-200"
                >
                  {t.entrarPin}
                </button>
              </form>
            </div>
          )}
        </div>

        {!sent && (
          <div className="mt-6 text-center text-sm text-(--ink)/70">
            <p>
              {t.primeraVez}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
