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
  asignadaTitle: string;
  asignadaBody: (a: { acompananteNombre: string; fechaStr: string }) => string;
  nuevaPeticionTitle: string;
  nuevaPeticionBody: (a: { tipoGestion: string; fechaStr: string }) => string;
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
    asignadaTitle: "Gestión asignada",
    asignadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} se encargará de tu gestión del ${fechaStr}. Revisa el importe y confírmala.`,
    nuevaPeticionTitle: "Nueva petición en cola",
    nuevaPeticionBody: ({ tipoGestion, fechaStr }) =>
      `Nueva petición de ${tipoGestion} para el ${fechaStr}. Revísala y acéptala si encaja.`,
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
    asignadaTitle: "Companion assigned",
    asignadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} will handle your booking on ${fechaStr}. Check the amount and confirm.`,
    nuevaPeticionTitle: "New request in the queue",
    nuevaPeticionBody: ({ tipoGestion, fechaStr }) =>
      `New ${tipoGestion} request for ${fechaStr}. Review it and accept it if it suits you.`,
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
    asignadaTitle: "Accompagnant assigné",
    asignadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} s’occupera de votre démarche le ${fechaStr}. Vérifiez le montant et confirmez.`,
    nuevaPeticionTitle: "Nouvelle demande en file d’attente",
    nuevaPeticionBody: ({ tipoGestion, fechaStr }) =>
      `Nouvelle demande de ${tipoGestion} pour le ${fechaStr}. Consultez-la et acceptez-la si elle vous convient.`,
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
    asignadaTitle: "Begleitung zugeteilt",
    asignadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} übernimmt Ihren Termin am ${fechaStr}. Prüfen Sie den Betrag und bestätigen Sie.`,
    nuevaPeticionTitle: "Neues Anliegen in der Warteschlange",
    nuevaPeticionBody: ({ tipoGestion, fechaStr }) =>
      `Neues Anliegen (${tipoGestion}) für den ${fechaStr}. Prüfen Sie es und nehmen Sie es an, wenn es passt.`,
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
    asignadaTitle: "Begeleider toegewezen",
    asignadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} zal uw afspraak op ${fechaStr} verzorgen. Bekijk het bedrag en bevestig.`,
    nuevaPeticionTitle: "Nieuwe aanvraag in de wachtrij",
    nuevaPeticionBody: ({ tipoGestion, fechaStr }) =>
      `Nieuwe aanvraag (${tipoGestion}) voor ${fechaStr}. Bekijk hem en accepteer hem als hij past.`,
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
    asignadaTitle: "Сопровождающий назначен",
    asignadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} займётся вашим делом ${fechaStr}. Проверьте сумму и подтвердите.`,
    nuevaPeticionTitle: "Новый запрос в очереди",
    nuevaPeticionBody: ({ tipoGestion, fechaStr }) =>
      `Новый запрос (${tipoGestion}) на ${fechaStr}. Просмотрите его и примите, если он вам подходит.`,
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
    asignadaTitle: "Супровідника призначено",
    asignadaBody: ({ acompananteNombre, fechaStr }) =>
      `${acompananteNombre} займеться вашою справою ${fechaStr}. Перевірте суму та підтвердьте.`,
    nuevaPeticionTitle: "Новий запит у черзі",
    nuevaPeticionBody: ({ tipoGestion, fechaStr }) =>
      `Новий запит (${tipoGestion}) на ${fechaStr}. Перегляньте його та прийміть, якщо він вам підходить.`,
  },
};
