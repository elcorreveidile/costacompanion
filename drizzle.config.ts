import { defineConfig } from "drizzle-kit";

/**
 * Configuración de Drizzle Kit (migraciones).
 *   npx drizzle-kit generate  → genera SQL a partir de lib/db/schema.ts
 *   npx drizzle-kit migrate   → aplica las migraciones a la BD (requiere DATABASE_URL)
 */
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  casing: "snake_case",
});
