/**
 * Fuente única de las zonas de servicio de la Costa del Sol.
 *
 * Antes había listas duplicadas (con drift) en ~6 ficheros; todo lo que
 * necesite zonas debe importar de aquí.
 *
 * Conceptos distintos que no hay que mezclar:
 *  - ZONAS_GESTION: municipios con precio para reservas de gestiones. Sus
 *    `key` son los identificadores canónicos de la tabla `zonas` en la BD.
 *    El recargo aplica cuando la zona de la gestión no es la base del
 *    acompañante (tarjeta de precios: +15–25 € según zona).
 *  - Marcadores de cobertura («Toda la Costa del Sol», «Otra Costa del Sol»):
 *    NO son zonas de reserva, solo opciones de formulario.
 *  - Pedanías de Marbella (San Pedro de Alcántara, Puerto Banús): aparecen
 *    como valores de zona de anunciantes y filtro del directorio, pero no
 *    son municipios de reserva.
 */

export interface ZonaDef {
  key: string;
  nombreEs: string;
  /** Recargo por defecto en céntimos (editable en BD desde /admin/tarifas). */
  recargoCentsDefecto: number;
}

/** Orden de display (de oeste a este), no alfabético. */
export const ZONAS_GESTION: ZonaDef[] = [
  { key: "estepona", nombreEs: "Estepona", recargoCentsDefecto: 1500 },
  { key: "sotogrande", nombreEs: "Sotogrande", recargoCentsDefecto: 2500 },
  { key: "duquesa", nombreEs: "Duquesa", recargoCentsDefecto: 2500 },
  { key: "manilva", nombreEs: "Manilva", recargoCentsDefecto: 2000 },
  { key: "casares", nombreEs: "Casares", recargoCentsDefecto: 2000 },
  { key: "benahavis", nombreEs: "Benahavís", recargoCentsDefecto: 1500 },
  { key: "marbella", nombreEs: "Marbella", recargoCentsDefecto: 1500 },
  { key: "fuengirola", nombreEs: "Fuengirola", recargoCentsDefecto: 1500 },
  { key: "mijas", nombreEs: "Mijas", recargoCentsDefecto: 1500 },
  { key: "torremolinos", nombreEs: "Torremolinos", recargoCentsDefecto: 2000 },
  { key: "malaga", nombreEs: "Málaga", recargoCentsDefecto: 2000 },
];

export type ZonaGestionKey = (typeof ZONAS_GESTION)[number]["key"];

/** Marcador de cobertura: el acompañante acepta cualquier zona de la Costa del Sol. */
export const ZONA_TODA = "Toda la Costa del Sol";
/** Marcador del formulario de anunciantes. */
export const ZONA_OTRA = "Otra Costa del Sol";

/** Zonas ofertadas en la ficha del acompañante (municipios + marcador). */
export const ZONAS_ACOMPANANTE: string[] = [
  ...ZONAS_GESTION.map((z) => z.nombreEs),
  ZONA_TODA,
];

/** Opciones de filtro del directorio de acompañantes. */
export const ZONAS_FILTRO_DIRECTORIO: string[] = [
  ...ZONAS_GESTION.map((z) => z.nombreEs),
  "San Pedro de Alcántara",
  "Puerto Banús",
  ZONA_TODA,
];

/** Zonas del formulario y listado de anunciantes (Local Partners). */
export const ZONAS_ANUNCIANTE: string[] = [
  ...ZONAS_GESTION.map((z) => z.nombreEs),
  "San Pedro de Alcántara",
  "Puerto Banús",
  ZONA_OTRA,
];

/** Devuelve la definición de zona de gestión por nombre en español, o null. */
export function zonaGestionPorNombreEs(nombre: string): ZonaDef | null {
  return ZONAS_GESTION.find((z) => z.nombreEs === nombre) ?? null;
}

/** Devuelve la definición de zona de gestión por key canónica, o null. */
export function zonaGestionPorKey(key: string): ZonaDef | null {
  return ZONAS_GESTION.find((z) => z.key === key) ?? null;
}
