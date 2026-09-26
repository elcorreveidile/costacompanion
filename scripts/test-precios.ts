/**
 * Tests de lib/precios.ts — función pura, sin BD (ctx sintético).
 * Uso: npx tsx scripts/test-precios.ts
 *
 * Tarjeta de precios (Fase B):
 *   remota 39 € · hora 45 €/h (mín. 2 h) · media jornada 220 € · jornada 380 €
 *   urgencia (<48 h) +50 % · zonas: base 0, resto +15–25 €
 */

import { calcularPrecio, PrecioError, type TarifasCtx } from "../lib/precios";

const CTX: TarifasCtx = {
  tarifas: {
    remota: 3900,
    hora: 4500,
    media_jornada: 22000,
    jornada: 38000,
  },
  zonas: {
    marbella: 1500,
    estepona: 1500,
    malaga: 2000,
    sotogrande: 2500,
  },
  config: {
    urgencia_pct: 50,
    urgencia_horas_limite: 48,
    min_horas_facturables: 2,
  },
};

const AHORA = new Date("2026-03-15T10:00:00Z");

let fallos = 0;
let total = 0;

function check(nombre: string, cond: boolean, detalle?: string) {
  total++;
  if (cond) {
    console.log(`  ✓ ${nombre}`);
  } else {
    fallos++;
    console.error(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ""}`);
  }
}

function precio(
  modo: Parameters<typeof calcularPrecio>[0]["modo"],
  opts: Partial<Parameters<typeof calcularPrecio>[0]> = {}
) {
  return calcularPrecio(
    {
      modo,
      zonaKey: "marbella", // por defecto: presencial en zona base ⇒ sin recargo
      zonaBaseAcompanante: "marbella",
      fechaHora: new Date("2026-04-10T10:00:00Z"), // lejos ⇒ sin urgencia
      ahora: AHORA,
      ...opts,
    },
    CTX
  );
}

function esperaError(nombre: string, fn: () => unknown, codigo: string) {
  total++;
  try {
    fn();
    fallos++;
    console.error(`  ✗ ${nombre} — no lanzó PrecioError`);
  } catch (e) {
    if (e instanceof PrecioError && e.codigo === codigo) {
      console.log(`  ✓ ${nombre}`);
    } else {
      fallos++;
      console.error(`  ✗ ${nombre} — código inesperado:`, (e as Error).message);
    }
  }
}

console.log("\n── Remota ──");
check("remota = 39 € exactos", precio("remota").totalCents === 3900);
check("remota ignora zona", precio("remota", { zonaKey: "malaga" }).totalCents === 3900);

console.log("\n── Por horas ──");
check("2 h en zona base = 90 €", precio("horas", { horas: 2 }).totalCents === 9000);
check(
  "1 h se redondea al mínimo (2 h) = 90 €",
  precio("horas", { horas: 1 }).totalCents === 9000
);
check(
  "1 h con mínimo ⇒ horasFacturadas = 2",
  precio("horas", { horas: 1 }).horasFacturadas === 2
);
check(
  "3 h fuera con recargo Marbella ⇒ 135 € + 15 € = 150 €",
  precio("horas", { horas: 3, zonaKey: "marbella", zonaBaseAcompanante: "fuengirola" }).totalCents === 15000
);
check(
  "zona = base ⇒ sin recargo",
  precio("horas", { horas: 2, zonaKey: "marbella", zonaBaseAcompanante: "marbella" }).recargoZonaCents === 0
);
check(
  "zona = base pero zonaBase null ⇒ CON recargo",
  precio("horas", { horas: 2, zonaKey: "marbella", zonaBaseAcompanante: null }).recargoZonaCents === 1500
);
esperaError("horas 0 ⇒ horas_invalidas", () => precio("horas", { horas: 0 }), "horas_invalidas");
esperaError("horas 1.5 (no entero) ⇒ horas_invalidas", () => precio("horas", { horas: 1.5 }), "horas_invalidas");

console.log("\n── Jornadas ──");
check("media jornada = 220 €", precio("media_jornada").totalCents === 22000);
check("jornada = 380 €", precio("jornada").totalCents === 38000);
check(
  "media jornada + zona Sotogrande = 220 + 25 = 245 €",
  precio("media_jornada", { zonaKey: "sotogrande", zonaBaseAcompanante: "fuengirola" }).totalCents === 24500
);

console.log("\n── Urgencia ──");
const en24h = new Date(AHORA.getTime() + 24 * 3600 * 1000);
const en72h = new Date(AHORA.getTime() + 72 * 3600 * 1000);
const dUrgente = precio("remota", { fechaHora: en24h });
check("remota a 24 h ⇒ urgencia activa", dUrgente.urgencia === true);
check("urgencia: 39 € × 1,5 = 58,50 €", dUrgente.totalCents === 5850);
check(
  "urgencia se aplica sobre base+zona: (135+15)×1,5 = 225 €",
  precio("horas", { horas: 3, zonaKey: "marbella", zonaBaseAcompanante: "fuengirola", fechaHora: en24h }).totalCents === 22500
);
const dTranquilo = precio("remota", { fechaHora: en72h });
check("remota a 72 h ⇒ sin urgencia", dTranquilo.urgencia === false && dTranquilo.totalCents === 3900);
const enJusto48 = new Date(AHORA.getTime() + 48 * 3600 * 1000);
check(
  "exactamente a 48 h ⇒ SIN urgencia (< límite estricto)",
  precio("remota", { fechaHora: enJusto48 }).urgencia === false
);

console.log("\n── Errores de zona/modo ──");
esperaError("zona desconocida ⇒ zona_fuera_provincia", () => precio("horas", { horas: 2, zonaKey: "paris" }), "zona_fuera_provincia");
esperaError("presencial sin zona ⇒ zona_fuera_provincia", () => precio("jornada", { zonaKey: null }), "zona_fuera_provincia");
esperaError("modo inventado ⇒ modo_invalido", () => precio("semana" as never), "modo_invalido");
esperaError(
  "tarifa hora ausente del ctx ⇒ tarifa_no_configurada",
  () =>
    calcularPrecio(
      {
        modo: "horas",
        horas: 2,
        zonaKey: null,
        zonaBaseAcompanante: null,
        fechaHora: new Date("2026-04-10T10:00:00Z"),
        ahora: AHORA,
      },
      { ...CTX, tarifas: { ...CTX.tarifas, hora: undefined as unknown as number } }
    ),
  "tarifa_no_configurada"
);

console.log("\n── Desglose ──");
const d = precio("horas", { horas: 3, zonaKey: "malaga", zonaBaseAcompanante: "fuengirola", fechaHora: en24h });
check("líneas = base + zona + urgencia", d.lineas.length === 3);
check(
  "suma de líneas = total",
  d.lineas.reduce((acc, l) => acc + l.importeCents, 0) === d.totalCents
);
check("base 3 h = 135 €", d.baseCents === 13500);
check("zona Málaga = 20 €", d.recargoZonaCents === 2000);
check("urgencia = 155 € × 1,5 − 155 = 7750", d.recargoUrgenciaCents === 7750);

console.log(`\n${total - fallos}/${total} tests OK${fallos ? ` — ${fallos} FALLOS` : ""}\n`);
process.exit(fallos ? 1 : 0);
