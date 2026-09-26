import { borrarDocumento, subirDocumento } from "@/lib/documentos/actions";

export interface DocumentoItem {
  id: string;
  nombre: string;
  bytes: number;
  createdAt: string; // ISO
}

export interface DocumentosLabels {
  titulo: string;
  intro: string;
  vacio: string;
  sinAsignar: string;
  subir: string;
  descargar: string;
  borrar: string;
  errores: Record<string, string>;
}

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Documentos de citación de una reserva (server component).
 * Subida/borrado por form actions; descarga vía /api/documentos/[id],
 * que comprueba sesión + ownership y redirige a una URL firmada de 5 min.
 */
export default function DocumentosReserva({
  reservaId,
  docs,
  t,
  locale,
  errorKey,
  bloqueado = false,
}: {
  reservaId: string;
  docs: DocumentoItem[];
  t: DocumentosLabels;
  locale: string;
  errorKey?: string;
  /** true = petición en cola (Fase C1): sin acompañante no hay citación a quién entregar. */
  bloqueado?: boolean;
}) {
  return (
    <div
      className="rounded-xl border shadow-sm p-6 mb-6"
      style={{ background: "var(--bone-2)", borderColor: "var(--line)" }}
    >
      <h2 className="font-display text-lg font-medium text-(--green) mb-4">
        {t.titulo}
      </h2>

      {errorKey && (
        <p
          className="text-sm rounded-lg px-4 py-3 mb-4"
          style={{ background: "rgba(201,123,74,0.1)", color: "#7a3d12" }}
        >
          {t.errores[errorKey] ?? t.errores.generico}
        </p>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-(--ink)/40">{t.vacio}</p>
      ) : (
        <ul>
          {docs.map((d) => (
            <li
              key={d.id}
              className="py-3 flex items-center justify-between gap-3 border-b last:border-b-0"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="min-w-0">
                <p className="text-sm text-(--ink) truncate">{d.nombre}</p>
                <p className="text-xs text-(--ink)/40">
                  {formatBytes(d.bytes)} ·{" "}
                  {new Date(d.createdAt).toLocaleDateString(locale)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/api/documentos/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  {t.descargar}
                </a>
                <form action={borrarDocumento}>
                  <input type="hidden" name="documento_id" value={d.id} />
                  <input type="hidden" name="reserva_id" value={reservaId} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70"
                    style={{
                      borderColor: "var(--line)",
                      color: "rgba(43,39,36,0.6)",
                    }}
                  >
                    {t.borrar}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {bloqueado ? (
        <p
          className="text-sm text-(--ink)/50 mt-4 pt-4 border-t"
          style={{ borderColor: "var(--line)" }}
        >
          {t.sinAsignar}
        </p>
      ) : (
      <form
        action={subirDocumento}
        className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3"
        style={{ borderColor: "var(--line)" }}
      >
        <input type="hidden" name="reserva_id" value={reservaId} />
        <input type="hidden" name="locale" value={locale} />
        <input
          type="file"
          name="file"
          required
          accept=".pdf,image/jpeg,image/png,image/webp"
          className="text-sm text-(--ink) max-w-full"
        />
        <button
          type="submit"
          className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "var(--green)", color: "var(--bone)" }}
        >
          {t.subir}
        </button>
        <p className="text-xs text-(--ink)/40 w-full">{t.intro}</p>
      </form>
      )}
    </div>
  );
}
