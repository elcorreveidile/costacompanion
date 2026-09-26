import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  madridWallTimeToUtc,
  limitesDiaMadrid,
  fechaISOenMadrid,
  horaMadrid,
  fechaHoraMadrid,
  horasHasta,
} from "@/lib/tiempo";

/**
 * Tests de utilidades de tiempo (lib/tiempo.ts). La regla del proyecto es
 * que los plazos se comparan como instantes UTC y solo la presentación se
 * formatea en Europe/Madrid. Se cubren los cambios de hora (DST) de 2026:
 *  - 29/03/2026: 02:00 CET → 03:00 CEST (día de 23 h)
 *  - 25/10/2026: 03:00 CEST → 02:00 CET  (día de 25 h)
 */

describe("madridWallTimeToUtc", () => {
  it("invierno: CET = UTC+1", () => {
    assert.equal(
      madridWallTimeToUtc("2026-01-15", "10:30").toISOString(),
      "2026-01-15T09:30:00.000Z"
    );
  });

  it("verano: CEST = UTC+2", () => {
    assert.equal(
      madridWallTimeToUtc("2026-07-15", "10:30").toISOString(),
      "2026-07-15T08:30:00.000Z"
    );
  });

  it("mañana del cambio de hora: antes y después del salto", () => {
    // 01:30 de pared aún es CET (UTC+1).
    assert.equal(
      madridWallTimeToUtc("2026-03-29", "01:30").toISOString(),
      "2026-03-29T00:30:00.000Z"
    );
    // 04:00 de pared ya es CEST (UTC+2).
    assert.equal(
      madridWallTimeToUtc("2026-03-29", "04:00").toISOString(),
      "2026-03-29T02:00:00.000Z"
    );
  });
});

describe("limitesDiaMadrid", () => {
  it("día normal: 24 horas", () => {
    const { desde, hasta } = limitesDiaMadrid("2026-06-15");
    assert.equal(desde.toISOString(), "2026-06-14T22:00:00.000Z");
    assert.equal(hasta.toISOString(), "2026-06-15T22:00:00.000Z");
    assert.equal(horasHasta(desde, hasta), 24);
  });

  it("día del salto adelante: 23 horas", () => {
    const { desde, hasta } = limitesDiaMadrid("2026-03-29");
    assert.equal(desde.toISOString(), "2026-03-28T23:00:00.000Z");
    assert.equal(hasta.toISOString(), "2026-03-29T22:00:00.000Z");
    assert.equal(horasHasta(desde, hasta), 23);
  });

  it("día del salto atrás: 25 horas", () => {
    const { desde, hasta } = limitesDiaMadrid("2026-10-25");
    assert.equal(desde.toISOString(), "2026-10-24T22:00:00.000Z");
    assert.equal(hasta.toISOString(), "2026-10-25T23:00:00.000Z");
    assert.equal(horasHasta(desde, hasta), 25);
  });
});

describe("fechaISOenMadrid", () => {
  it("limites del día natural: 21:59Z aún es el mismo día, 22:00Z ya es el siguiente", () => {
    // En verano 22:00Z = 00:00 de Madrid del día siguiente.
    assert.equal(fechaISOenMadrid(new Date("2026-07-15T21:59:00Z")), "2026-07-15");
    assert.equal(fechaISOenMadrid(new Date("2026-07-15T22:00:00Z")), "2026-07-16");
  });
});

describe("horaMadrid", () => {
  it("formatea HH:mm según Madrid (verano e invierno)", () => {
    assert.equal(horaMadrid(new Date("2026-07-15T08:30:00Z")), "10:30");
    assert.equal(horaMadrid(new Date("2026-01-15T08:30:00Z")), "09:30");
  });

  it("instante del cambio de hora: 01:00Z es 03:00 en primavera y 02:00 en otoño", () => {
    assert.equal(horaMadrid(new Date("2026-03-29T01:00:00Z")), "03:00");
    assert.equal(horaMadrid(new Date("2026-10-25T01:00:00Z")), "02:00");
  });
});

describe("fechaHoraMadrid", () => {
  // Los separadores finos dependen de la versión de ICU; no forman parte
  // del contrato.
  const limpio = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");

  it("fecha corta + hora en Madrid (es-ES corto usa año de 2 dígitos)", () => {
    assert.equal(
      limpio(fechaHoraMadrid(new Date("2026-07-15T08:30:00Z"))),
      "15/7/26, 10:30"
    );
  });

  it("respeta el locale pedido (en-GB con ceros)", () => {
    assert.equal(
      limpio(fechaHoraMadrid(new Date("2026-07-15T08:30:00Z"), "en-GB")),
      "15/07/2026, 10:30"
    );
  });
});

describe("horasHasta", () => {
  it("diferencia exacta y decimal", () => {
    const base = new Date("2026-06-01T10:00:00Z");
    assert.equal(horasHasta(base, new Date("2026-06-03T10:00:00Z")), 48);
    assert.equal(horasHasta(base, new Date("2026-06-01T11:30:00Z")), 1.5);
  });
});
