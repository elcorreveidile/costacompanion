import { signInWithMagicLink } from "@/lib/auth/actions";

export default function LoginPage() {
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

        {/* Formulario de Magic Link */}
        <div className="bg-(--bone-2) rounded-lg p-8 shadow-sm border border-(--line)">
          <form action={signInWithMagicLink} className="space-y-6">
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

          <p className="mt-6 text-sm text-(--ink)/70 text-center">
            Te enviaremos un enlace de acceso a tu email. No necesitas contraseña.
          </p>
        </div>

        {/* Información de registro */}
        <div className="mt-6 text-center text-sm text-(--ink)/70">
          <p>
            Si es tu primera vez, crearemos automáticamente tu cuenta como cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
