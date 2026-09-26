"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  acompanantes,
  profiles,
  reservas,
  tiposGestion,
  zonas as tZonas,
} from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { pickLang } from "@/lib/i18n/pick";
import { fechaHoraMadrid } from "@/lib/tiempo";
import { enviarPushAPerfil } from "@/lib/push/send";
import { pushStrings } from "@/lib/push/strings";
import {
  cargarContextoPrecios,
  calcularPrecio,
  getZonaBaseAcompanante,
  modalidadCompatible,
  PrecioError,
  type DesglosePrecio,
  type ModoGestion,
} from "@/lib/precios";
import {
  emailNuevaReserva,
  emailPeticionRecibida,
  emailReservaAdmin,
} from "@/lib/email";

/**
 * Reserva de GESTIONES con la tarjeta de precios de la plataforma.
 *
 * El cliente NUNCA envía importes: la entrada es estructura
 * (modo / zona / fecha / horas) y el importe se calcula solo en el servidor,
 * dos veces (preview en el form + recálculo íntegro al crear).
 */

const MODOS_VALIDOS: readonly ModoGestion[] = [
  "remota",
  "horas",
  "media_jornada",
  "jornada",
];

const DETALLE_MAX = 2000;

function esModoGestion(v: unknown): v is ModoGestion {
  return typeof v === "string" && (MODOS_VALIDOS as readonly string[]).includes(v);
}

function modalidadDeReserva(modo: ModoGestion): "presencial" | "remoto" {
  return modo === "remota" ? "remoto" : "presencial";
}

async function getAcompananteReserva(acompananteId: string) {
  const [row] = await db
    .select({
      id: acompanantes.id,
      slug: acompanantes.slug,
      nombrePublico: acompanantes.nombrePublico,
      emailContacto: acompanantes.emailContacto,
      modalidades: acompanantes.modalidades,
      activo: acompanantes.activo,
      aceptaGestiones: acompanantes.aceptaGestiones,
      profileId: acompanantes.profileId,
      idioma: profiles.idiomaPreferido,
    })
    .from(acompanantes)
    .leftJoin(profiles, eq(profiles.id, acompanantes.profileId))
    .where(eq(acompanantes.id, acompananteId))
    .limit(1);
  return row ?? null;
}

// ── Preview de precio (debounce del formulario) ──────────────────────────────

export type CodigoErrorPreview =
  | "acompanante_invalido"
  | "fecha_invalida"
  | "modo_invalido"
  | "zona_fuera_provincia"
  | "horas_invalidas"
  | "tarifa_no_configurada";

export type ResultadoPreview =
  | {
      ok: true;
      desglose: DesglosePrecio;
      zonaBase: string | null;
      /** true = estimado de cola sin acompañante (sin recargo de zona). */
      aproximado: boolean;
    }
  | { ok: false; codigo: CodigoErrorPreview };

export interface EntradaPreview {
  /** null = petición en cola (Fase C1): estimado sin acompañante. */
  acompananteId: string | null;
  modo: ModoGestion;
  horas?: number;
  zonaKey: string | null;
  fechaHoraISO: string;
}

export async function previewPrecioGestion(
  entrada: EntradaPreview
): Promise<ResultadoPreview> {
  if (!esModoGestion(entrada.modo)) return { ok: false, codigo: "modo_invalido" };

  const fechaHora = new Date(entrada.fechaHoraISO);
  if (Number.isNaN(fechaHora.getTime()) || fechaHora.getTime() <= Date.now()) {
    return { ok: false, codigo: "fecha_invalida" };
  }

  // ── Cola (Fase C1): estimado base + urgencia, sin recargo de zona ──
  if (!entrada.acompananteId) {
    try {
      const ctx = await cargarContextoPrecios();
      // Zona presencial: debe existir en el catálogo activo; el recargo exacto
      // depende del acompañante que se asigne y se fija al asignar.
      if (entrada.modo !== "remota") {
        if (!entrada.zonaKey || ctx.zonas[entrada.zonaKey] === undefined) {
          return { ok: false, codigo: "zona_fuera_provincia" };
        }
      }
      // zonaBaseAcompanante = zonaKey ⇒ recargo 0: importe orientativo.
      const desglose = calcularPrecio(
        {
          modo: entrada.modo,
          horas: entrada.horas,
          zonaKey: entrada.modo === "remota" ? null : entrada.zonaKey,
          zonaBaseAcompanante:
            entrada.modo === "remota" ? null : entrada.zonaKey,
          fechaHora,
          ahora: new Date(),
        },
        ctx
      );
      return { ok: true, desglose, zonaBase: null, aproximado: true };
    } catch (e) {
      if (e instanceof PrecioError) return { ok: false, codigo: e.codigo };
      console.error("previewPrecioGestion (cola):", e);
      return { ok: false, codigo: "tarifa_no_configurada" };
    }
  }

  const acomp = await getAcompananteReserva(entrada.acompananteId);
  if (!acomp || !acomp.activo || !acomp.aceptaGestiones) {
    return { ok: false, codigo: "acompanante_invalido" };
  }
  if (!modalidadCompatible(acomp.modalidades, entrada.modo)) {
    return { ok: false, codigo: "modo_invalido" };
  }

  try {
    const [ctx, zonaBase] = await Promise.all([
      cargarContextoPrecios(),
      getZonaBaseAcompanante(entrada.acompananteId),
    ]);
    const desglose = calcularPrecio(
      {
        modo: entrada.modo,
        horas: entrada.horas,
        zonaKey: entrada.zonaKey,
        zonaBaseAcompanante: zonaBase,
        fechaHora,
        ahora: new Date(),
      },
      ctx
    );
    return { ok: true, desglose, zonaBase, aproximado: false };
  } catch (e) {
    if (e instanceof PrecioError) return { ok: false, codigo: e.codigo };
    console.error("previewPrecioGestion:", e);
    return { ok: false, codigo: "tarifa_no_configurada" };
  }
}

// ── Creación de la reserva ───────────────────────────────────────────────────

/**
 * Recálculo íntegro para el flujo directo (con acompañante). Si el precio no
 * se puede calcular, redirige de vuelta al formulario.
 */
async function recalcularPrecioDirecta(opts: {
  acompananteId: string;
  modo: ModoGestion;
  horas?: number;
  zonaKey: string | null;
  fechaHora: Date;
  volver: string;
}): Promise<DesglosePrecio> {
  try {
    const [ctx, zonaBase] = await Promise.all([
      cargarContextoPrecios(),
      getZonaBaseAcompanante(opts.acompananteId),
    ]);
    return calcularPrecio(
      {
        modo: opts.modo,
        horas: opts.horas,
        zonaKey: opts.zonaKey,
        zonaBaseAcompanante: zonaBase,
        fechaHora: opts.fechaHora,
        ahora: new Date(),
      },
      ctx
    );
  } catch (e) {
    if (e instanceof PrecioError) redirect(opts.volver);
    console.error("crearReservaGestion (precio):", e);
    redirect(opts.volver);
  }
}

export async function crearReservaGestion(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  // Fase C1: sin acompañante en el form ⇒ petición en cola (gratis hasta asignar)
  const acompananteId =
    ((formData.get("acompanante_id") as string | null) || "").trim() || null;
  const esCola = acompananteId === null;

  const modo = formData.get("modo");
  const modoGestion = esModoGestion(modo) ? modo : null;
  if (!modoGestion) redirect(`/cliente/reservas`);

  const fechaHora = new Date(formData.get("fecha_hora") as string);
  if (Number.isNaN(fechaHora.getTime()) || fechaHora.getTime() <= Date.now()) {
    redirect("/cliente/reservas");
  }

  // Validaciones de acompañante: solo en el flujo directo /[slug]/reservar
  let slug = "";
  let acompNombre = "";
  let acompEmail: string | null = null;
  let acompIdioma: string | null = null;
  let acompProfileId: string | null = null;
  if (!esCola) {
    const a = await getAcompananteReserva(acompananteId);
    const volverA = `/${a?.slug ?? ""}/reservar`;
    if (!a || !a.activo || !a.aceptaGestiones) redirect(volverA);
    if (!modalidadCompatible(a.modalidades, modoGestion)) redirect(volverA);
    slug = a.slug;
    acompNombre = a.nombrePublico;
    acompEmail = a.emailContacto;
    acompProfileId = a.profileId;
    acompIdioma = a.idioma;
  }
  const volver = esCola ? "/reservar" : `/${slug}/reservar`;

  // Estructura opcional
  const horasRaw = formData.get("horas");
  const horas = horasRaw ? Number(horasRaw) : undefined;
  const zonaKey = ((formData.get("zona_key") as string | null) || "") || null;
  const detalleServicio =
    ((formData.get("detalle_servicio") as string | null) || "").trim().slice(0, DETALLE_MAX) ||
    null;

  // tipo_gestion_key: validar contra el catálogo activo
  let tipoGestionKey: string | null =
    ((formData.get("tipo_gestion_key") as string | null) || "") || null;
  if (tipoGestionKey) {
    const [tg] = await db
      .select({ key: tiposGestion.key })
      .from(tiposGestion)
      .where(
        and(eq(tiposGestion.key, tipoGestionKey), eq(tiposGestion.activo, true))
      )
      .limit(1);
    if (!tg) tipoGestionKey = null;
  }

  // idioma_gestion: uno de los 7 idiomas de la plataforma
  const idiomaRaw = (formData.get("idioma_gestion") as string | null) || "";
  const idiomaGestion: string | null = (locales as readonly string[]).includes(idiomaRaw)
    ? (idiomaRaw as Locale)
    : null;

  // Método de pago: remota ⇒ siempre tarjeta; efectivo solo presencial ∧ no bloqueado
  const [profile] = await db
    .select({
      efectivoBloqueado: profiles.efectivoBloqueado,
      idioma: profiles.idiomaPreferido,
      nombre: profiles.nombre,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  const efectivoPosible =
    modoGestion !== "remota" && !(profile?.efectivoBloqueado ?? false);
  const metodoPago =
    formData.get("metodo_pago") === "efectivo" && efectivoPosible
      ? "efectivo"
      : "tarjeta";

  // ── Recálculo íntegro en el servidor (snapshot inmutable) ──
  // Cola: NO se calcula precio (null hasta asignar); solo se valida la zona
  // presencial contra el catálogo activo.
  let desglose: DesglosePrecio | null = null;
  if (esCola) {
    const ctx = await cargarContextoPrecios();
    if (modoGestion !== "remota") {
      if (!zonaKey || ctx.zonas[zonaKey] === undefined) redirect(volver);
    }
    if (
      modoGestion === "horas" &&
      (!horas || !Number.isInteger(horas) || horas < 1)
    ) {
      redirect(volver);
    }
  } else {
    desglose = await recalcularPrecioDirecta({
      acompananteId,
      modo: modoGestion,
      horas: modoGestion === "horas" ? horas : undefined,
      zonaKey: modoGestion === "remota" ? null : zonaKey,
      fechaHora,
      volver,
    });
  }

  const estadoPago = metodoPago === "tarjeta" ? "pendiente_pago" : "pendiente_cobro";

  // INSERT antes de cobrar (Neon HTTP sin transacciones). El pago (Etapa 2)
  // parte de esta fila; `estadoPago='pendiente_pago'` en el WHERE condicional
  // hace idempotente todo el ciclo posterior. En cola: precio null y sin
  // acompañante — se fijan en la asignación manual.
  const [reserva] = await db
    .insert(reservas)
    .values({
      acompananteId: esCola ? null : acompananteId,
      clienteId: user.id,
      disponibilidadId: null,
      fechaHora,
      modalidad: modalidadDeReserva(modoGestion),
      zona: modoGestion === "remota" ? null : zonaKey,
      detalleServicio,
      estado: "pendiente",
      tipoReserva: "gestion",
      modoGestion,
      horas: modoGestion === "horas" && horas ? horas : null,
      tipoGestionKey,
      idiomaGestion,
      metodoPago,
      estadoPago,
      precioTotalCents: esCola ? null : desglose!.totalCents, // ! : rama directa siempre asigna o redirige
      precioDesglose: esCola ? null : desglose,
      moneda: "eur",
    })
    .returning({ id: reservas.id });

  const clienteNombre = profile?.nombre ?? user.email ?? "Un cliente";

  // Aviso interno al equipo (no-op sin ADMIN_EMAIL). Ambas ramas.
  emailReservaAdmin({
    modoGestion,
    tipoGestionKey,
    fechaStr: fechaHoraMadrid(fechaHora),
    zona: modoGestion === "remota" ? null : zonaKey,
    metodoPago,
    enCola: esCola,
    acompananteNombre: esCola ? undefined : acompNombre,
    clienteNombre,
  });

  if (esCola) {
    // Cola: confirmación al cliente (gratis hasta asignar). Sin email al
    // acompañante: aún no existe.
    emailPeticionRecibida({
      toEmail: user.email ?? "",
      clienteNombre,
      idioma: profile?.idioma ?? undefined,
    });

    // Push de cola (C1.5) a los acompañantes compatibles, en SU idioma.
    // Fire-and-forget: sin datos del cliente; sin suscripciones es un no-op.
    let tipoNombre: Record<string, unknown> | null = null;
    if (tipoGestionKey) {
      const [tg] = await db
        .select({ nombre: tiposGestion.nombre })
        .from(tiposGestion)
        .where(eq(tiposGestion.key, tipoGestionKey))
        .limit(1);
      tipoNombre = (tg?.nombre as Record<string, unknown> | null) ?? null;
    }
    const fechaStr = fechaHoraMadrid(fechaHora);
    const candidatos = await db
      .select({
        profileId: acompanantes.profileId,
        modalidades: acompanantes.modalidades,
        idioma: profiles.idiomaPreferido,
      })
      .from(acompanantes)
      .leftJoin(profiles, eq(profiles.id, acompanantes.profileId))
      .where(
        and(eq(acompanantes.activo, true), eq(acompanantes.aceptaGestiones, true))
      );
    await Promise.allSettled(
      candidatos
        .filter(
          (c): c is typeof c & { profileId: string } =>
            !!c.profileId && modalidadCompatible(c.modalidades, modoGestion)
        )
        .map((c) => {
          const idioma = isLocale(c.idioma) ? c.idioma : "es";
          const p = pushStrings[idioma];
          return enviarPushAPerfil(c.profileId, {
            title: p.nuevaPeticionTitle,
            body: p.nuevaPeticionBody({
              tipoGestion:
                (tipoNombre ? pickLang(tipoNombre, idioma) : "") ||
                tipoGestionKey ||
                "",
              fechaStr,
            }),
            url: "/acompanante/peticiones",
            tag: `peticion-${reserva.id}`,
          });
        })
    );

    // Aviso también a los superadmins (push a /admin/reservas). Tag distinto
    // del de acompañantes para no colapsar en dispositivos con ambos roles.
    const admins = await db
      .select({ id: profiles.id, idioma: profiles.idiomaPreferido })
      .from(profiles)
      .where(eq(profiles.rol, "superadmin"));
    await Promise.allSettled(
      admins.map((sa) => {
        const idioma = isLocale(sa.idioma) ? sa.idioma : "es";
        const p = pushStrings[idioma];
        return enviarPushAPerfil(sa.id, {
          title: p.nuevaPeticionTitle,
          body: p.nuevaPeticionBody({
            tipoGestion:
              (tipoNombre ? pickLang(tipoNombre, idioma) : "") ||
              tipoGestionKey ||
              "",
            fechaStr,
          }),
          url: "/admin/reservas",
          tag: `peticion-admin-${reserva.id}`,
        });
      })
    );
  } else {
    // Notificar al acompañante (fire-and-forget; sin datos sensibles)
    let tipoNombre: string | undefined;
    if (tipoGestionKey) {
      const [tg] = await db
        .select({ nombre: tiposGestion.nombre })
        .from(tiposGestion)
        .where(eq(tiposGestion.key, tipoGestionKey))
        .limit(1);
      tipoNombre = (tg?.nombre as { es?: string } | undefined)?.es;
    }
    if (acompEmail) {
      emailNuevaReserva({
        toEmail: acompEmail,
        clienteNombre,
        acompananteNombre: acompNombre,
        fechaStr: fechaHora.toLocaleString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        servicioNombre: tipoNombre,
        idioma: acompIdioma ?? undefined,
      });
    }
    if (acompProfileId) {
      const p = pushStrings[isLocale(acompIdioma) ? acompIdioma : "es"];
      enviarPushAPerfil(acompProfileId, {
        title: p.nuevaReservaTitle,
        body: p.nuevaReservaBody({
          clienteNombre,
          fechaStr: fechaHoraMadrid(fechaHora),
        }),
        url: "/acompanante/reservas",
        tag: `reserva-${reserva.id}`,
      }).catch((e) =>
        console.error("push reserva directa (acompañante):", e)
      );
    }
  }

  revalidatePath("/cliente/reservas");
  revalidatePath("/admin/reservas");
  if (esCola) revalidatePath("/acompanante/peticiones");
  else revalidatePath("/acompanante/reservas");
  redirect("/cliente/reservas");
}

// ── Datos para el formulario (catálogo) ──────────────────────────────────────

/** Zonas activas de booking (para el select del form). Solo lectura. */
export async function getZonasBooking() {
  return db
    .select({ key: tZonas.key, nombre: tZonas.nombre })
    .from(tZonas)
    .where(eq(tZonas.activo, true));
}
