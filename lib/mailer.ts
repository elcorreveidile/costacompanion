import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transporte de correo transaccional vía SMTP de Brevo.
 *
 * Usa un único juego de credenciales SMTP (las mismas que se configuran en
 * Supabase Auth para el enlace mágico), de modo que TODO el correo saliente
 * de la app pasa por Brevo.
 *
 * Variables de entorno:
 *   BREVO_SMTP_HOST  (opcional, por defecto smtp-relay.brevo.com)
 *   BREVO_SMTP_PORT  (opcional, por defecto 587 — STARTTLS; 465 = SSL)
 *   BREVO_SMTP_USER  (login SMTP de Brevo — obligatoria)
 *   BREVO_SMTP_KEY   (clave/master password SMTP de Brevo — obligatoria)
 *   EMAIL_FROM       (opcional, remitente por defecto)
 *
 * Solo debe importarse desde código de servidor ('use server' o app/api).
 */

let cached: Transporter | null = null;

function getTransporter(): Transporter {
  if (cached) return cached;

  const host = process.env.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com";
  const port = Number(process.env.BREVO_SMTP_PORT ?? "587");
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_KEY;

  if (!user || !pass) {
    throw new Error(
      "BREVO_SMTP_USER y BREVO_SMTP_KEY son obligatorias para enviar correo."
    );
  }

  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL directo; 587 = STARTTLS
    auth: { user, pass },
  });

  return cached;
}

/** Remitente por defecto de los correos de la app. */
export const MAIL_FROM =
  process.env.EMAIL_FROM ?? "Costa Companion <hola@costacompanion.com>";

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

/**
 * Envía un correo por SMTP de Brevo. Lanza si el envío falla; quien llama
 * decide si propagar el error o solo registrarlo (.catch).
 */
export async function sendMail(opts: SendMailOptions) {
  return getTransporter().sendMail({
    from: opts.from ?? MAIL_FROM,
    to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
  });
}
