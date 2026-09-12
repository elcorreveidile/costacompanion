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
    note: "Puedes contactar directamente con el acompañante desde su perfil si necesitas coordinar algo.",
    button: "Ver mis reservas",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Booking confirmed with ${acompananteNombre}`,
    heading: "Booking confirmed!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hi ${clienteNombre}, <strong>${acompananteNombre}</strong> has confirmed your appointment.`,
    labelFecha: "Date:",
    note: "You can contact the companion directly from their profile if you need to coordinate anything.",
    button: "View my bookings",
  },
  fr: {
    subject: ({ acompananteNombre }) =>
      `Réservation confirmée avec ${acompananteNombre}`,
    heading: "Réservation confirmée !",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Bonjour ${clienteNombre}, <strong>${acompananteNombre}</strong> a confirmé votre rendez-vous.`,
    labelFecha: "Date :",
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
    note: "Je kunt de begeleider rechtstreeks via zijn of haar profiel contacteren als je iets wilt afstemmen.",
    button: "Mijn boekingen bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Бронирование подтверждено с ${acompananteNombre}`,
    heading: "Бронирование подтверждено!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Здравствуйте, ${clienteNombre}! <strong>${acompananteNombre}</strong> подтвердил(а) вашу встречу.`,
    labelFecha: "Дата:",
    note: "Вы можете связаться с сопровождающим напрямую через его профиль, если нужно что-то согласовать.",
    button: "Мои бронирования",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Бронювання підтверджено з ${acompananteNombre}`,
    heading: "Бронювання підтверджено!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Вітаємо, ${clienteNombre}! <strong>${acompananteNombre}</strong> підтвердив(ла) вашу зустріч.`,
    labelFecha: "Дата:",
    note: "Ви можете зв’язатися із супровідником безпосередньо через його профіль, якщо потрібно щось узгодити.",
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
    note: "Te animamos a ver otros horarios disponibles o explorar más acompañantes en el directorio.",
    button: "Ver directorio",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Booking unavailable — ${acompananteNombre}`,
    heading: "Booking unavailable",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Hi ${clienteNombre}, unfortunately <strong>${acompananteNombre}</strong> can't take you at that time (${fechaStr}).`,
    note: "We encourage you to check other available times or explore more companions in the directory.",
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
    note: "We raden je aan om andere beschikbare tijden te bekijken of meer begeleiders in de gids te ontdekken.",
    button: "Gids bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Бронирование недоступно — ${acompananteNombre}`,
    heading: "Бронирование недоступно",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Здравствуйте, ${clienteNombre}! К сожалению, <strong>${acompananteNombre}</strong> не может принять вас в это время (${fechaStr}).`,
    note: "Рекомендуем посмотреть другое доступное время или найти других сопровождающих в каталоге.",
    button: "Открыть каталог",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Бронювання недоступне — ${acompananteNombre}`,
    heading: "Бронювання недоступне",
    intro: ({ clienteNombre, acompananteNombre, fechaStr }) =>
      `Вітаємо, ${clienteNombre}! На жаль, <strong>${acompananteNombre}</strong> не може прийняти вас у цей час (${fechaStr}).`,
    note: "Радимо переглянути інший доступний час або знайти інших супровідників у каталозі.",
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
    note: "Puedes contactar al acompañante desde su perfil para coordinar los detalles.",
    button: "Ver solicitudes",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Your request was accepted — ${acompananteNombre}`,
    heading: "Request accepted!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hi ${clienteNombre}, <strong>${acompananteNombre}</strong> has accepted your request.`,
    precio: ({ precio }) => `Proposed price: ${precio}€`,
    note: "You can contact the companion from their profile to arrange the details.",
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
    note: "Je kunt de begeleider via zijn of haar profiel contacteren om de details af te stemmen.",
    button: "Verzoeken bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Ваш запрос принят — ${acompananteNombre}`,
    heading: "Запрос принят!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Здравствуйте, ${clienteNombre}! <strong>${acompananteNombre}</strong> принял(а) ваш запрос.`,
    precio: ({ precio }) => `Предложенная цена: ${precio} €`,
    note: "Вы можете связаться с сопровождающим через его профиль, чтобы согласовать детали.",
    button: "Посмотреть запросы",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Ваш запит прийнято — ${acompananteNombre}`,
    heading: "Запит прийнято!",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Вітаємо, ${clienteNombre}! <strong>${acompananteNombre}</strong> прийняв(ла) ваш запит.`,
    precio: ({ precio }) => `Запропонована ціна: ${precio} €`,
    note: "Ви можете зв’язатися із супровідником через його профіль, щоб узгодити деталі.",
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
    note: "Puedes explorar otros acompañantes en el directorio o enviar una nueva solicitud.",
    button: "Ver directorio",
  },
  en: {
    subject: ({ acompananteNombre }) =>
      `Request unavailable — ${acompananteNombre}`,
    heading: "Request unavailable",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Hi ${clienteNombre}, <strong>${acompananteNombre}</strong> can't take on your request at the moment.`,
    note: "You can explore other companions in the directory or send a new request.",
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
    note: "Je kunt andere begeleiders in de gids ontdekken of een nieuw verzoek sturen.",
    button: "Gids bekijken",
  },
  ru: {
    subject: ({ acompananteNombre }) =>
      `Запрос недоступен — ${acompananteNombre}`,
    heading: "Запрос недоступен",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Здравствуйте, ${clienteNombre}! <strong>${acompananteNombre}</strong> сейчас не может обработать ваш запрос.`,
    note: "Вы можете найти других сопровождающих в каталоге или отправить новый запрос.",
    button: "Открыть каталог",
  },
  uk: {
    subject: ({ acompananteNombre }) =>
      `Запит недоступний — ${acompananteNombre}`,
    heading: "Запит недоступний",
    intro: ({ clienteNombre, acompananteNombre }) =>
      `Вітаємо, ${clienteNombre}! <strong>${acompananteNombre}</strong> наразі не може обробити ваш запит.`,
    note: "Ви можете знайти інших супровідників у каталозі або надіслати новий запит.",
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
