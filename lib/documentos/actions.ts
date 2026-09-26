"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { documentos, reservas } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

/**
 * Documentos de citación de una reserva (Blob privado + RGPD).
 *  - Subida: solo el cliente dueño de la reserva; 10 MB máx; PDF/imagen.
 *  - Descarga: nunca directa — vía /api/documentos/[id] (URL firmada 5 min).
 *  - Borrado: dueño o superadmin ⇒ blob fuera + soft-delete de la fila.
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MIME_PERMITIDOS = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function volverConError(reservaId: string, locale: Locale, motivo: string): never {
  redirect(
    `${localePath(locale, `/cliente/reservas/${reservaId}`)}?doc_error=${motivo}`
  );
}

export async function subirDocumento(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const reservaId = formData.get("reserva_id") as string;
  const localeRaw = formData.get("locale") as string;
  const locale = isLocale(localeRaw) ? localeRaw : "es";
  const detallePath = localePath(locale, `/cliente/reservas/${reservaId}`);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) volverConError(reservaId, locale, "vacio");
  if (file.size > MAX_BYTES) volverConError(reservaId, locale, "tamano");
  // file.type vacío ⇒ navegador no reconoció el tipo; rechazar por prudencia.
  if (!file.type || !MIME_PERMITIDOS.has(file.type)) {
    volverConError(reservaId, locale, "tipo");
  }

  // Ownership: solo el cliente de la reserva le sube documentos.
  const [reserva] = await db
    .select({
      clienteId: reservas.clienteId,
      acompananteId: reservas.acompananteId,
    })
    .from(reservas)
    .where(eq(reservas.id, reservaId))
    .limit(1);
  if (!reserva || reserva.clienteId !== user.id) {
    volverConError(reservaId, locale, "permiso");
  }

  // Petición en cola (Fase C1): sin acompañante asignado no hay citación a quién
  // entregar — bloquear la subida hasta que el superadmin asigne.
  if (!reserva.acompananteId) {
    volverConError(reservaId, locale, "sin_asignar");
  }

  // Nombre legible sin caracteres problemáticos (uuid delante evita colisiones).
  const nombreSeguro =
    (file.name || "documento")
      .replace(/[^\p{L}\p{N}._ -]+/gu, "")
      .trim()
      .slice(0, 120) || "documento";

  const blob = await put(
    `documentos/${reservaId}/${crypto.randomUUID()}-${nombreSeguro}`,
    file,
    {
      access: "private",
      contentType: file.type,
      addRandomSuffix: false,
    }
  );

  await db.insert(documentos).values({
    reservaId,
    clienteId: user.id,
    acompananteId: reserva.acompananteId,
    blobPathname: blob.pathname,
    blobUrl: blob.url,
    mime: file.type,
    bytes: file.size,
    nombreOriginal: nombreSeguro,
  });

  revalidatePath(detallePath);
  redirect(detallePath);
}

export async function borrarDocumento(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const documentoId = formData.get("documento_id") as string;
  const reservaId = formData.get("reserva_id") as string;
  const localeRaw = formData.get("locale") as string;
  const locale = isLocale(localeRaw) ? localeRaw : "es";
  const detallePath = localePath(locale, `/cliente/reservas/${reservaId}`);

  const [doc] = await db
    .select({ clienteId: documentos.clienteId, blobUrl: documentos.blobUrl })
    .from(documentos)
    .where(and(eq(documentos.id, documentoId), isNull(documentos.eliminadoAt)))
    .limit(1);
  if (!doc) redirect(detallePath);

  // Solo el dueño del documento o un superadmin.
  if (doc.clienteId !== user.id && user.rol !== "superadmin") {
    redirect(detallePath);
  }

  // Blob best-effort: si falla, la fila igualmente queda sin acceso (soft-delete)
  // y el cron de purga (Etapa 8) remueve el resto.
  try {
    await del(doc.blobUrl);
  } catch (e) {
    console.error("borrarDocumento blob:", e);
  }

  await db
    .update(documentos)
    .set({ eliminadoAt: new Date() })
    .where(eq(documentos.id, documentoId));

  revalidatePath(detallePath);
  redirect(detallePath);
}
