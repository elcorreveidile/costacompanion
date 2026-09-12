import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/lib/db";
import {
  profiles,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { MAIL_FROM } from "@/lib/mailer";
import { emailMagicLink } from "@/lib/email";

/**
 * Motor de Auth.js completo (runtime Node): adaptador Drizzle + providers.
 * El middleware NO importa este archivo (usa auth.config.ts, edge-safe).
 */

const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: profiles,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    // Versión Node del jwt: si el login por magic link no trajo el rol en el
    // objeto `user`, lo busca en la BD (aquí sí se puede; corre en el handler,
    // no en el edge). El middleware sigue usando la versión de auth.config.ts.
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.rol = user.rol;
        if (!token.rol && user.id) {
          const rows = await db
            .select({ rol: profiles.rol })
            .from(profiles)
            .where(eq(profiles.id, user.id))
            .limit(1);
          token.rol = rows[0]?.rol;
        }
      }
      return token;
    },
  },
  providers: [
    // Enlace mágico por email, vía SMTP de Brevo.
    Nodemailer({
      server: {
        host: process.env.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com",
        port: Number(process.env.BREVO_SMTP_PORT ?? "587"),
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_KEY,
        },
      },
      from: MAIL_FROM,
      // Correo con la marca Costa Companion (sustituye a la plantilla genérica).
      async sendVerificationRequest({ identifier, url }) {
        // Idioma del destinatario si ya tiene perfil; si no, español por defecto.
        // Best-effort: el fallo del lookup no debe impedir el envío del enlace.
        let idioma: string | undefined;
        try {
          const [p] = await db
            .select({ idioma: profiles.idiomaPreferido })
            .from(profiles)
            .where(eq(profiles.email, identifier))
            .limit(1);
          idioma = p?.idioma ?? undefined;
        } catch (e) {
          console.error("magic link idioma lookup:", e);
        }
        // emailMagicLink NO captura el error: si el envío falla, Auth.js se entera.
        await emailMagicLink({ to: identifier, url, idioma });
      },
    }),
    // Número de usuario + PIN (solo acompañantes y admin), con bloqueo.
    Credentials({
      id: "pin",
      name: "PIN",
      credentials: {
        numeroUsuario: { label: "Número de usuario", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        const numeroUsuario = String(credentials?.numeroUsuario ?? "").trim();
        const pin = String(credentials?.pin ?? "");
        if (!numeroUsuario || !pin) return null;

        const rows = await db
          .select()
          .from(profiles)
          .where(eq(profiles.numeroUsuario, numeroUsuario))
          .limit(1);
        const user = rows[0];
        if (!user || !user.pinHash) return null;

        // Solo acompañantes y admin pueden entrar por PIN.
        if (user.rol !== "acompanante" && user.rol !== "superadmin") return null;

        // Bloqueado por intentos fallidos.
        if (user.pinBloqueadoHasta && user.pinBloqueadoHasta > new Date()) {
          return null;
        }

        const ok = await bcrypt.compare(pin, user.pinHash);
        if (!ok) {
          const intentos = (user.pinIntentos ?? 0) + 1;
          const bloqueo = intentos >= MAX_INTENTOS;
          await db
            .update(profiles)
            .set({
              pinIntentos: intentos,
              pinBloqueadoHasta: bloqueo
                ? new Date(Date.now() + BLOQUEO_MIN * 60_000)
                : null,
            })
            .where(eq(profiles.id, user.id));
          return null;
        }

        // Éxito: reinicia el contador de intentos.
        await db
          .update(profiles)
          .set({ pinIntentos: 0, pinBloqueadoHasta: null })
          .where(eq(profiles.id, user.id));

        return {
          id: user.id,
          name: user.name ?? user.nombre ?? null,
          email: user.email,
          rol: user.rol,
        };
      },
    }),
  ],
});
