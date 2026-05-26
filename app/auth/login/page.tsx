import { signInWithMagicLink } from "@/lib/auth/actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Por favor, introduce un email válido.",
  send_failed: "No se pudo enviar el enlace. Inténtalo de nuevo.",
  invalid_token: "El enlace ha expirado o no es válido. Solicita uno nuevo.",
  no_user: "No se pudo verificar tu identidad. Inténtalo de nuevo.",
  no_profile: "No se encontró tu perfil. Contacta con soporte.",
  invalid_role: "Rol de usuario no reconocido. Contacta con soporte.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const errorMsg = params.error ? ERROR_MESSAGES[params.error] ?? "Ha ocurrido un error. Inténtalo de nuevo." : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-(--green) mb-2">
            Costa Companion
          </h1>
          <p className="text-lg text-(--ink)">
            Accede sin contraseña
          </p>
        </div>

        {/* Mensaje de éxito */}
        {sent && (
          <div
            className="mb-6 rounded-lg p-4 text-sm"
            style={{ background: "rgba(44,74,59,.1)", border: "1px solid rgba(44,74,59,.25)", color: "var(--green)" }}
          >
            <p className="font-medium mb-1">¡Enlace enviado!</p>
            <p>Revisa tu bandeja de entrada y haz clic en el enlace para acceder. Puede tardar unos segundos.</p>
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
                ¿No ha llegado el email?
              </p>
              <a
                href="/auth/login"
                className="inline-block w-full text-center bg-(--bone) hover:bg-(--bone-2) text-(--ink) font-medium py-3 px-4 rounded-md border border-(--line) transition-colors duration-200"
              >
                Volver a intentarlo
              </a>
            </div>
          ) : (
            <form action={signInWithMagicLink} className="space-y-6">
              {params.redirect && (
                <input type="hidden" name="redirect" value={params.redirect} />
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-(--ink) mb-2">
                  Email
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
                Enviar enlace mágico
              </button>
            </form>
          )}

          {!sent && (
            <p className="mt-6 text-sm text-(--ink)/70 text-center">
              Te enviaremos un enlace de acceso a tu email. No necesitas contraseña.
            </p>
          )}
        </div>

        {!sent && (
          <div className="mt-6 text-center text-sm text-(--ink)/70">
            <p>
              Si es tu primera vez, crearemos automáticamente tu cuenta como cliente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
