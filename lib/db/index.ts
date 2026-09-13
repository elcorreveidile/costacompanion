import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Cliente Drizzle sobre Neon usando el driver HTTP (sin estado).
 *
 * Cada consulta es una petición HTTPS independiente: NO hay socket TCP
 * persistente. Con `node-postgres`/`pg` el pool guardaba una conexión TCP que,
 * cuando la función serverless se enfriaba tras un rato de inactividad (o Neon
 * autosuspendía el cómputo), quedaba muerta; la siguiente consulta intentaba
 * reutilizarla y fallaba (`Connection terminated`, timeout…). Eso provocaba los
 * fallos intermitentes "tras inactividad" (una navegación que no hacía nada y
 * que al recargar sí funcionaba). Con HTTP no hay conexión que envejezca, así
 * que desaparece esa clase de error. No usamos transacciones interactivas
 * (`db.transaction(...)`), así que el modo HTTP nos vale.
 *
 * `neon(url)` no abre ninguna conexión al construirse; el fetch ocurre en la
 * primera consulta. Por eso se puede construir aunque falte DATABASE_URL en
 * build: las consultas públicas (lib/db/queries) ya degradan a vacío en ese
 * caso. Le pasamos una URL de marcador cuando falta para que `neon()` no lance
 * al importarse (valida el formato de la cadena); nunca llega a usarse porque
 * `safeQuery` corta antes si no hay DATABASE_URL.
 */

const connectionString =
  process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

export { schema };
