import { defaultLocale, type Locale } from "./config";
import es, { type Dictionary } from "./dictionaries/es";
import en from "./dictionaries/en";
import fr from "./dictionaries/fr";
import de from "./dictionaries/de";
import nl from "./dictionaries/nl";
import ru from "./dictionaries/ru";
import uk from "./dictionaries/uk";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en, fr, de, nl, ru, uk };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[defaultLocale];
}

export type { Dictionary };
