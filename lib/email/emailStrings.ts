import "server-only";
import type { Locale } from "@/lib/i18n/config";

/**
 * Cadenas traducibles de los 8 correos transaccionales, por idioma.
 *
 * Cada correo expone un objeto con su `subject` y los fragmentos de cuerpo
 * (encabezados, frases, etiquetas, texto del botón). Los fragmentos con
 * interpolación son funciones que reciben los datos como argumento; el resto
 * son cadenas fijas. Se traduce a los 7 idiomas soportados (es, en, fr, de,
 * nl, ru, uk). Convenciones: alemán formal ("Sie"), neerlandés informal ("je").
 *
 * `Costa Companion`, las URLs y los importes en euros se mantienen sin cambios.
 */

// ── Formas por correo ──────────────────────────────────────────────────────

export interface MagicLinkStrings {
  subject: string;
  heading: string;
  intro: string;
  security: string;
  button: string;
  fallback: string; // "¿No funciona el botón? Copia y pega este enlace…"
  ignore: string;
}

export interface NuevaReservaStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: { clienteNombre: string }) => string;
  labelServicio: string;
  labelFecha: string;
  button: string;
}

export interface ReservaConfirmadaStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: { clienteNombre: string; acompananteNombre: string }) => string;
  labelFecha: string;
  labelImporte: string;
  note: string;
  button: string;
}

export interface ReservaCanceladaStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: { clienteNombre: string; acompananteNombre: string; fechaStr: string }) => string;
  labelFecha: string;
  labelReembolso: string;
  note: string;
  button: string;
}

export interface ReservaRechazadaStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: {
    clienteNombre: string;
    acompananteNombre: string;
    fechaStr: string;
  }) => string;
  note: string;
  button: string;
}

export interface NuevaSolicitudStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: { clienteNombre: string }) => string;
  button: string;
}

export interface SolicitudAceptadaStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: { clienteNombre: string; acompananteNombre: string }) => string;
  precio: (a: { precio: number }) => string;
  note: string;
  button: string;
}

export interface SolicitudRechazadaStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: { clienteNombre: string; acompananteNombre: string }) => string;
  note: string;
  button: string;
}

export interface NuevoMensajeStrings {
  subject: string;
  intro: (a: { receptorNombre: string; emisorNombre: string }) => string;
  note: string;
  button: string;
}

export interface RecordatorioStrings {
  subject: string;
  heading: string;
  intro: (a: { clienteNombre: string; acompananteNombre: string; fechaStr: string }) => string;
  note: string;
  button: string;
}

// ── Correo de acceso (enlace mágico) ────────────────────────────────────────

export const magicLink: Record<Locale, MagicLinkStrings> = {
  es: {
    subject: "Tu acceso a Costa Companion",
    heading: "Tu enlace de acceso",
    intro: "Pulsa el botón para entrar en tu cuenta de Costa Companion.",
    security:
      "Por seguridad, el enlace caduca en unos minutos y solo puede usarse una vez.",
    button: "Iniciar sesión",
    fallback:
      "¿No funciona el botón? Copia y pega este enlace en tu navegador:",
    ignore: "Si no has solicitado acceder, ignora este correo.",
  },
  en: {
    subject: "Your access to Costa Companion",
    heading: "Your access link",
    intro: "Click the button to sign in to your Costa Companion account.",
    security:
      "For security, the link expires in a few minutes and can only be used once.",
    button: "Sign in",
    fallback:
      "Button not working? Copy and paste this link into your browser:",
    ignore: "If you didn't request access, please ignore this email.",
  },
  fr: {
    subject: "Votre accès à Costa Companion",
    heading: "Votre lien d’accès",
    intro:
      "Cliquez sur le bouton pour vous connecter à votre compte Costa Companion.",
    security:
      "Pour votre sécurité, le lien expire dans quelques minutes et ne peut être utilisé qu’une seule fois.",
    button: "Se connecter",
    fallback:
      "Le bouton ne fonctionne pas ? Copiez et collez ce lien dans votre navigateur :",
    ignore:
      "Si vous n’avez pas demandé cet accès, ignorez cet e-mail.",
  },
  de: {
    subject: "Ihr Zugang zu Costa Companion",
    heading: "Ihr Zugangslink",
    intro:
      "Klicken Sie auf die Schaltfläche, um sich bei Ihrem Costa-Companion-Konto anzumelden.",
    security:
      "Aus Sicherheitsgründen läuft der Link in wenigen Minuten ab und kann nur einmal verwendet werden.",
    button: "Anmelden",
    fallback:
      "Funktioniert die Schaltfläche nicht? Kopieren Sie diesen Link und fügen Sie ihn in Ihren Browser ein:",
    ignore:
      "Wenn Sie keinen Zugang angefordert haben, ignorieren Sie diese E-Mail.",
  },
  nl: {
    subject: "Jouw toegang tot Costa Companion",
    heading: "Jouw inloglink",
    intro: "Klik op de knop om in te loggen op je Costa Companion-account.",
    security:
      "Voor je veiligheid verloopt de link na een paar minuten en kan hij maar één keer worden gebruikt.",
    button: "Inloggen",
    fallback:
      "Werkt de knop niet? Kopieer en plak deze link in je browser:",
    ignore:
      "Heb je geen toegang aangevraagd? Negeer dan deze e-mail.",
  },
  ru: {
    subject: "Ваш доступ к Costa Companion",
    heading: "Ваша ссылка для входа",
    intro: "Нажмите кнопку, чтобы войти в свой аккаунт Costa Companion.",
    security:
      "В целях безопасности ссылка действует несколько минут и может быть использована только один раз.",
    button: "Войти",
    fallback:
      "Кнопка не работает? Скопируйте и вставьте эту ссылку в браузер:",
    ignore: "Если вы не запрашивали доступ, проигнорируйте это письмо.",
  },
  uk: {
    subject: "Ваш доступ до Costa Companion",
    heading: "Ваше посилання для входу",
    intro:
      "Натисніть кнопку, щоб увійти до свого облікового запису Costa Companion.",
    security:
      "З міркувань безпеки посилання діє кілька хвилин і може бути використане лише один раз.",
    button: "Увійти",
    fallback:
      "Кнопка не працює? Скопіюйте та вставте це посилання у ваш браузер:",
    ignore: "Якщо ви не запитували доступ, проігноруйте цей лист.",
  },
};

// ── Reserva: nueva (al acompañante) ─────────────────────────────────────────

export const nuevaReserva: Record<Locale, NuevaReservaStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Nueva reserva recibida — ${acompananteNombre}`,
    heading: "Nueva reserva",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> ha solicitado una cita contigo.`,
    labelServicio: "Servicio:",
    labelFecha: "Fecha:",
    button: "Ver mis reservas",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `New booking received — ${acompananteNombre}`,
    heading: "New booking",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> has requested an appointment with you.`,
    labelServicio: "Service:",
    labelFecha: "Date:",
    button: "View my bookings",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Nouvelle réservation reçue — ${acompananteNombre}`,
    heading: "Nouvelle réservation",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> a demandé un rendez-vous avec vous.`,
    labelServicio: "Service :",
    labelFecha: "Date :",
    button: "Voir mes réservations",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Neue Buchung erhalten — ${acompananteNombre}`,
    heading: "Neue Buchung",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> hat einen Termin mit Ihnen angefragt.`,
    labelServicio: "Leistung:",
    labelFecha: "Datum:",
    button: "Meine Buchungen ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Nieuwe boeking ontvangen — ${acompananteNombre}`,
    heading: "Nieuwe boeking",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> heeft een afspraak met je aangevraagd.`,
    labelServicio: "Dienst:",
    labelFecha: "Datum:",
    button: "Mijn boekingen bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Получено новое бронирование — ${acompananteNombre}`,
    heading: "Новое бронирование",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> запросил(а) встречу с вами.`,
    labelServicio: "Услуга:",
    labelFecha: "Дата:",
    button: "Мои бронирования",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Отримано нове бронювання — ${acompananteNombre}`,
    heading: "Нове бронювання",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> надіслав(ла) запит на зустріч з вами.`,
    labelServicio: "Послуга:",
    labelFecha: "Дата:",
    button: "Мої бронювання",
  },
};

// ── Reserva: confirmada (al cliente) ────────────────────────────────────────

export const reservaConfirmada: Record<Locale, ReservaConfirmadaStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Reserva confirmada con ${acompananteNombre}`,
    heading: "¡Reserva confirmada!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hola ${clienteNombre}, <strong>${acompananteNombre}</strong> ha confirmado tu cita.`,
    labelFecha: "Fecha:",
    labelImporte: "Importe pagado:",
    note: "Puedes contactar directamente con el acompañante lingüístico desde su perfil si necesitas coordinar algo.",
    button: "Ver mis reservas",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Booking confirmed with ${acompananteNombre}`,
    heading: "Booking confirmed!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hi ${clienteNombre}, <strong>${acompananteNombre}</strong> has confirmed your appointment.`,
    labelFecha: "Date:",
    labelImporte: "Amount paid:",
    note: "You can contact the language companion directly from their profile if you need to coordinate anything.",
    button: "View my bookings",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Réservation confirmée avec ${acompananteNombre}`,
    heading: "Réservation confirmée !",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Bonjour ${clienteNombre}, <strong>${acompananteNombre}</strong> a confirmé votre rendez-vous.`,
    labelFecha: "Date :",
    labelImporte: "Montant payé :",
    note: "Vous pouvez contacter directement l’accompagnant depuis son profil si vous devez coordonner quelque chose.",
    button: "Voir mes réservations",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Buchung bestätigt mit ${acompananteNombre}`,
    heading: "Buchung bestätigt!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hallo ${clienteNombre}, <strong>${acompananteNombre}</strong> hat Ihren Termin bestätigt.`,
    labelFecha: "Datum:",
    labelImporte: "Bezahlter Betrag:",
    note: "Sie können die Begleitperson bei Bedarf direkt über ihr Profil kontaktieren, um Details abzustimmen.",
    button: "Meine Buchungen ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Boeking bevestigd met ${acompananteNombre}`,
    heading: "Boeking bevestigd!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hoi ${clienteNombre}, <strong>${acompananteNombre}</strong> heeft je afspraak bevestigd.`,
    labelFecha: "Datum:",
    labelImporte: "Betaald bedrag:",
    note: "Je kunt de taalbegeleider rechtstreeks via zijn of haar profiel contacteren als je iets wilt afstemmen.",
    button: "Mijn boekingen bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Бронирование подтверждено с ${acompananteNombre}`,
    heading: "Бронирование подтверждено!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Здравствуйте, ${clienteNombre}! <strong>${acompananteNombre}</strong> подтвердил(а) вашу встречу.`,
    labelFecha: "Дата:",
    labelImporte: "Оплаченная сумма:",
    note: "Вы можете связаться с языковым сопровождающим напрямую через его профиль, если нужно что-то согласовать.",
    button: "Мои бронирования",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Бронювання підтверджено з ${acompananteNombre}`,
    heading: "Бронювання підтверджено!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Вітаємо, ${clienteNombre}! <strong>${acompananteNombre}</strong> підтвердив(ла) вашу зустріч.`,
    labelFecha: "Дата:",
    labelImporte: "Сплачена сума:",
    note: "Ви можете зв’язатися з мовним супровідником безпосередньо через його профіль, якщо потрібно щось узгодити.",
    button: "Мої бронювання",
  },
};

// ── Reserva: cancelada (al cliente) ─────────────────────────────────────────

export const reservaCancelada: Record<Locale, ReservaCanceladaStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Reserva cancelada — ${acompananteNombre}`,
    heading: "Reserva cancelada",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hola ${clienteNombre}, tu cita con <strong>${acompananteNombre}</strong> del ${fechaStr} ha quedado cancelada.`,
    labelFecha: "Fecha:",
    labelReembolso: "Importe reembolsado:",
    note: "Según la política de cancelación: más de 48 h de antelación, reembolso completo; entre 48 y 24 h, 50 %; con menos de 24 h o en caso de no presentarse, sin reembolso.",
    button: "Ver mis reservas",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Booking cancelled — ${acompananteNombre}`,
    heading: "Booking cancelled",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hi ${clienteNombre}, your appointment with <strong>${acompananteNombre}</strong> on ${fechaStr} has been cancelled.`,
    labelFecha: "Date:",
    labelReembolso: "Amount refunded:",
    note: "Cancellation policy: more than 48 h in advance, full refund; between 48 and 24 h, 50 %; less than 24 h or no-show, no refund.",
    button: "View my bookings",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Réservation annulée — ${acompananteNombre}`,
    heading: "Réservation annulée",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Bonjour ${clienteNombre}, votre rendez-vous avec <strong>${acompananteNombre}</strong> du ${fechaStr} a été annulé.`,
    labelFecha: "Date :",
    labelReembolso: "Montant remboursé :",
    note: "Politique d’annulation : plus de 48 h à l’avance, remboursement intégral ; entre 48 et 24 h, 50 % ; moins de 24 h ou absence, aucun remboursement.",
    button: "Voir mes réservations",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Buchung storniert — ${acompananteNombre}`,
    heading: "Buchung storniert",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hallo ${clienteNombre}, Ihr Termin mit <strong>${acompananteNombre}</strong> am ${fechaStr} wurde storniert.`,
    labelFecha: "Datum:",
    labelReembolso: "Erstatteter Betrag:",
    note: "Stornierungsrichtlinie: mehr als 48 Std. im Voraus, volle Erstattung; zwischen 48 und 24 Std., 50 %; weniger als 24 Std. oder Nichterscheinen, keine Erstattung.",
    button: "Meine Buchungen ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Boeking geannuleerd — ${acompananteNombre}`,
    heading: "Boeking geannuleerd",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hoi ${clienteNombre}, je afspraak met <strong>${acompananteNombre}</strong> op ${fechaStr} is geannuleerd.`,
    labelFecha: "Datum:",
    labelReembolso: "Terugbetaald bedrag:",
    note: "Annuleringsbeleid: meer dan 48 uur vooraf, volledige terugbetaling; tussen 48 en 24 uur, 50 %; minder dan 24 uur of no-show, geen terugbetaling.",
    button: "Mijn boekingen bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Бронирование отменено — ${acompananteNombre}`,
    heading: "Бронирование отменено",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Здравствуйте, ${clienteNombre}! Ваша встреча с <strong>${acompananteNombre}</strong> на ${fechaStr} отменена.`,
    labelFecha: "Дата:",
    labelReembolso: "Возвращённая сумма:",
    note: "Политика отмены: более чем за 48 часов — полный возврат; от 48 до 24 часов — 50 %; менее чем за 24 часа или при неявке — без возврата.",
    button: "Мои бронирования",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Бронювання скасовано — ${acompananteNombre}`,
    heading: "Бронювання скасовано",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Вітаємо, ${clienteNombre}! Вашу зустріч із <strong>${acompananteNombre}</strong> на ${fechaStr} скасовано.`,
    labelFecha: "Дата:",
    labelReembolso: "Повернута сума:",
    note: "Політика скасування: понад 48 годин заздалегідь — повне повернення; від 48 до 24 годин — 50 %; менш ніж за 24 години або при неявці — без повернення.",
    button: "Мої бронювання",
  },
};

// ── Reserva: rechazada (al cliente) ─────────────────────────────────────────

export const reservaRechazada: Record<Locale, ReservaRechazadaStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Reserva no disponible — ${acompananteNombre}`,
    heading: "Reserva no disponible",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hola ${clienteNombre}, lamentablemente <strong>${acompananteNombre}</strong> no puede atenderte en esa franja (${fechaStr}).`,
    note: "Te animamos a ver otros horarios disponibles o explorar más acompañantes lingüísticos en el directorio.",
    button: "Ver directorio",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Booking unavailable — ${acompananteNombre}`,
    heading: "Booking unavailable",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hi ${clienteNombre}, unfortunately <strong>${acompananteNombre}</strong> can't take you at that time (${fechaStr}).`,
    note: "We encourage you to check other available times or explore more language companions in the directory.",
    button: "Browse the directory",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Réservation indisponible — ${acompananteNombre}`,
    heading: "Réservation indisponible",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Bonjour ${clienteNombre}, malheureusement <strong>${acompananteNombre}</strong> n’est pas disponible sur ce créneau (${fechaStr}).`,
    note: "Nous vous invitons à consulter d’autres horaires disponibles ou à explorer d’autres accompagnants dans l’annuaire.",
    button: "Voir l’annuaire",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Buchung nicht verfügbar — ${acompananteNombre}`,
    heading: "Buchung nicht verfügbar",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hallo ${clienteNombre}, leider kann <strong>${acompananteNombre}</strong> Sie zu diesem Zeitpunkt nicht empfangen (${fechaStr}).`,
    note: "Wir empfehlen Ihnen, andere verfügbare Zeiten zu prüfen oder weitere Begleitpersonen im Verzeichnis zu entdecken.",
    button: "Verzeichnis ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Boeking niet beschikbaar — ${acompananteNombre}`,
    heading: "Boeking niet beschikbaar",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hoi ${clienteNombre}, helaas kan <strong>${acompananteNombre}</strong> je op dat tijdstip niet ontvangen (${fechaStr}).`,
    note: "We raden je aan om andere beschikbare tijden te bekijken of meer taalbegeleiders in de gids te ontdekken.",
    button: "Gids bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Бронирование недоступно — ${acompananteNombre}`,
    heading: "Бронирование недоступно",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Здравствуйте, ${clienteNombre}! К сожалению, <strong>${acompananteNombre}</strong> не может принять вас в это время (${fechaStr}).`,
    note: "Рекомендуем посмотреть другое доступное время или найти других языковых сопровождающих в каталоге.",
    button: "Открыть каталог",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Бронювання недоступне — ${acompananteNombre}`,
    heading: "Бронювання недоступне",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Вітаємо, ${clienteNombre}! На жаль, <strong>${acompananteNombre}</strong> не може прийняти вас у цей час (${fechaStr}).`,
    note: "Радимо переглянути інший доступний час або знайти інших мовних супровідників у каталозі.",
    button: "Відкрити каталог",
  },
};

// ── Solicitud: nueva (al acompañante) ───────────────────────────────────────

export const nuevaSolicitud: Record<Locale, NuevaSolicitudStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Nueva solicitud a medida — ${acompananteNombre}`,
    heading: "Nueva solicitud a medida",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> te ha enviado una solicitud:`,
    button: "Ver solicitudes",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `New custom request — ${acompananteNombre}`,
    heading: "New custom request",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> has sent you a request:`,
    button: "View requests",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Nouvelle demande sur mesure — ${acompananteNombre}`,
    heading: "Nouvelle demande sur mesure",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> vous a envoyé une demande :`,
    button: "Voir les demandes",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Neue individuelle Anfrage — ${acompananteNombre}`,
    heading: "Neue individuelle Anfrage",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> hat Ihnen eine Anfrage gesendet:`,
    button: "Anfragen ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Nieuw verzoek op maat — ${acompananteNombre}`,
    heading: "Nieuw verzoek op maat",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> heeft je een verzoek gestuurd:`,
    button: "Verzoeken bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Новый индивидуальный запрос — ${acompananteNombre}`,
    heading: "Новый индивидуальный запрос",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> отправил(а) вам запрос:`,
    button: "Посмотреть запросы",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Новий індивідуальний запит — ${acompananteNombre}`,
    heading: "Новий індивідуальний запит",
    intro: ({ clienteNombre }) =>
      `<strong>${clienteNombre}</strong> надіслав(ла) вам запит:`,
    button: "Переглянути запити",
  },
};

// ── Solicitud: aceptada (al cliente) ────────────────────────────────────────

export const solicitudAceptada: Record<Locale, SolicitudAceptadaStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Tu solicitud fue aceptada — ${acompananteNombre}`,
    heading: "¡Solicitud aceptada!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hola ${clienteNombre}, <strong>${acompananteNombre}</strong> ha aceptado tu solicitud.`,
    precio: ({ precio }) => `Precio propuesto: ${precio}€`,
    note: "Puedes contactar al acompañante lingüístico desde su perfil para coordinar los detalles.",
    button: "Ver solicitudes",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Your request was accepted — ${acompananteNombre}`,
    heading: "Request accepted!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hi ${clienteNombre}, <strong>${acompananteNombre}</strong> has accepted your request.`,
    precio: ({ precio }) => `Proposed price: ${precio}€`,
    note: "You can contact the language companion from their profile to arrange the details.",
    button: "View requests",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Votre demande a été acceptée — ${acompananteNombre}`,
    heading: "Demande acceptée !",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Bonjour ${clienteNombre}, <strong>${acompananteNombre}</strong> a accepté votre demande.`,
    precio: ({ precio }) => `Prix proposé : ${precio} €`,
    note: "Vous pouvez contacter l’accompagnant depuis son profil pour organiser les détails.",
    button: "Voir les demandes",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Ihre Anfrage wurde angenommen — ${acompananteNombre}`,
    heading: "Anfrage angenommen!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hallo ${clienteNombre}, <strong>${acompananteNombre}</strong> hat Ihre Anfrage angenommen.`,
    precio: ({ precio }) => `Vorgeschlagener Preis: ${precio} €`,
    note: "Sie können die Begleitperson über ihr Profil kontaktieren, um die Einzelheiten abzustimmen.",
    button: "Anfragen ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Je verzoek is geaccepteerd — ${acompananteNombre}`,
    heading: "Verzoek geaccepteerd!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hoi ${clienteNombre}, <strong>${acompananteNombre}</strong> heeft je verzoek geaccepteerd.`,
    precio: ({ precio }) => `Voorgestelde prijs: € ${precio}`,
    note: "Je kunt de taalbegeleider via zijn of haar profiel contacteren om de details af te stemmen.",
    button: "Verzoeken bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Ваш запрос принят — ${acompananteNombre}`,
    heading: "Запрос принят!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Здравствуйте, ${clienteNombre}! <strong>${acompananteNombre}</strong> принял(а) ваш запрос.`,
    precio: ({ precio }) => `Предложенная цена: ${precio} €`,
    note: "Вы можете связаться с языковым сопровождающим через его профиль, чтобы согласовать детали.",
    button: "Посмотреть запросы",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Ваш запит прийнято — ${acompananteNombre}`,
    heading: "Запит прийнято!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Вітаємо, ${clienteNombre}! <strong>${acompananteNombre}</strong> прийняв(ла) ваш запит.`,
    precio: ({ precio }) => `Запропонована ціна: ${precio} €`,
    note: "Ви можете зв’язатися з мовним супровідником через його профіль, щоб узгодити деталі.",
    button: "Переглянути запити",
  },
};

// ── Solicitud: rechazada (al cliente) ───────────────────────────────────────

export const solicitudRechazada: Record<Locale, SolicitudRechazadaStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Solicitud no disponible — ${acompananteNombre}`,
    heading: "Solicitud no disponible",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hola ${clienteNombre}, <strong>${acompananteNombre}</strong> no puede atender tu solicitud en este momento.`,
    note: "Puedes explorar otros acompañantes lingüísticos en el directorio o enviar una nueva solicitud.",
    button: "Ver directorio",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Request unavailable — ${acompananteNombre}`,
    heading: "Request unavailable",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hi ${clienteNombre}, <strong>${acompananteNombre}</strong> can't take on your request at the moment.`,
    note: "You can explore other language companions in the directory or send a new request.",
    button: "Browse the directory",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Demande indisponible — ${acompananteNombre}`,
    heading: "Demande indisponible",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Bonjour ${clienteNombre}, <strong>${acompananteNombre}</strong> ne peut pas traiter votre demande pour le moment.`,
    note: "Vous pouvez explorer d’autres accompagnants dans l’annuaire ou envoyer une nouvelle demande.",
    button: "Voir l’annuaire",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Anfrage nicht verfügbar — ${acompananteNombre}`,
    heading: "Anfrage nicht verfügbar",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hallo ${clienteNombre}, <strong>${acompananteNombre}</strong> kann Ihre Anfrage derzeit nicht bearbeiten.`,
    note: "Sie können weitere Begleitpersonen im Verzeichnis entdecken oder eine neue Anfrage senden.",
    button: "Verzeichnis ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Verzoek niet beschikbaar — ${acompananteNombre}`,
    heading: "Verzoek niet beschikbaar",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hoi ${clienteNombre}, <strong>${acompananteNombre}</strong> kan je verzoek op dit moment niet behandelen.`,
    note: "Je kunt andere taalbegeleiders in de gids ontdekken of een nieuw verzoek sturen.",
    button: "Gids bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Запрос недоступен — ${acompananteNombre}`,
    heading: "Запрос недоступен",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Здравствуйте, ${clienteNombre}! <strong>${acompananteNombre}</strong> сейчас не может обработать ваш запрос.`,
    note: "Вы можете найти других языковых сопровождающих в каталоге или отправить новый запрос.",
    button: "Открыть каталог",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Запит недоступний — ${acompananteNombre}`,
    heading: "Запит недоступний",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Вітаємо, ${clienteNombre}! <strong>${acompananteNombre}</strong> наразі не може обробити ваш запит.`,
    note: "Ви можете знайти інших мовних супровідників у каталозі або надіслати новий запит.",
    button: "Відкрити каталог",
  },
};

// ── Mensaje: nuevo (al receptor del chat interno) ───────────────────────────

export const nuevoMensaje: Record<Locale, NuevoMensajeStrings> = {
  es: {
    subject: "Nuevo mensaje recibido",
    intro: ({ receptorNombre, emisorNombre }) =>
      `Hola ${receptorNombre}, tienes un nuevo mensaje de <strong>${emisorNombre}</strong> en Costa Companion.`,
    note: "Accede a la plataforma para leerlo y responder.",
    button: "Ver mensaje",
  },
  en: {
    subject: "New message received",
    intro: ({ receptorNombre, emisorNombre }) =>
      `Hi ${receptorNombre}, you have a new message from <strong>${emisorNombre}</strong> on Costa Companion.`,
    note: "Sign in to the platform to read and reply.",
    button: "View message",
  },
  fr: {
    subject: "Nouveau message reçu",
    intro: ({ receptorNombre, emisorNombre }) =>
      `Bonjour ${receptorNombre}, vous avez un nouveau message de <strong>${emisorNombre}</strong> sur Costa Companion.`,
    note: "Connectez-vous à la plateforme pour le lire et y répondre.",
    button: "Voir le message",
  },
  de: {
    subject: "Neue Nachricht erhalten",
    intro: ({ receptorNombre, emisorNombre }) =>
      `Hallo ${receptorNombre}, Sie haben eine neue Nachricht von <strong>${emisorNombre}</strong> auf Costa Companion.`,
    note: "Melden Sie sich auf der Plattform an, um sie zu lesen und zu beantworten.",
    button: "Nachricht anzeigen",
  },
  nl: {
    subject: "Nieuw bericht ontvangen",
    intro: ({ receptorNombre, emisorNombre }) =>
      `Hoi ${receptorNombre}, je hebt een nieuw bericht van <strong>${emisorNombre}</strong> op Costa Companion.`,
    note: "Log in op het platform om het te lezen en te beantwoorden.",
    button: "Bericht bekijken",
  },
  ru: {
    subject: "Получено новое сообщение",
    intro: ({ receptorNombre, emisorNombre }) =>
      `Здравствуйте, ${receptorNombre}! У вас новое сообщение от <strong>${emisorNombre}</strong> в Costa Companion.`,
    note: "Войдите на платформу, чтобы прочитать и ответить.",
    button: "Посмотреть сообщение",
  },
  uk: {
    subject: "Отримано нове повідомлення",
    intro: ({ receptorNombre, emisorNombre }) =>
      `Вітаємо, ${receptorNombre}! У вас нове повідомлення від <strong>${emisorNombre}</strong> у Costa Companion.`,
    note: "Увійдіть на платформу, щоб прочитати та відповісти.",
    button: "Переглянути повідомлення",
  },
};

// ── Correo: recordatorio de gestión (24 h antes, cron horario) ──────────────

export const recordatorio: Record<Locale, RecordatorioStrings> = {
  es: {
    subject: "Mañana tienes tu gestión con Costa Companion",
    heading: "Tu gestión es mañana",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hola ${clienteNombre}, te recordamos que <strong>${acompananteNombre}</strong> te acompañará el <strong>${fechaStr}</strong>.`,
    note: "Puedes consultar los detalles, el enlace de videollamada y tus documentos desde tus reservas.",
    button: "Ver mis reservas",
  },
  en: {
    subject: "Your Costa Companion session is tomorrow",
    heading: "Your session is tomorrow",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hi ${clienteNombre}, a reminder that <strong>${acompananteNombre}</strong> will accompany you on <strong>${fechaStr}</strong>.`,
    note: "You can check the details, the video call link and your documents from your bookings.",
    button: "View my bookings",
  },
  fr: {
    subject: "Votre démarche Costa Companion est demain",
    heading: "Votre démarche est demain",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Bonjour ${clienteNombre}, rappel : <strong>${acompananteNombre}</strong> vous accompagnera le <strong>${fechaStr}</strong>.`,
    note: "Vous pouvez consulter les détails, le lien de visioconférence et vos documents depuis vos réservations.",
    button: "Voir mes réservations",
  },
  de: {
    subject: "Morgen ist Ihr Costa Companion Termin",
    heading: "Ihr Termin ist morgen",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hallo ${clienteNombre}, wir erinnern Sie daran, dass <strong>${acompananteNombre}</strong> Sie am <strong>${fechaStr}</strong> begleitet.`,
    note: "Details, den Videocall-Link und Ihre Dokumente finden Sie unter Ihren Buchungen.",
    button: "Meine Buchungen ansehen",
  },
  nl: {
    subject: "Morgen is je afspraak met Costa Companion",
    heading: "Je afspraak is morgen",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hoi ${clienteNombre}, herinnering: <strong>${acompananteNombre}</strong> begeleidt je op <strong>${fechaStr}</strong>.`,
    note: "Je kunt de details, de videobel-link en je documenten bekijken bij je reserveringen.",
    button: "Mijn reserveringen bekijken",
  },
  ru: {
    subject: "Завтра ваша встреча с Costa Companion",
    heading: "Ваша встреча — завтра",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Здравствуйте, ${clienteNombre}! Напоминаем: <strong>${acompananteNombre}</strong> сопровождит вас <strong>${fechaStr}</strong>.`,
    note: "Детали, ссылку на видеозвонок и документы можно посмотреть в ваших бронированиях.",
    button: "Мои бронирования",
  },
  uk: {
    subject: "Завтра ваша зустріч із Costa Companion",
    heading: "Ваша зустріч — завтра",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Вітаємо, ${clienteNombre}! Нагадуємо: <strong>${acompananteNombre}</strong> супроводжуватиме вас <strong>${fechaStr}</strong>.`,
    note: "Деталі, посилання на відеозв'язок і документи можна переглянути у ваших бронюваннях.",
    button: "Мої бронювання",
  },
};

// ── Cola C1: petición recibida (al cliente, al crear) ───────────────────────

export interface PeticionRecibidaStrings {
  subject: string;
  heading: string;
  intro: (a: { clienteNombre: string }) => string;
  note: string;
  button: string;
}

export const peticionRecibida: Record<Locale, PeticionRecibidaStrings> = {
  es: {
    subject: "Hemos recibido tu solicitud",
    heading: "Solicitud recibida",
    intro: ({ clienteNombre }) =>
      `Hola ${clienteNombre}, hemos recibido tu solicitud de gestión. Nuestro equipo te asignará al acompañante lingüístico más adecuado y te avisaremos por email.`,
    note: "No pagas nada todavía: el precio exacto se fija al asignarte acompañante y lo apruebas antes de pagar.",
    button: "Ver mis reservas",
  },
  en: {
    subject: "We've received your request",
    heading: "Request received",
    intro: ({ clienteNombre }) =>
      `Hi ${clienteNombre}, we've received your assistance request. Our team will assign the best-suited language companion and notify you by email.`,
    note: "You don't pay anything yet: the exact price is set once a companion is assigned, and you approve it before paying.",
    button: "View my bookings",
  },
  fr: {
    subject: "Nous avons bien reçu votre demande",
    heading: "Demande reçue",
    intro: ({ clienteNombre }) =>
      `Bonjour ${clienteNombre}, nous avons reçu votre demande de démarche. Notre équipe vous assignera l’accompagnant linguistique le mieux adapté et vous préviendra par email.`,
    note: "Vous ne payez rien pour l’instant : le prix exact est fixé lors de l’assignation de l’accompagnant, et vous le validez avant de payer.",
    button: "Voir mes réservations",
  },
  de: {
    subject: "Ihre Anfrage ist bei uns eingegangen",
    heading: "Anfrage erhalten",
    intro: ({ clienteNombre }) =>
      `Hallo ${clienteNombre}, wir haben Ihre Anfrage erhalten. Unser Team weist Ihnen die am besten geeignete Sprachbegleitung zu und benachrichtigt Sie per E-Mail.`,
    note: "Sie zahlen noch nichts: Der genaue Preis wird bei der Zuteilung der Begleitung festgelegt und von Ihnen vor der Zahlung bestätigt.",
    button: "Meine Buchungen ansehen",
  },
  nl: {
    subject: "We hebben uw aanvraag ontvangen",
    heading: "Aanvraag ontvangen",
    intro: ({ clienteNombre }) =>
      `Hallo ${clienteNombre}, we hebben uw aanvraag ontvangen. Ons team wijst u de meest geschikte taalbegeleider toe en laat het u per e-mail weten.`,
    note: "U betaalt nog niets: de exacte prijs wordt vastgesteld bij de toewijzing van een begeleider, en u keurt deze goed vóór de betaling.",
    button: "Mijn boekingen bekijken",
  },
  ru: {
    subject: "Мы получили ваш запрос",
    heading: "Запрос получен",
    intro: ({ clienteNombre }) =>
      `Здравствуйте, ${clienteNombre}! Мы получили ваш запрос на сопровождение. Наша команда назначит наиболее подходящего языкового сопровождающего и сообщит вам по email.`,
    note: "Пока вы ничего не платите: точная цена фиксируется при назначении сопровождающего, и вы подтверждаете её до оплаты.",
    button: "Мои бронирования",
  },
  uk: {
    subject: "Ми отримали ваш запит",
    heading: "Запит отримано",
    intro: ({ clienteNombre }) =>
      `Вітаємо, ${clienteNombre}! Ми отримали ваш запит на супровід. Наша команда призначить найбільш підходящого мовного супровідника та повідомить вас на email.`,
    note: "Поки що ви нічого не платите: точна ціна фіксується під час призначення супровідника, і ви підтверджуєте її до оплати.",
    button: "Мої бронювання",
  },
};

// ── Cola C1: petición asignada (al cliente, al asignar) ─────────────────────

export interface PeticionAsignadaStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: {
    clienteNombre: string;
    acompananteNombre: string;
    fechaStr: string;
  }) => string;
  labelFecha: string;
  labelImporte: string;
  note: string;
  button: string;
}

export const peticionAsignada: Record<Locale, PeticionAsignadaStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Tu gestión tiene acompañante — ${acompananteNombre}`,
    heading: "¡Te hemos asignado acompañante!",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hola ${clienteNombre}, tu solicitud del <strong>${fechaStr}</strong> ha sido asignada a <strong>${acompananteNombre}</strong>.`,
    labelFecha: "Fecha:",
    labelImporte: "Importe:",
    note: "Revisa el importe en tus reservas: si es con tarjeta, confirma el pago desde ahí; si es en efectivo, pagarás en mano al terminar la gestión.",
    button: "Ver mis reservas",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Your booking has a companion — ${acompananteNombre}`,
    heading: "Companion assigned!",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hi ${clienteNombre}, your request for <strong>${fechaStr}</strong> has been assigned to <strong>${acompananteNombre}</strong>.`,
    labelFecha: "Date:",
    labelImporte: "Amount:",
    note: "Check the amount in your bookings: if it's card, confirm the payment there; if cash, you pay in hand at the end of the session.",
    button: "View my bookings",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Votre démarche a un accompagnant — ${acompananteNombre}`,
    heading: "Accompagnant assigné !",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Bonjour ${clienteNombre}, votre demande du <strong>${fechaStr}</strong> a été assignée à <strong>${acompananteNombre}</strong>.`,
    labelFecha: "Date :",
    labelImporte: "Montant :",
    note: "Vérifiez le montant dans vos réservations : par carte, confirmez le paiement depuis cette page ; en espèces, vous payez en main à la fin de la prestation.",
    button: "Voir mes réservations",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Ihr Termin hat eine Begleitung — ${acompananteNombre}`,
    heading: "Begleitung zugeteilt!",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hallo ${clienteNombre}, Ihre Anfrage für den <strong>${fechaStr}</strong> wurde <strong>${acompananteNombre}</strong> zugeteilt.`,
    labelFecha: "Datum:",
    labelImporte: "Betrag:",
    note: "Prüfen Sie den Betrag in Ihren Buchungen: bei Karte bestätigen Sie die Zahlung dort; bei Barzahlung zahlen Sie am Ende persönlich.",
    button: "Meine Buchungen ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Uw afspraak heeft een begeleider — ${acompananteNombre}`,
    heading: "Begeleider toegewezen!",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hallo ${clienteNombre}, uw aanvraag voor <strong>${fechaStr}</strong> is toegewezen aan <strong>${acompananteNombre}</strong>.`,
    labelFecha: "Datum:",
    labelImporte: "Bedrag:",
    note: "Bekijk het bedrag in uw boekingen: bij kaart bevestigt u de betaling daar; bij contant geld betaalt u persoonlijk aan het einde.",
    button: "Mijn boekingen bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `У вашего дела есть сопровождающий — ${acompananteNombre}`,
    heading: "Сопровождающий назначен!",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Здравствуйте, ${clienteNombre}! Ваш запрос на <strong>${fechaStr}</strong> назначен <strong>${acompananteNombre}</strong>.`,
    labelFecha: "Дата:",
    labelImporte: "Сумма:",
    note: "Проверьте сумму в ваших бронированиях: при оплате картой подтвердите платёж там; при наличных вы заплатите лично по окончании.",
    button: "Мои бронирования",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `У вашої справи є супровідник — ${acompananteNombre}`,
    heading: "Супровідника призначено!",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Вітаємо, ${clienteNombre}! Ваш запит на <strong>${fechaStr}</strong> призначено <strong>${acompananteNombre}</strong>.`,
    labelFecha: "Дата:",
    labelImporte: "Сума:",
    note: "Перевірте суму у ваших бронюваннях: при оплаті карткою підтвердьте платіж там; при готівці ви заплатите особисто по завершенні.",
    button: "Мої бронювання",
  },
};

// ── Cola C1.5: petición liberada por el acompañante (vuelve a la cola) ──────

export interface PeticionLiberadaStrings {
  subject: (a: { acompananteNombre: string }) => string;
  heading: string;
  intro: (a: {
    clienteNombre: string;
    acompananteNombre: string;
    fechaStr: string;
  }) => string;
  note: string;
  button: string;
}

export const peticionLiberada: Record<Locale, PeticionLiberadaStrings> = {
  es: {
    subject: ({ acompananteNombre }) =>
      `Tu petición vuelve a estar sin asignar — ${acompananteNombre}`,
    heading: "Tu petición busca de nuevo acompañante",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hola ${clienteNombre}, <strong>${acompananteNombre}</strong> ya no podrá realizar tu petición del <strong>${fechaStr}</strong>. Vuelve a estar en cola para que otro acompañante pueda aceptarla.`,
    note: "No se te ha cobrado nada. Cuando otro acompañante la acepte recibirás el importe exacto para confirmar.",
    button: "Ver mis reservas",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Your request is unassigned again — ${acompananteNombre}`,
    heading: "Your request is looking for a companion again",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hi ${clienteNombre}, <strong>${acompananteNombre}</strong> will no longer be able to handle your request for <strong>${fechaStr}</strong>. It is back in the queue so another companion can accept it.`,
    note: "You have not been charged. When another companion accepts it, you will receive the exact amount to confirm.",
    button: "View my bookings",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Votre demande est de nouveau non assignée — ${acompananteNombre}`,
    heading: "Votre demande cherche de nouveau un accompagnant",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Bonjour ${clienteNombre}, <strong>${acompananteNombre}</strong> ne pourra plus réaliser votre demande du <strong>${fechaStr}</strong>. Elle est de nouveau dans la file d’attente pour qu’un autre accompagnant puisse l’accepter.`,
    note: "Vous n’avez rien été débité. Quand un autre accompagnant l’acceptera, vous recevrez le montant exact à confirmer.",
    button: "Voir mes réservations",
  },
  de: {
    subject: ({ acompananteNombre }) =>
      `Ihr Anliegen ist wieder ohne Begleitung — ${acompananteNombre}`,
    heading: "Ihr Anliegen sucht erneut eine Begleitung",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hallo ${clienteNombre}, <strong>${acompananteNombre}</strong> kann Ihr Anliegen für den <strong>${fechaStr}</strong> nicht mehr übernehmen. Es ist zurück in der Warteschlange, damit ein anderer Begleiter es annehmen kann.`,
    note: "Ihnen wurde nichts abgebucht. Wenn ein anderer Begleiter es annimmt, erhalten Sie den genauen Betrag zur Bestätigung.",
    button: "Meine Buchungen ansehen",
  },
  nl: {
    subject: ({ acompananteNombre }) =>
      `Uw aanvraag is weer zonder begeleider — ${acompananteNombre}`,
    heading: "Uw aanvraag zoekt opnieuw een begeleider",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hallo ${clienteNombre}, <strong>${acompananteNombre}</strong> kan uw aanvraag voor <strong>${fechaStr}</strong> niet meer uitvoeren. Deze staat weer in de wachtrij zodat een andere begeleider hem kan accepteren.`,
    note: "Er is niets afgeschreven. Wanneer een andere begeleider hem accepteert, ontvangt u het exacte bedrag om te bevestigen.",
    button: "Mijn boekingen bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Ваш запрос снова без сопровождающего — ${acompananteNombre}`,
    heading: "Ваш запрос снова ищет сопровождающего",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Здравствуйте, ${clienteNombre}! <strong>${acompananteNombre}</strong> больше не сможет выполнить ваш запрос на <strong>${fechaStr}</strong>. Он снова в очереди, и другой сопровождающий сможет его принять.`,
    note: "С вас ничего не списано. Когда другой сопровождающий примет запрос, вы получите точную сумму для подтверждения.",
    button: "Мои бронирования",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Ваш запит знову без супровідника — ${acompananteNombre}`,
    heading: "Ваш запит знову шукає супровідника",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Вітаємо, ${clienteNombre}! <strong>${acompananteNombre}</strong> більше не зможе виконати ваш запит на <strong>${fechaStr}</strong>. Він знову в черзі, й інший супровідник зможе його прийняти.`,
    note: "З вас нічого не списано. Коли інший супровідник прийме запит, ви отримаєте точну суму для підтвердження.",
    button: "Мої бронювання",
  },
};
