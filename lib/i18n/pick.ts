import { defaultLocale, type Locale } from "./config";

type MaybeMultilang = Record<string, unknown> | null | undefined;

/**
 * Elige el texto de un campo multilingüe (jsonb {es, en, fr, ...}) según el
 * idioma, con cadena de respaldo: idioma pedido → inglés → español → primera
 * traducción disponible. Devuelve "" si no hay ninguna.
 */
export function pickLang(
  value: MaybeMultilang,
  locale: Locale,
  fallbackChain: Locale[] = ["en", defaultLocale]
): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  const order = [locale, ...fallbackChain];
  for (const l of order) {
    const v = obj[l];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  // Última opción: cualquier cadena no vacía presente.
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return "";
}
