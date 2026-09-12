import { db } from "./index";
import { serviceCategories } from "./schema";

/**
 * Seed idempotente del catálogo de categorías de servicio.
 * Portado de supabase/migrations/002_seed_categories.sql.
 *
 * Ejecutar con DATABASE_URL en el entorno:
 *   npm run db:seed
 * Reejecutable sin duplicar (onConflictDoNothing sobre la clave única `key`).
 */

type Grupo = "tramites" | "salud" | "propiedad" | "otros";

const CATEGORIAS: { key: string; grupo: Grupo; nombre: Record<string, string> }[] = [
  // ── Trámites administrativos y legales ──
  { key: "policia-permisos", grupo: "tramites", nombre: { es: "Policía / permisos", en: "Police / permits", fr: "Police / permis", de: "Polizei / Genehmigungen", nl: "Politie / vergunningen" } },
  { key: "denuncias", grupo: "tramites", nombre: { es: "Denuncias", en: "Police reports", fr: "Plaintes", de: "Anzeigen", nl: "Aangifte" } },
  { key: "extranjeria-nie", grupo: "tramites", nombre: { es: "Extranjería / NIE", en: "Immigration / NIE", fr: "Immigration / NIE", de: "Ausländerbehörde / NIE", nl: "Vreemdelingenzaken / NIE" } },
  { key: "empadronamiento", grupo: "tramites", nombre: { es: "Empadronamiento", en: "Residency registration", fr: "Inscription au registre communal", de: "Einwohnermeldeamt", nl: "Inschrijving gemeente" } },
  { key: "notaria-gestoria", grupo: "tramites", nombre: { es: "Notaría / gestoría", en: "Notary / legal admin", fr: "Notaire / gestion administrative", de: "Notar / Verwaltung", nl: "Notaris / administratie" } },
  { key: "banca", grupo: "tramites", nombre: { es: "Banca", en: "Banking", fr: "Banque", de: "Bankwesen", nl: "Bankzaken" } },
  { key: "citas-oficiales", grupo: "tramites", nombre: { es: "Citas oficiales", en: "Official appointments", fr: "Rendez-vous officiels", de: "Behördentermine", nl: "Officiële afspraken" } },
  // ── Salud ──
  { key: "acompanamiento-medico", grupo: "salud", nombre: { es: "Acompañamiento médico", en: "Medical accompaniment", fr: "Accompagnement médical", de: "Medizinische Begleitung", nl: "Medische begeleiding" } },
  // ── Propiedad ──
  { key: "compraventa-propiedad", grupo: "propiedad", nombre: { es: "Compraventa de propiedades", en: "Property purchase / sale", fr: "Achat / vente de propriété", de: "Immobilienkauf / -verkauf", nl: "Aan- en verkoop vastgoed" } },
  // ── Otros ──
  { key: "interpretacion-telefonica", grupo: "otros", nombre: { es: "Interpretación telefónica urgente", en: "Urgent phone interpretation", fr: "Interprétation téléphonique urgente", de: "Dringende Telefondolmetschung", nl: "Urgente telefonische tolkendienst" } },
  { key: "preparacion-entrevista", grupo: "otros", nombre: { es: "Preparación de entrevista de trabajo", en: "Job interview preparation", fr: "Préparation d'entretien d'embauche", de: "Vorbereitung Vorstellungsgespräch", nl: "Sollicitatiegesprek voorbereiding" } },
  { key: "clases-espanol", grupo: "otros", nombre: { es: "Clases de español", en: "Spanish lessons", fr: "Cours d'espagnol", de: "Spanischunterricht", nl: "Spaanse lessen" } },
];

async function seed() {
  const res = await db
    .insert(serviceCategories)
    .values(CATEGORIAS.map((c) => ({ key: c.key, grupo: c.grupo, nombre: c.nombre })))
    .onConflictDoNothing({ target: serviceCategories.key })
    .returning({ key: serviceCategories.key });
  console.log(
    `Seed categorías: ${res.length} insertadas (${CATEGORIAS.length - res.length} ya existían).`
  );
  process.exit(0);
}

seed().catch((e) => {
  console.error("Error en el seed:", e);
  process.exit(1);
});
