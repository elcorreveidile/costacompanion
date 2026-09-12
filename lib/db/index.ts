import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Cliente Drizzle sobre Neon (Postgres) mediante node-postgres.
 *
 * Usa la connection string con pooling de Neon (host con sufijo `-pooler`).
 * Solo debe importarse desde código de servidor.
 *
 * Ni `new Pool(...)` ni `drizzle(...)` abren conexión: eso ocurre en la primera
 * consulta. Por eso se pueden construir aunque falte DATABASE_URL en build; las
 * consultas públicas (lib/db/queries) ya degradan a vacío en ese caso. El Pool
 * se cachea en globalThis para no agotar conexiones en serverless.
 */

const globalForDb = globalThis as unknown as { __ccPool?: Pool };

const pool =
  globalForDb.__ccPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDb.__ccPool = pool;

export const db = drizzle(pool, { schema });

export { schema };
