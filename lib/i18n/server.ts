import "server-only";
import { headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./index";

/**
 * Idioma de la petición actual, resuelto por el middleware (cabecera x-locale).
 * Uso en Server Components / layouts / server actions.
 */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const value = h.get("x-locale");
  return isLocale(value) ? value : defaultLocale;
}

/** Idioma + diccionario de la petición actual. */
export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}
