import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Icono de error */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-(--terra)/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-(--terra)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Mensaje de error */}
        <h1 className="font-display text-3xl font-semibold text-(--green) mb-4">
          Acceso no autorizado
        </h1>

        <p className="text-lg text-(--ink) mb-8">
          No tienes permiso para acceder a esta página. Por favor, inicia sesión con una cuenta que tenga los permisos necesarios.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center px-6 py-3 bg-(--green) hover:bg-(--green-deep) text-(--bone) font-medium rounded-md transition-colors duration-200"
          >
            Ir a mi perfil
          </Link>

          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-(--bone-2) hover:bg-(--line) text-(--ink) font-medium rounded-md transition-colors duration-200"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
