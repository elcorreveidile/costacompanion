import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularPrecio,
  formatEuros,
  modalidadCompatible,
  PrecioError,
  type TarifasCtx,
  type EntradaPrecio,
} from "@/lib/precios";

/**
 * Tests del motor de precios (lib/precios.ts): funciones puras, sin BD.
 * El contexto de tarifas se simula; las queries (cargarContextoPrecios /
 * getZonaBaseAcompanante) son wrappers triviales de select y no se cubren.
 */

const CTX: TarifasCtx = {
  tarifas: {
    remota: 2500,
    hora: 2000,
    media_jornada: 7000,
    jornada: 12000,
  },
  zonas: {
    marbella: 0,
    estepona: 500,
    fuengirola: 700,
  },
  config: {
    min_horas_facturables: 1,
    urgencia_horas_limite: 48,
    urgencia_pct: 50,
  },
};

const LEJOS = new Date("2026-06-15T10:00:00Z");
const AHORA = new Date("2026-06-01T10:00:00Z"); // 14 días antes ⇒ sin urgencia

function entrada(overrides: Partial<EntradaPrecio>): EntradaPrecio {
  return {
    modo: "media_jornada",
    zonaKey: "marbella",
    zonaBaseAcompanante: "marbella",
    fechaHora: LEJOS,
    ahora: AHORA,
    ...overrides,
  };
}

function precioErr(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof PrecioError) return e.codigo;
    throw e;
  }
  throw new Error("se esperaba PrecioError");
}

describe("calcularPrecio · base por modo", () => {
  it("remota: tarifa fija, sin zona", () => {
    const d = calcularPrecio(entrada({ modo: "remota", zonaKey: null }), CTX);
    assert.equal(d.baseCents, 2500);
    assert.equal(d.recargoZonaCents, 0);
    assert.equal(d.totalCents, 2500);
    assert.equal(d.horasFacturadas, null);
    assert.deepEqual(d.lineas, [{ key: "base", importeCents: 2500 }]);
  });

  it("horas: tarifa × horas pedidas", () => {
    const d = calcularPrecio(
      entrada({ modo: "horas", horas: 3 }),
      CTX
    );
    assert.equal(d.baseCents, 6000);
    assert.equal(d.horasFacturadas, 3);
    assert.equal(d.totalCents, 6000);
  });

  it("horas: aplica el mínimo facturable configurado", () => {
    const d = calcularPrecio(entrada({ modo: "horas", horas: 1 }), CTX);
    assert.equal(d.horasFacturadas, 1); // min_horas_facturables: 1
    assert.equal(d.baseCents, 2000);
  });

  it("horas: mínimo facturable por defecto (2) si no hay config", () => {
    const sinMin: TarifasCtx = { ...CTX, config: {} };
    const d = calcularPrecio(entrada({ modo: "horas", horas: 1 }), sinMin);
    assert.equal(d.horasFacturadas, 2);
    assert.equal(d.baseCents, 4000);
  });

  it("horas: no baja del mínimo aunque se pidan menos", () => {
    const conMin2: TarifasCtx = {
      ...CTX,
      config: { ...CTX.config, min_horas_facturables: 2 },
    };
    const d = calcularPrecio(entrada({ modo: "horas", horas: 1 }), conMin2);
    assert.equal(d.horasFacturadas, 2);
    assert.equal(d.baseCents, 4000);
  });

  it("media_jornada y jornada: precio fijo de definición de producto", () => {
    assert.equal(
      calcularPrecio(entrada({ modo: "media_jornada" }), CTX).totalCents,
      7000
    );
    assert.equal(
      calcularPrecio(entrada({ modo: "jornada" }), CTX).totalCents,
      12000
    );
  });
});

describe("calcularPrecio · errores", () => {
  it("horas inválidas: 0, negativas, decimales o ausentes", () => {
    for (const horas of [0, -2, 1.5, undefined]) {
      assert.equal(
        precioErr(() => calcularPrecio(entrada({ modo: "horas", horas }), CTX)),
        "horas_invalidas"
      );
    }
  });

  it("modo no reconocido", () => {
    assert.equal(
      precioErr(() =>
        calcularPrecio(entrada({ modo: "semana" as never }), CTX)
      ),
      "modo_invalido"
    );
  });

  it("tarifa ausente del contexto", () => {
    const sinTarifas: TarifasCtx = { ...CTX, tarifas: { hora: 2000 } };
    assert.equal(
      precioErr(() => calcularPrecio(entrada({ modo: "remota" }), sinTarifas)),
      "tarifa_no_configurada"
    );
    assert.equal(
      precioErr(() =>
        calcularPrecio(entrada({ modo: "horas", horas: 2 }), {
          ...CTX,
          tarifas: { remota: 2500 },
        })
      ),
      "tarifa_no_configurada"
    );
  });

  it("zona presencial obligatoria", () => {
    assert.equal(
      precioErr(() =>
        calcularPrecio(entrada({ modo: "horas", horas: 2, zonaKey: null }), CTX)
      ),
      "zona_fuera_provincia"
    );
  });

  it("zona desconocida (y distinta de la base) fuera de provincia", () => {
    assert.equal(
      precioErr(() =>
        calcularPrecio(
          entrada({ modo: "horas", horas: 2, zonaKey: "torremolinos" }),
          CTX
        )
      ),
      "zona_fuera_provincia"
    );
  });

  it("modo remota ignora zona: null siempre válido", () => {
    const d = calcularPrecio(
      entrada({ modo: "remota", zonaKey: null, zonaBaseAcompanante: null }),
      CTX
    );
    assert.equal(d.totalCents, 2500);
  });
});

describe("calcularPrecio · recargo de zona", () => {
  it("municipio base del acompañante: sin recargo (aunque no esté en la tabla)", () => {
    const d = calcularPrecio(
      entrada({ modo: "horas", horas: 2, zonaKey: "marbella", zonaBaseAcompanante: "marbella" }),
      { ...CTX, zonas: { estepona: 500 } } // marbella ni siquiera existe aquí
    );
    assert.equal(d.recargoZonaCents, 0);
    assert.equal(d.totalCents, 4000);
    assert.equal(d.lineas.length, 1);
  });

  it("municipio distinto: recargo de la tabla", () => {
    const d = calcularPrecio(
      entrada({ modo: "horas", horas: 2, zonaKey: "estepona", zonaBaseAcompanante: "marbella" }),
      CTX
    );
    assert.equal(d.recargoZonaCents, 500);
    assert.equal(d.totalCents, 4500);
    assert.deepEqual(d.lineas, [
      { key: "base", importeCents: 4000 },
      { key: "zona", importeCents: 500 },
    ]);
  });

  it("sin zona base declarada: recargo en todos los municipios", () => {
    const d = calcularPrecio(
      entrada({ modo: "horas", horas: 2, zonaKey: "fuengirola", zonaBaseAcompanante: null }),
      CTX
    );
    assert.equal(d.recargoZonaCents, 700);
    assert.equal(d.totalCents, 4700);
  });
});

describe("calcularPrecio · urgencia", () => {
  it("cita a menos del límite: recargo sobre base + zona", () => {
    const pronto = new Date("2026-06-02T10:00:00Z"); // 24 h después de AHORA
    const d = calcularPrecio(
      entrada({
        modo: "horas",
        horas: 2,
        zonaKey: "estepona",
        zonaBaseAcompanante: "marbella",
        fechaHora: pronto,
      }),
      CTX
    );
    assert.equal(d.urgencia, true);
    assert.equal(d.recargoUrgenciaCents, 2250); // 50 % de (4000 + 500)
    assert.equal(d.totalCents, 6750);
    assert.deepEqual(d.lineas, [
      { key: "base", importeCents: 4000 },
      { key: "zona", importeCents: 500 },
      { key: "urgencia", importeCents: 2250 },
    ]);
  });

  it("en el límite exacto no hay urgencia (<, no ≤)", () => {
    const justo = new Date("2026-06-03T10:00:00Z"); // exactamente 48 h
    const d = calcularPrecio(entrada({ fechaHora: justo }), CTX);
    assert.equal(d.urgencia, false);
    assert.equal(d.recargoUrgenciaCents, 0);
  });

  it("cita lejana: sin urgencia", () => {
    const d = calcularPrecio(entrada(), CTX);
    assert.equal(d.urgencia, false);
    assert.equal(d.totalCents, 7000);
  });

  it("porcentaje configurable", () => {
    const pct15: TarifasCtx = {
      ...CTX,
      config: { ...CTX.config, urgencia_pct: 15 },
    };
    const pronto = new Date("2026-06-02T10:00:00Z");
    const d = calcularPrecio(entrada({ fechaHora: pronto }), pct15);
    assert.equal(d.recargoUrgenciaCents, 1050); // 15 % de 7000
    assert.equal(d.totalCents, 8050);
  });

  it("redondeo a céntimos entero (half-up)", () => {
    const raro: TarifasCtx = {
      ...CTX,
      tarifas: { ...CTX.tarifas, media_jornada: 3333 },
    };
    const pronto = new Date("2026-06-02T10:00:00Z");
    const d = calcularPrecio(entrada({ fechaHora: pronto }), raro);
    assert.equal(d.recargoUrgenciaCents, 1667); // round(3333 × 0.5) = round(1666.5)
    assert.equal(d.totalCents, 5000);
  });
});

describe("modalidadCompatible", () => {
  it("sin restricción declarada (null o vacío): todo compatible", () => {
    assert.equal(modalidadCompatible(null, "remota"), true);
    assert.equal(modalidadCompatible(null, "horas"), true);
    assert.equal(modalidadCompatible([], "jornada"), true);
  });

  it("remota exige remoto o ambos", () => {
    assert.equal(modalidadCompatible(["remoto"], "remota"), true);
    assert.equal(modalidadCompatible(["ambos"], "remota"), true);
    assert.equal(modalidadCompatible(["presencial"], "remota"), false);
  });

  it("presencial exige presencial o ambos", () => {
    assert.equal(modalidadCompatible(["presencial"], "horas"), true);
    assert.equal(modalidadCompatible(["presencial"], "jornada"), true);
    assert.equal(modalidadCompatible(["ambos"], "media_jornada"), true);
    assert.equal(modalidadCompatible(["remoto"], "horas"), false);
  });
});

describe("formatEuros", () => {
  it("convierte céntimos a euros (coma decimal, sin céntimos sueltos)", () => {
    // Sin separador de miles a propósito: la agrupación depende de la
    // versión de ICU/CLDR y no forma parte del contrato.
    assert.equal(
      formatEuros(5850, "es-ES").replace(/\u00a0/g, " "),
      "58,50 €"
    );
    assert.equal(
      formatEuros(700, "es-ES").replace(/\u00a0/g, " "),
      "7,00 €"
    );
  });

  it("en en-GB el símbolo va delante", () => {
    assert.equal(formatEuros(5850, "en-GB").replace(/\u00a0/g, " "), "€58.50");
  });
});
