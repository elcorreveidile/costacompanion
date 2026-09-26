import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, inArray, isNull, lt, lte } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import {
  acompanantes,
  configPrecios,
  documentos,
  profiles,
  reservas,
} from "@/lib/db/schema";
import { enviarPushAPerfil } from "@/lib/push/send";
import { pushStrings } from "@/lib/push/strings";
import { emailRecordatorioReserva } from "@/lib/email";
import { isLocale } from "@/lib/i18n/config";
import { fechaHoraMadrid } from "@/lib/tiempo";

export const dynamic = "force-dynamic";

/**
 * Cron horario (vercel.json): dos tareas.
 *
 * 1. Recordatorios 24 h: reservas confirmadas con fechaHora ∈ (ahora, ahora+24 h]
 *    y sin recordatorio. El dedupe es la MISMA UPDATE condicional (flag en la
 *    fila) — sin transacciones: si dos ejecuciones compiten, solo una gana el
 *    claim (returning con filas) y envía. Neon HTTP no tiene transacciones.
 *
 * 2. Purga RGPD de documentos: docs de reservas completadas con fechaHora
 *    anterior a retencion_docs_meses ⇒ se borra el blob y se marca eliminadoAt.
 *
 * Guard: cabecera Authorization: Bearer CRON_SECRET. Vercel Cron invoca con GET.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();

  // ── 1. Recordatorios ────────────────────────────────────────────────────────
  const config = await db
    .select({
      clave: configPrecios.clave,
      valor: configPrecios.valorEntero,
    })
    .from(configPrecios)
    .where(
      inArray(configPrecios.clave, ["recordatorio_horas", "retencion_docs_meses"])
    );
  const valores = Object.fromEntries(config.map((c) => [c.clave, c.valor]));
  const horasRecordatorio = valores.recordatorio_horas ?? 24;
  const mesesRetencion = valores.retencion_docs_meses ?? 12;

  const limite = new Date(ahora.getTime() + horasRecordatorio * 3_600_000);

  const candidatas = await db
    .select({
      id: reservas.id,
      clienteId: reservas.clienteId,
      fechaHora: reservas.fechaHora,
      clienteEmail: profiles.email,
      clienteNombre: profiles.nombre,
      clienteIdioma: profiles.idiomaPreferido,
      acompNombre: acompanantes.nombrePublico,
    })
    .from(reservas)
    .innerJoin(profiles, eq(profiles.id, reservas.clienteId))
    .innerJoin(acompanantes, eq(acompanantes.id, reservas.acompananteId))
    .where(
      and(
        eq(reservas.estado, "confirmada"),
        gt(reservas.fechaHora, ahora),
        lte(reservas.fechaHora, limite),
        isNull(reservas.pushRecordatorio24hEnviadoAt)
      )
    );

  let recordatorios = 0;
  for (const r of candidatas) {
    // Claim atómico: solo una ejecución lo consigue; el push/email va después.
    const claim = await db
      .update(reservas)
      .set({ pushRecordatorio24hEnviadoAt: ahora })
      .where(
        and(
          eq(reservas.id, r.id),
          isNull(reservas.pushRecordatorio24hEnviadoAt)
        )
      )
      .returning({ id: reservas.id });
    if (claim.length === 0) continue; // otra ejecución se lo llevó
    recordatorios++;

    const fechaStr = fechaHoraMadrid(r.fechaHora);
    const p = pushStrings[isLocale(r.clienteIdioma) ? r.clienteIdioma : "es"];
    await enviarPushAPerfil(r.clienteId, {
      title: p.recordatorioTitle,
      body: p.recordatorioBody({
        acompananteNombre: r.acompNombre,
        fechaStr,
      }),
      url: "/cliente/reservas",
      tag: `recordatorio-${r.id}`,
    });

    if (r.clienteEmail) {
      await emailRecordatorioReserva({
        toEmail: r.clienteEmail,
        clienteNombre: r.clienteNombre ?? "Cliente",
        acompananteNombre: r.acompNombre,
        fechaStr,
        idioma: r.clienteIdioma ?? undefined,
      });
    }
  }

  // ── 2. Purga RGPD de documentos ─────────────────────────────────────────────
  const corte = new Date(ahora);
  corte.setMonth(corte.getMonth() - mesesRetencion);

  const aPurgar = await db
    .select({ id: documentos.id, blobUrl: documentos.blobUrl })
    .from(documentos)
    .innerJoin(reservas, eq(reservas.id, documentos.reservaId))
    .where(
      and(
        isNull(documentos.eliminadoAt),
        eq(reservas.estado, "completada"),
        lt(reservas.fechaHora, corte)
      )
    )
    .limit(100); // por ejecución: no blockear el cron con lotes enormes

  for (const d of aPurgar) {
    try {
      await del(d.blobUrl);
    } catch (e) {
      console.error(`purga: no se pudo borrar el blob ${d.blobUrl}:`, e);
    }
    await db
      .update(documentos)
      .set({ eliminadoAt: ahora })
      .where(eq(documentos.id, d.id));
  }

  return NextResponse.json({
    recordatorios,
    docsPurgados: aPurgar.length,
  });
}
