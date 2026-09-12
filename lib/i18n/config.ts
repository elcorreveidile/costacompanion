// Configuración de idiomas de la plataforma.
// Español es el idioma por defecto y vive en la raíz ("/"); el resto usan
// prefijo de subruta ("/en", "/fr", "/de", "/nl", "/ru", "/uk").

export const locales = ["es", "en", "fr", "de", "nl", "ru", "uk"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

/** Idiomas con prefijo en la URL (todos menos el por defecto). */
export const prefixedLocales = locales.filter((l) => l !== defaultLocale);

/** Nombre de cada idioma en su propia lengua (para el selector). */
export const localeNames: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  nl: "Nederlands",
  ru: "Русский",
  uk: "Українська",
};

/** Código corto para el selector compacto. */
export const localeShort: Record<Locale, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
  de: "DE",
  nl: "NL",
  ru: "RU",
  uk: "UK",
};

/** Etiqueta BCP-47 para <html lang> y hreflang. */
export const htmlLang: Record<Locale, string> = {
  es: "es",
  en: "en",
  fr: "fr",
  de: "de",
  nl: "nl",
  ru: "ru",
  uk: "uk",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * Nombre de un idioma (código ISO como "en", "fr", "zh") en la lengua `locale`,
 * con la primera letra en mayúscula. Usa Intl.DisplayNames, así que no hace
 * falta traducir a mano cada nombre de idioma.
 */
export function languageName(code: string, locale: Locale): string {
  try {
    const dn = new Intl.DisplayNames([locale], { type: "language" });
    const name = dn.of(code);
    if (!name) return code;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return code;
  }
}

/**
 * Construye una ruta con el prefijo de idioma correcto.
 * localePath("en", "/servicios")     -> "/en/servicios"
 * localePath("es", "/servicios")     -> "/servicios"
 * localePath("en", "/#como-funciona")-> "/en#como-funciona"
 * localePath("en", "/")              -> "/en"
 */
export function localePath(locale: Locale, href: string): string {
  if (locale === defaultLocale) return href;
  // Separa el hash (#ancla) para colocarlo tras el prefijo.
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const path = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  if (path === "/" || path === "") return `/${locale}${hash}`;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}${hash}`;
}

/**
 * Construye canonical + hreflang para una ruta SIN prefijo de idioma
 * (p. ej. "/servicios"). El canonical apunta a la versión del idioma actual;
 * `languages` incluye una entrada por idioma (código BCP-47) más `x-default`
 * que apunta al español (raíz). Rutas relativas: Next las resuelve contra
 * `metadataBase`.
 */
export function alternatesFor(
  pathname: string,
  current: Locale = defaultLocale
): { canonical: string; languages: Record<string, string> } {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[htmlLang[l]] = localePath(l, clean);
  }
  languages["x-default"] = localePath(defaultLocale, clean);
  return { canonical: localePath(current, clean), languages };
}
