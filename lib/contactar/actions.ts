'use server';

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function enviarContacto(
  formData: FormData
): Promise<{ error?: string }> {
  const slug = (formData.get('slug') as string | null)?.trim();
  const nombre = (formData.get('nombre') as string | null)?.trim();
  const email = (formData.get('email') as string | null)?.trim();
  const mensaje = (formData.get('mensaje') as string | null)?.trim();

  if (!slug || !nombre || !email || !mensaje) {
    return { error: 'Todos los campos son obligatorios.' };
  }

  const supabase = await createClient();
  const { data: acomp } = await supabase
    .from('acompanantes')
    .select('nombre_publico, email_contacto')
    .eq('slug', slug)
    .eq('activo', true)
    .single() as {
      data: { nombre_publico: string; email_contacto: string | null } | null;
      error: null;
    };

  if (!acomp?.email_contacto) {
    return { error: 'No se pudo enviar el mensaje. Inténtalo de nuevo.' };
  }

  const { error } = await getResend().emails.send({
    from: 'Costa Companion <hola@costacompanion.com>',
    to: [acomp.email_contacto],
    replyTo: email,
    subject: `Nuevo contacto en tu perfil — ${acomp.nombre_publico}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a2e25">
        <div style="background:#2C4A3B;padding:24px 32px;border-radius:12px 12px 0 0">
          <p style="color:#F7F4EF;margin:0;font-size:14px">Costa Companion</p>
        </div>
        <div style="background:#F7F4EF;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2ddd6;border-top:none">
          <h2 style="margin:0 0 20px;font-size:20px">Nuevo mensaje de contacto</h2>
          <p style="margin:0 0 8px"><strong>De:</strong> ${nombre}</p>
          <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${email}" style="color:#2C4A3B">${email}</a></p>
          <div style="margin:20px 0;padding:16px;background:#fff;border-radius:8px;border-left:4px solid #2C4A3B">
            <p style="margin:0;white-space:pre-wrap">${mensaje}</p>
          </div>
          <p style="color:#888;font-size:12px;margin:24px 0 0">
            Para responder, usa el botón de respuesta de tu cliente de correo — el email irá directamente a ${email}.
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('enviarContacto Resend error:', error);
    return { error: 'No se pudo enviar el mensaje. Por favor, inténtalo más tarde.' };
  }

  return {};
}
