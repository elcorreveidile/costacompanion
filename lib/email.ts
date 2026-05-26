import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Costa Companion <hola@costacompanion.com>';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://costacompanion.com';

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

// ── Reservas ──────────────────────────────────────────────────────────────────

export async function emailNuevaReserva(opts: {
  toEmail: string;            // email del acompañante
  clienteNombre: string;
  acompananteNombre: string;
  fechaStr: string;
  servicioNombre?: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: [opts.toEmail],
    subject: `Nueva reserva recibida — ${opts.acompananteNombre}`,
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">Nueva reserva</h2>
      <p><strong>${opts.clienteNombre}</strong> ha solicitado una cita contigo.</p>
      <ul style="padding-left:18px;line-height:1.8">
        ${opts.servicioNombre ? `<li><strong>Servicio:</strong> ${opts.servicioNombre}</li>` : ''}
        <li><strong>Fecha:</strong> ${opts.fechaStr}</li>
      </ul>
      ${btn('Ver mis reservas', `${SITE}/acompanante/reservas`)}
    `),
  }).catch(console.error);
}

export async function emailReservaConfirmada(opts: {
  toEmail: string;            // email del cliente
  clienteNombre: string;
  acompananteNombre: string;
  acompananteSlug: string;
  fechaStr: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: [opts.toEmail],
    subject: `Reserva confirmada con ${opts.acompananteNombre}`,
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">¡Reserva confirmada!</h2>
      <p>Hola ${opts.clienteNombre}, <strong>${opts.acompananteNombre}</strong> ha confirmado tu cita.</p>
      <ul style="padding-left:18px;line-height:1.8">
        <li><strong>Fecha:</strong> ${opts.fechaStr}</li>
      </ul>
      <p style="color:#555;font-size:13px">Puedes contactar directamente con el acompañante desde su perfil si necesitas coordinar algo.</p>
      ${btn('Ver mis reservas', `${SITE}/cliente/reservas`)}
    `),
  }).catch(console.error);
}

export async function emailReservaRechazada(opts: {
  toEmail: string;
  clienteNombre: string;
  acompananteNombre: string;
  acompananteSlug: string;
  fechaStr: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: [opts.toEmail],
    subject: `Reserva no disponible — ${opts.acompananteNombre}`,
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">Reserva no disponible</h2>
      <p>Hola ${opts.clienteNombre}, lamentablemente <strong>${opts.acompananteNombre}</strong> no puede atenderte en esa franja (${opts.fechaStr}).</p>
      <p style="color:#555;font-size:13px">Te animamos a ver otros horarios disponibles o explorar más acompañantes en el directorio.</p>
      ${btn('Ver directorio', `${SITE}/directorio`)}
    `),
  }).catch(console.error);
}

// ── Solicitudes ───────────────────────────────────────────────────────────────

export async function emailNuevaSolicitud(opts: {
  toEmail: string;
  clienteNombre: string;
  acompananteNombre: string;
  descripcion: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: [opts.toEmail],
    subject: `Nueva solicitud a medida — ${opts.acompananteNombre}`,
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">Nueva solicitud a medida</h2>
      <p><strong>${opts.clienteNombre}</strong> te ha enviado una solicitud:</p>
      <div style="margin:12px 0;padding:14px 16px;background:#fff;border-radius:8px;border-left:4px solid #2C4A3B;font-size:14px;color:#333;line-height:1.6">
        ${opts.descripcion}
      </div>
      ${btn('Ver solicitudes', `${SITE}/acompanante/solicitudes`)}
    `),
  }).catch(console.error);
}

export async function emailSolicitudAceptada(opts: {
  toEmail: string;
  clienteNombre: string;
  acompananteNombre: string;
  acompananteSlug: string;
  precio?: number | null;
}) {
  await resend.emails.send({
    from: FROM,
    to: [opts.toEmail],
    subject: `Tu solicitud fue aceptada — ${opts.acompananteNombre}`,
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">¡Solicitud aceptada!</h2>
      <p>Hola ${opts.clienteNombre}, <strong>${opts.acompananteNombre}</strong> ha aceptado tu solicitud.</p>
      ${opts.precio != null ? `<p style="font-size:18px;font-weight:600;color:#2C4A3B">Precio propuesto: ${opts.precio}€</p>` : ''}
      <p style="color:#555;font-size:13px">Puedes contactar al acompañante desde su perfil para coordinar los detalles.</p>
      ${btn('Ver solicitudes', `${SITE}/cliente/solicitudes`)}
    `),
  }).catch(console.error);
}

export async function emailSolicitudRechazada(opts: {
  toEmail: string;
  clienteNombre: string;
  acompananteNombre: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: [opts.toEmail],
    subject: `Solicitud no disponible — ${opts.acompananteNombre}`,
    html: html(`
      <h2 style="margin:0 0 14px;font-size:20px">Solicitud no disponible</h2>
      <p>Hola ${opts.clienteNombre}, <strong>${opts.acompananteNombre}</strong> no puede atender tu solicitud en este momento.</p>
      <p style="color:#555;font-size:13px">Puedes explorar otros acompañantes en el directorio o enviar una nueva solicitud.</p>
      ${btn('Ver directorio', `${SITE}/directorio`)}
    `),
  }).catch(console.error);
}
