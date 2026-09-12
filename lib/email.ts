import { sendMail, MAIL_FROM } from '@/lib/mailer';
import { isLocale, type Locale } from '@/lib/i18n/config';
import * as S from '@/lib/email/emailStrings';

const FROM = MAIL_FROM;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://costacompanion.com';

/** Idioma del destinatario, con fallback a español. */
function loc(idioma?: string): Locale {
  return isLocale(idioma) ? idioma : 'es';
}

function html(body: string) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a2e25">
    <div style="background:#2C4A3B;padding:20px 28px;border-radius:12px 12px 0 0">
      <p style="color:#F7F4EF;margin:0;font-size:13px;font-weight:600">Costa Companion</p>
    </div>
    <div style="background:#F7F4EF;padding:28px 28px 24px;border-radius:0 0 12px 12px;border:1px solid #e2ddd6;border-top:none">
      ${body}
      <hr style="border:none;border-top:1px solid #e2ddd6;margin:24px 0 14px">
      <p style="color:#bbb;font-size:11px;margin:0">
        Costa Companion · <a href="${SITE}" style="color:#2C4A3B;text-decoration:none">${SITE}</a>
      </p>
    </div>
  </div>`;
}

function btn(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:18px;padding:11px 22px;background:#2C4A3B;color:#F7F4EF;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">${label}</a>`;
}

// ── Acceso (enlace mágico) ─────────────────────────────────────────────────────

/**
 * Correo del enlace mágico de Auth.js, con la marca Costa Companion.
 * A diferencia del resto, NO captura el error: si el envío falla, Auth.js debe
 * enterarse para mostrar el aviso al usuario.
 */
export async function emailMagicLink(opts: {
  to: string;
  url: string;
  idioma?: string;
}) {
  const t = S.magicLink[loc(opts.idioma)];
  await sendMail({
    from: FROM,
    to: [opts.to],
    subject: t.subject,
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">${t.heading}</h2>
      <p>${t.intro}</p>
      <p style="color:#555;font-size:13px">${t.security}</p>
      ${btn(t.button, opts.url)}
      <p style="color:#888;font-size:12px;word-break:break-all;margin-top:18px">
        ${t.fallback}<br>${opts.url}
      </p>
      <p style="color:#999;font-size:12px;margin-top:14px">${t.ignore}</p>
    `),
  });
}

// ── Reservas ──────────────────────────────────────────────────────────────────

export async function emailNuevaReserva(opts: {
  toEmail: string;            // email del acompañante
  clienteNombre: string;
  acompananteNombre: string;
  fechaStr: string;
  servicioNombre?: string;
  idioma?: string;            // idioma del acompañante
}) {
  const t = S.nuevaReserva[loc(opts.idioma)];
  await sendMail({
    from: FROM,
    to: [opts.toEmail],
    subject: t.subject({ acompananteNombre: opts.acompananteNombre }),
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">${t.heading}</h2>
      <p>${t.intro({ clienteNombre: opts.clienteNombre })}</p>
      <ul style="padding-left:18px;line-height:1.8">
        ${opts.servicioNombre ? `<li><strong>${t.labelServicio}</strong> ${opts.servicioNombre}</li>` : ''}
        <li><strong>${t.labelFecha}</strong> ${opts.fechaStr}</li>
      </ul>
      ${btn(t.button, `${SITE}/acompanante/reservas`)}
    `),
  }).catch(console.error);
}

export async function emailReservaConfirmada(opts: {
  toEmail: string;            // email del cliente
  clienteNombre: string;
  acompananteNombre: string;
  acompananteSlug: string;
  fechaStr: string;
  idioma?: string;            // idioma del cliente
}) {
  const t = S.reservaConfirmada[loc(opts.idioma)];
  await sendMail({
    from: FROM,
    to: [opts.toEmail],
    subject: t.subject({ acompananteNombre: opts.acompananteNombre }),
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">${t.heading}</h2>
      <p>${t.intro({ clienteNombre: opts.clienteNombre, acompananteNombre: opts.acompananteNombre })}</p>
      <ul style="padding-left:18px;line-height:1.8">
        <li><strong>${t.labelFecha}</strong> ${opts.fechaStr}</li>
      </ul>
      <p style="color:#555;font-size:13px">${t.note}</p>
      ${btn(t.button, `${SITE}/cliente/reservas`)}
    `),
  }).catch(console.error);
}

export async function emailReservaRechazada(opts: {
  toEmail: string;
  clienteNombre: string;
  acompananteNombre: string;
  acompananteSlug: string;
  fechaStr: string;
  idioma?: string;            // idioma del cliente
}) {
  const t = S.reservaRechazada[loc(opts.idioma)];
  await sendMail({
    from: FROM,
    to: [opts.toEmail],
    subject: t.subject({ acompananteNombre: opts.acompananteNombre }),
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">${t.heading}</h2>
      <p>${t.intro({ clienteNombre: opts.clienteNombre, acompananteNombre: opts.acompananteNombre, fechaStr: opts.fechaStr })}</p>
      <p style="color:#555;font-size:13px">${t.note}</p>
      ${btn(t.button, `${SITE}/directorio`)}
    `),
  }).catch(console.error);
}

// ── Solicitudes ───────────────────────────────────────────────────────────────

export async function emailNuevaSolicitud(opts: {
  toEmail: string;
  clienteNombre: string;
  acompananteNombre: string;
  descripcion: string;
  idioma?: string;            // idioma del acompañante
}) {
  const t = S.nuevaSolicitud[loc(opts.idioma)];
  await sendMail({
    from: FROM,
    to: [opts.toEmail],
    subject: t.subject({ acompananteNombre: opts.acompananteNombre }),
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">${t.heading}</h2>
      <p>${t.intro({ clienteNombre: opts.clienteNombre })}</p>
      <div style="margin:12px 0;padding:14px 16px;background:#fff;border-radius:8px;border-left:4px solid #2C4A3B;font-size:14px;color:#333;line-height:1.6">
        ${opts.descripcion}
      </div>
      ${btn(t.button, `${SITE}/acompanante/solicitudes`)}
    `),
  }).catch(console.error);
}

export async function emailSolicitudAceptada(opts: {
  toEmail: string;
  clienteNombre: string;
  acompananteNombre: string;
  acompananteSlug: string;
  precio?: number | null;
  idioma?: string;            // idioma del cliente
}) {
  const t = S.solicitudAceptada[loc(opts.idioma)];
  await sendMail({
    from: FROM,
    to: [opts.toEmail],
    subject: t.subject({ acompananteNombre: opts.acompananteNombre }),
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">${t.heading}</h2>
      <p>${t.intro({ clienteNombre: opts.clienteNombre, acompananteNombre: opts.acompananteNombre })}</p>
      ${opts.precio != null ? `<p style="font-size:18px;font-weight:600;color:#2C4A3B">${t.precio({ precio: opts.precio })}</p>` : ''}
      <p style="color:#555;font-size:13px">${t.note}</p>
      ${btn(t.button, `${SITE}/cliente/solicitudes`)}
    `),
  }).catch(console.error);
}

export async function emailSolicitudRechazada(opts: {
  toEmail: string;
  clienteNombre: string;
  acompananteNombre: string;
  idioma?: string;            // idioma del cliente
}) {
  const t = S.solicitudRechazada[loc(opts.idioma)];
  await sendMail({
    from: FROM,
    to: [opts.toEmail],
    subject: t.subject({ acompananteNombre: opts.acompananteNombre }),
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">${t.heading}</h2>
      <p>${t.intro({ clienteNombre: opts.clienteNombre, acompananteNombre: opts.acompananteNombre })}</p>
      <p style="color:#555;font-size:13px">${t.note}</p>
      ${btn(t.button, `${SITE}/directorio`)}
    `),
  }).catch(console.error);
}

// ── Mensajes (Chat interno) ───────────────────────────────────────────────────────

export async function notificarNuevoMensaje(opts: {
  receptorEmail: string;
  receptorNombre: string;
  emisorNombre: string;
  idioma?: string; // es, en, fr, de, nl, ru, uk
}) {
  const t = S.nuevoMensaje[loc(opts.idioma)];

  // La URL del chat es siempre la de la plataforma; ambos roles llegan aquí.
  const chatUrl = `${SITE}/cliente/mensajes`;

  await sendMail({
    from: FROM,
    to: [opts.receptorEmail],
    subject: t.subject,
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">${t.subject}</h2>
      <p>${t.intro({ receptorNombre: opts.receptorNombre, emisorNombre: opts.emisorNombre })}</p>
      <p style="color:#555;font-size:13px">${t.note}</p>
      ${btn(t.button, chatUrl)}
    `),
  }).catch(console.error);
}
