import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { profiles, acompanantes } from "./schema";

/**
 * Seed de usuarios iniciales (idempotente). Crea/actualiza:
 *   - Javier como superadmin.
 *   - Antonia como acompañante GRATIS (ficha activa, sin suscripción Stripe).
 * A ambos les genera número de usuario (6 díg.) y PIN (6 díg.) e imprime las
 * credenciales por consola para comunicárselas. Reejecutable: si el PIN ya
 * está fijado, lo respeta salvo que se pase RESET_PIN=1.
 *
 *   npm run db:seed:users
 *   RESET_PIN=1 npm run db:seed:users   # regenera los PIN
 */

const RESET_PIN = process.env.RESET_PIN === "1";

function pin6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function numeroUnico(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const n = pin6();
    const [existe] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.numeroUsuario, n))
      .limit(1);
    if (!existe) return n;
  }
  throw new Error("No se pudo generar un número de usuario único.");
}

interface SeedUser {
  email: string;
  nombre: string;
  rol: "superadmin" | "acompanante";
}

async function upsertUsuario(u: SeedUser): Promise<{ numero: string; pin: string | null }> {
  const [existente] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, u.email))
    .limit(1);

  const numero = existente?.numeroUsuario ?? (await numeroUnico());
  let pinPlano: string | null = null;
  let pinHash = existente?.pinHash ?? null;
  if (!pinHash || RESET_PIN) {
    pinPlano = pin6();
    pinHash = await bcrypt.hash(pinPlano, 10);
  }

  if (existente) {
    await db
      .update(profiles)
      .set({
        rol: u.rol,
        nombre: existente.nombre ?? u.nombre,
        name: existente.name ?? u.nombre,
        numeroUsuario: numero,
        pinHash,
        pinIntentos: 0,
        pinBloqueadoHasta: null,
        emailVerified: existente.emailVerified ?? new Date(),
      })
      .where(eq(profiles.id, existente.id));
    return { numero, pin: pinPlano };
  }

  await db.insert(profiles).values({
    rol: u.rol,
    nombre: u.nombre,
    name: u.nombre,
    email: u.email,
    emailVerified: new Date(),
    numeroUsuario: numero,
    pinHash,
  });
  return { numero, pin: pinPlano };
}

async function ensureFichaAntonia(email: string) {
  const [prof] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (!prof) return;

  const [ficha] = await db
    .select({ id: acompanantes.id })
    .from(acompanantes)
    .where(eq(acompanantes.profileId, prof.id))
    .limit(1);
  if (ficha) return;

  await db.insert(acompanantes).values({
    profileId: prof.id,
    slug: "antonia-garcia-bueno",
    nombrePublico: "Antonia García Bueno",
    // Gratis: ficha publicada, sin suscripción de Stripe.
    activo: true,
    stripeSubscriptionStatus: "sin_suscripcion",
  });
}

async function main() {
  const javier = await upsertUsuario({
    email: "javier@blablaele.com",
    nombre: "Javier",
    rol: "superadmin",
  });
  const antonia = await upsertUsuario({
    email: "antoniagarciabueno@yahoo.es",
    nombre: "Antonia García Bueno",
    rol: "acompanante",
  });
  await ensureFichaAntonia("antoniagarciabueno@yahoo.es");

  const linea = (nombre: string, r: { numero: string; pin: string | null }) =>
    `  ${nombre}: nº usuario = ${r.numero}` +
    (r.pin ? ` · PIN = ${r.pin}` : " · PIN = (sin cambios; usa RESET_PIN=1 para regenerar)");

  console.log("\nUsuarios listos:");
  console.log(linea("Javier (superadmin)", javier));
  console.log(linea("Antonia (acompañante, gratis)", antonia));
  console.log(
    "\nComunica estos datos por un canal seguro. El PIN solo se muestra al crearlo o con RESET_PIN=1.\n"
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("Error en el seed de usuarios:", e);
  process.exit(1);
});
