import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  alternatesFor,
  isLocale,
  languageName,
  localePath,
  locales,
} from "@/lib/i18n/config";
import { pickLang } from "@/lib/i18n/pick";

/**
 * Tests del núcleo de i18n: pickLang (cadena de respaldo de los campos
 * jsonb multilingües) y config (isLocale / localePath / alternatesFor /
 * languageName). Funciones puras, sin BD.
 */

describe("pickLang", () => {
  it("entradas no objeto: cadena vacía, nunca lanza", () => {
    for (const v of [null, undefined, "texto", 42]) {
      assert.equal(pickLang(v as never, "es"), "");
    }
  });

  it("idioma pedido presente: lo devuelve directo", () => {
    assert.equal(pickLang({ es: "Hola", en: "Hello" }, "es"), "Hola");
    assert.equal(pickLang({ es: "Hola", en: "Hello" }, "en"), "Hello");
  });

  it("respaldo: idioma pedido → en → es → cualquier cadena no vacía", () => {
    // fr no existe → cae a en.
    assert.equal(pickLang({ en: "Hello", es: "Hola" }, "fr"), "Hello");
    // ni en → cae a es (defaultLocale).
    assert.equal(pickLang({ es: "Hola" }, "en"), "Hola");
    // solo hay una lengua no prevista → se devuelve igualmente.
    assert.equal(pickLang({ de: "Hallo" }, "fr"), "Hallo");
  });

  it("cadenas vacías o con espacios no cuentan como traducción", () => {
    assert.equal(pickLang({ es: "", en: "   ", de: "Hallo" }, "es"), "Hallo");
  });

  it("valores no cadena (números, objetos) se ignoran", () => {
    assert.equal(pickLang({ es: 123, en: "Hello" } as never, "es"), "Hello");
  });

  it("cadena de respaldo personalizada", () => {
    assert.equal(
      pickLang({ ru: "Привет", fr: "Salut" }, "en", ["fr"]),
      "Salut"
    );
  });

  it("todo vacío: cadena vacía", () => {
    assert.equal(pickLang({ es: "  ", en: "" }, "es"), "");
  });
});

describe("isLocale", () => {
  it("acepta solo los 7 códigos de la plataforma", () => {
    for (const l of locales) assert.equal(isLocale(l), true);
  });

  it("rechaza basura, vacío, null y undefined (y afina el tipo)", () => {
    for (const v of ["xx", "es-ES", "ESP", "", null, undefined]) {
      assert.equal(isLocale(v), false);
    }
    const v: string | undefined = "en";
    if (isLocale(v)) {
      // Narrowing: aquí TS sabe que v es Locale.
      assert.equal(v satisfies "es" | "en" | "fr" | "de" | "nl" | "ru" | "uk", "en");
    } else {
      assert.fail("en debería ser locale");
    }
  });
});

describe("localePath", () => {
  it("es (por defecto): ruta sin prefijo", () => {
    assert.equal(localePath("es", "/servicios"), "/servicios");
    assert.equal(localePath("es", "/"), "/");
  });

  it("resto de idiomas: prefijo /{locale}", () => {
    assert.equal(localePath("en", "/servicios"), "/en/servicios");
    assert.equal(localePath("ru", "/auth/login"), "/ru/auth/login");
  });

  it("raíz y sin barra: /en, nunca /en/", () => {
    assert.equal(localePath("en", "/"), "/en");
    assert.equal(localePath("de", ""), "/de");
  });

  it("el hash se recoloca tras el prefijo", () => {
    assert.equal(localePath("en", "/#como-funciona"), "/en#como-funciona");
    assert.equal(
      localePath("fr", "/servicios#precio"),
      "/fr/servicios#precio"
    );
  });

  it("rutas sin barra inicial se normalizan", () => {
    assert.equal(localePath("nl", "profile"), "/nl/profile");
  });
});

describe("alternatesFor", () => {
  it("canonical del idioma actual + 7 idiomas + x-default (es)", () => {
    const a = alternatesFor("/servicios", "en");
    assert.equal(a.canonical, "/en/servicios");
    assert.equal(a.languages.es, "/servicios");
    assert.equal(a.languages.en, "/en/servicios");
    assert.equal(a.languages.uk, "/uk/servicios");
    assert.equal(a.languages["x-default"], "/servicios");
    // 7 idiomas + x-default.
    assert.equal(Object.keys(a.languages).length, locales.length + 1);
  });

  it("en la raíz: es y x-default apuntan a /, el resto a /{locale}", () => {
    const a = alternatesFor("/", "es");
    assert.equal(a.canonical, "/");
    assert.equal(a.languages.es, "/");
    assert.equal(a.languages.en, "/en");
    assert.equal(a.languages["x-default"], "/");
  });
});

describe("languageName", () => {
  it("capitaliza el nombre del idioma en la lengua pedida", () => {
    assert.equal(languageName("en", "es"), "Inglés");
    assert.equal(languageName("es", "en"), "Spanish");
  });

  it("código desconocido o no estructural: devuelve el código", () => {
    // Un código bien formado pero desconocido sale como respaldo de
    // Intl.DisplayNames y la función lo capitaliza igualmente.
    assert.equal(languageName("xx", "es"), "Xx");
    // Un código mal formado hace lanzar a Intl.DisplayNames: el catch
    // devuelve el código tal cual, sin capitalizar.
    assert.equal(languageName("n0t-valid!!", "es"), "n0t-valid!!");
  });
});
