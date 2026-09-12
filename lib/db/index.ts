import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Cliente Drizzle sobre Neon (Postgres) mediante node-postgres.
 *
 * Usa la connection string con pooling de Neon (host `-pooler`). Solo debe
 * importarse desde código de servidor (Server Components, Server Actions,
 * Route Handlers) — nunca desde el cliente.
 *
 * Tanto el Pool como la instancia de Drizzle se crean de forma perezosa (al
 * primer uso) y se cachean en globalThis, para no agotar conexiones en
 * serverless ni exigir DATABASE_URL en tiempo de build.
 */

type DB = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __ccPool?: Pool;
  __ccDb?: DB;
};

function getDb(): DB {
  if (globalForDb.__ccDb) return globalForDb.__ccDb;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL es obligatoria para conectar con la base de datos.");
  }
  globalForDb.__ccPool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  globalForDb.__ccDb = drizzle(globalForDb.__ccPool, { schema });
  return globalForDb.__ccDb;
}

/** Instancia Drizzle perezosa: se conecta a Neon en el primer acceso. */
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
}) as DB;

export { schema };
