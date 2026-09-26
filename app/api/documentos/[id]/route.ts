import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { db } from "@/lib/db";
import { documentos } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { getMiAcompananteId } from "@/lib/db/queries/acompanante";

export const dynamic = "force-dynamic";

const VALIDO_MS = 5 * 60 * 1000; // URL firmada de 5 minutos

/**
 * Descarga de documento de citación: autentica, autoriza y redirige a una
 * URL firmada de corta vida. La URL del blob JAMÁS se expone en HTML.
 * Autorizados: cliente dueño · acompañante asignado · superadmin.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [doc] = await db
    .select({
      clienteId: documentos.clienteId,
      acompananteId: documentos.acompananteId,
      blobPathname: documentos.blobPathname,
    })
    .from(documentos)
    .where(and(eq(documentos.id, id), isNull(documentos.eliminadoAt)))
    .limit(1);

  // 404 (no 403) para no revelar la existencia de documentos ajenos.
  if (!doc) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  let autorizado = doc.clienteId === user.id || user.rol === "superadmin";
  if (!autorizado && user.rol === "acompanante") {
    const miAcompId = await getMiAcompananteId(user.id);
    autorizado = miAcompId !== null && miAcompId === doc.acompananteId;
  }
  if (!autorizado) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const validUntil = Date.now() + VALIDO_MS;
  const token = await issueSignedToken({
    pathname: doc.blobPathname,
    operations: ["get"],
    validUntil,
  });
  const { presignedUrl } = await presignUrl(token, {
    access: "private",
    operation: "get",
    pathname: doc.blobPathname,
    validUntil,
    useCache: false,
  });

  return NextResponse.redirect(presignedUrl);
}
