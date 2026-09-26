import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiposGestion, zonas as tZonas } from "@/lib/db/schema";
import {
  asignarReserva,
  descartarPeticion,
  listarColaAsignacion,
} from "@/lib/reservas/asignaciones";
import type { listarCandidatos } from "@/lib/reservas/asignaciones";
import { modalidadCompatible } from "@/lib/precios";
import { fechaHoraMadrid } from "@/lib/tiempo";
import { languageName, type Locale } from "@/lib/i18n/config";
import { pickLang } from "@/lib/i18n/pick";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";

type Candidato = Awaited<ReturnType<typeof listarCandidatos>>[number];

/**
 * Cola de peticiones sin acompañante (Fase C1): una tarjeta por petición con
 * el form de asignación (solo candidatos compatibles con el modo pedido) y el
 * botón de descartar. Asignar fija el precio exacto en servidor y notifica.
 */
export default async function ColaAsignacion({
  candidatos,
  dict,
  locale,
}: {
  candidatos: Candidato[];
  dict: Dictionary;
  locale: Locale;
}) {
  const cola = await listarColaAsignacion();
  if (cola.length === 0) return null;

  const t = dict.panelAdmin.reservas;
  const c = t.colaAsignacion;

  const [zonasRows, tiposRows] = await Promise.all([
    db.select({ key: tZonas.key, nombre: tZonas.nombre }).from(tZonas),
    db
      .select({ key: tiposGestion.key, nombre: tiposGestion.nombre })
      .from(tiposGestion)
      .where(eq(tiposGestion.activo, true)),
  ]);
  const nombreDe = (
    rows: { key: string; nombre: unknown }[],
    key: string | null
  ): string | null => {
    if (!key) return null;
    const row = rows.find((r) => r.key === key);
    return row
      ? pickLang(row.nombre as Record<string, unknown> | null, locale) || key
      : key;
  };

  return (
    <div
      className="rounded-xl border p-6 mb-8"
      style={{ background: "var(--terra-soft)", borderColor: "transparent" }}
    >
      <h2 className="font-display text-lg font-medium text-(--terra) mb-1">
        {c.titulo}
      </h2>
      <p className="text-sm text-(--ink)/60 mb-4">{c.desc}</p>

      <div className="space-y-3">
        {cola.map((p) => {
          const compatibles = candidatos.filter(
            (cd) => !!p.modoGestion && modalidadCompatible(cd.modalidades, p.modoGestion)
          );
          // Destacados primero (criterio suave; el admin decide).
          const ordenados = [...compatibles].sort(
            (a, b) => Number(b.destacado) - Number(a.destacado)
          );

          const meta = [
            p.modoGestion ? t.modos[p.modoGestion] : null,
            nombreDe(tiposRows, p.tipoGestionKey),
            p.idiomaGestion ? languageName(p.idiomaGestion, locale) : null,
            nombreDe(zonasRows, p.zona),
            p.modoGestion === "horas" && p.horas ? `${c.horas}: ${p.horas} h` : null,
            p.metodoPago === "efectivo"
              ? dict.panelCliente.detalle.metodos.efectivo
              : dict.panelCliente.detalle.metodos.tarjeta,
            fechaHoraMadrid(p.fechaHora),
          ].filter(Boolean) as string[];

          return (
            <div key={p.id} className="rounded-lg bg-(--bone-2) px-4 py-4 text-sm">
              <p className="font-medium text-(--ink)">
                {p.clienteNombre ?? p.clienteEmail}
                {p.clienteEmail && (
                  <span className="text-(--ink)/50 font-normal"> · {p.clienteEmail}</span>
                )}
              </p>
              <p className="text-(--ink)/60 mt-0.5">{meta.join(" · ")}</p>
              {p.detalleServicio && (
                <p className="text-(--ink)/50 mt-1.5 line-clamp-2">{p.detalleServicio}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {compatibles.length > 0 ? (
                  <form action={asignarReserva} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="reserva_id" value={p.id} />
                    <select
                      name="acompanante_id"
                      required
                      defaultValue=""
                      className="px-3 py-2 rounded-lg border text-sm bg-(--bone)"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    >
                      <option value="" disabled>
                        {c.elegirCandidato}
                      </option>
                      {ordenados.map((cd) => {
                        const val =
                          cd.valoracionMedia != null
                            ? `★${Number(cd.valoracionMedia).toFixed(1)} (${cd.numResenas})`
                            : null;
                        const label = [
                          cd.destacado ? "★" : "",
                          cd.nombrePublico,
                          nombreDe(zonasRows, cd.zonaBase) ?? "—",
                          cd.idiomas.join("/"),
                          cd.modalidades.join("/"),
                          val,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <option key={cd.id} value={cd.id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="submit"
                      className="text-xs font-medium px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                      style={{ background: "var(--green)", color: "var(--bone)" }}
                    >
                      {c.asignar}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-(--terra)">{c.sinCandidatos}</p>
                )}
                <form action={descartarPeticion}>
                  <input type="hidden" name="reserva_id" value={p.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium px-3 py-2 rounded-lg border transition-opacity hover:opacity-70"
                    style={{
                      borderColor: "var(--line)",
                      color: "rgba(43,39,36,0.6)",
                      background: "transparent",
                    }}
                  >
                    {c.descartar}
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
