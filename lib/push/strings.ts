import type { Locale } from "@/lib/i18n/config";

/**
 * Textos de las notificaciones push, por idioma. El payload que viaja al
 * service worker es `{ title, body, url, tag }` — ya traducido en el servidor.
 * Solo 3 disparadores en esta fase: confirmación, cancelación y recordatorio
 * de 24 h (todos dirigidos al cliente).
 */

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

type Plantillas = {
  confirmadaTitle: string;
  confirmadaBody: (a: { acompananteNombre: string; fechaStr: string }) => string;
  canceladaTitle: string;
  canceladaBody: (a: { acompananteNombre: string; fechaStr: string }) => string;
  recordatorioTitle: string;
  recordatorioBody: (a: { acompananteNombre: string; fechaStr: string }) => string;
};

export const pushStrings: Record<Locale, Plantillas> = {
  es: {
    confirmadaTitle: "Reserva confirmada",
    confirmadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} te acompañará el ${fechaStr}.`,
    canceladaTitle: "Reserva cancelada",
    canceladaBody: ({ acompananteNombre, fechaStr }) =>
      `Tu gestión con ${acompananteNombre} del ${fechaStr} se ha cancelado.`,
    recordatorioTitle: "Mañana tienes una gestión",
    recordatorioBody: ({ acompananteNombre, fechaStr }) =>
      `Recuerda: ${acompananteNombre} te acompañará el ${fechaStr}.`,
  },
  en: {
    confirmadaTitle: "Booking confirmed",
    confirmadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} will accompany you on ${fechaStr}.`,
    canceladaTitle: "Booking cancelled",
    canceladaBody: ({ acompananteNombre, fechaStr }) =>
      `Your session with ${acompananteNombre} on ${fechaStr} has been cancelled.`,
    recordatorioTitle: "Your session is tomorrow",
    recordatorioBody: ({ acompananteNombre, fechaStr }) =>
      `Reminder: ${acompananteNombre} will accompany you on ${fechaStr}.`,
  },
  fr: {
    confirmadaTitle: "Réservation confirmée",
    confirmadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} vous accompagnera le ${fechaStr}.`,
    canceladaTitle: "Réservation annulée",
    canceladaBody: ({ acompananteNombre, fechaStr }) =>
      `Votre démarche avec ${acompananteNombre} du ${fechaStr} a été annulée.`,
    recordatorioTitle: "Votre démarche est demain",
    recordatorioBody: ({ acompananteNombre, fechaStr }) =>
      `Rappel : ${acompananteNombre} vous accompagnera le ${fechaStr}.`,
  },
  de: {
    confirmadaTitle: "Buchung bestätigt",
    confirmadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} begleitet Sie am ${fechaStr}.`,
    canceladaTitle: "Buchung storniert",
    canceladaBody: ({ acompananteNombre, fechaStr }) =>
      `Ihr Termin mit ${acompananteNombre} am ${fechaStr} wurde storniert.`,
    recordatorioTitle: "Morgen ist Ihr Termin",
    recordatorioBody: ({ acompananteNombre, fechaStr }) =>
      `Erinnerung: ${acompananteNombre} begleitet Sie am ${fechaStr}.`,
  },
  nl: {
    confirmadaTitle: "Reservering bevestigd",
    confirmadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} gaat je begeleiden op ${fechaStr}.`,
    canceladaTitle: "Reservering geannuleerd",
    canceladaBody: ({ acompananteNombre, fechaStr }) =>
      `Je afspraak met ${acompananteNombre} op ${fechaStr} is geannuleerd.`,
    recordatorioTitle: "Morgen heb je een afspraak",
    recordatorioBody: ({ acompananteNombre, fechaStr }) =>
      `Herinnering: ${acompananteNombre} begeleidt je op ${fechaStr}.`,
  },
  ru: {
    confirmadaTitle: "Бронирование подтверждено",
    confirmadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} сопровождит вас ${fechaStr}.`,
    canceladaTitle: "Бронирование отменено",
    canceladaBody: ({ acompananteNombre, fechaStr }) =>
      `Ваша встреча с ${acompananteNombre} на ${fechaStr} отменена.`,
    recordatorioTitle: "Завтра у вас встреча",
    recordatorioBody: ({ acompananteNombre, fechaStr }) =>
      `Напоминание: ${acompananteNombre} сопровождит вас ${fechaStr}.`,
  },
  uk: {
    confirmadaTitle: "Бронювання підтверджено",
    confirmadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} супроводжуватиме вас ${fechaStr}.`,
    canceladaTitle: "Бронювання скасовано",
    canceladaBody: ({ acompananteNombre, fechaStr }) =>
      `Вашу зустріч із ${acompananteNombre} на ${fechaStr} скасовано.`,
    recordatorioTitle: "Завтра у вас зустріч",
    recordatorioBody: ({ acompananteNombre, fechaStr }) =>
      `Нагадування: ${acompananteNombre} супроводжуватиме вас ${fechaStr}.`,
  },
};
