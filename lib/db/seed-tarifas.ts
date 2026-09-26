import { db } from "./index";
import { zonas, tarifas, configPrecios, tiposGestion } from "./schema";
import { ZONAS_GESTION } from "../zonas";

/**
 * Seed idempotente de la tarjeta de precios de la plataforma:
 *   - zonas (municipios + recargo por defecto)
 *   - tarifas por modo (remota / hora / media_jornada / jornada)
 *   - config_precios (urgencia, mínimos, plazos, retención)
 *   - tipos_gestion (metadata del catálogo de gestiones)
 *
 * Ejecutar con DATABASE_URL en el entorno:
 *   npm run db:seed:tarifas
 * Reejecutable sin duplicar (onConflictDoNothing). NO sobrescribe valores ya
 * editados desde /admin/tarifas: para restaurar los de fábrica, borrar la fila.
 */

const LOCALES = ["es", "en", "fr", "de", "nl", "ru", "uk"] as const;

type Multilingue = Record<(typeof LOCALES)[number], string>;

/** jsonb de nombres para topónimos idénticos en todos los idiomas. */
function toponimo(nombreEs: string): Multilingue {
  return Object.fromEntries(LOCALES.map((l) => [l, nombreEs])) as Multilingue;
}

const TARIFAS: {
  key: string;
  descripcion: Multilingue;
  importeCents: number;
  unidad: string;
  orden: number;
}[] = [
  {
    key: "remota",
    descripcion: {
      es: "Remota (videollamada, hasta 45 min)",
      en: "Remote (video call, up to 45 min)",
      fr: "À distance (visioconférence, jusqu'à 45 min)",
      de: "Remote (Videocall, bis 45 Min.)",
      nl: "Op afstand (videobellen, tot 45 min)",
      ru: "Дистанционно (видеозвонок, до 45 мин)",
      uk: "Дистанційно (відеозвонок, до 45 хв)",
    },
    importeCents: 3900,
    unidad: "sesion",
    orden: 1,
  },
  {
    key: "hora",
    descripcion: {
      es: "Presencial, por hora (mínimo facturable 2 h)",
      en: "In person, per hour (2 h minimum)",
      fr: "En présentiel, par heure (2 h minimum)",
      de: "Vor Ort, pro Stunde (mind. 2 Std.)",
      nl: "Persoonlijk, per uur (min. 2 uur)",
      ru: "Лично, за час (минимум 2 ч)",
      uk: "Особисто, за годину (мінімум 2 год)",
    },
    importeCents: 4500,
    unidad: "hora",
    orden: 2,
  },
  {
    key: "media_jornada",
    descripcion: {
      es: "Media jornada (4 h)",
      en: "Half day (4 h)",
      fr: "Demi-journée (4 h)",
      de: "Halber Tag (4 Std.)",
      nl: "Halve dag (4 uur)",
      ru: "Полдня (4 ч)",
      uk: "Півдня (4 год)",
    },
    importeCents: 22000,
    unidad: "sesion",
    orden: 3,
  },
  {
    key: "jornada",
    descripcion: {
      es: "Jornada completa (8 h)",
      en: "Full day (8 h)",
      fr: "Journée complète (8 h)",
      de: "Ganzer Tag (8 Std.)",
      nl: "Hele dag (8 uur)",
      ru: "Полный день (8 ч)",
      uk: "Повний день (8 год)",
    },
    importeCents: 38000,
    unidad: "sesion",
    orden: 4,
  },
];

const CONFIG_PRECIOS: { clave: string; valorEntero: number; descripcion: string }[] = [
  { clave: "urgencia_pct", valorEntero: 50, descripcion: "Recargo de urgencia (%) sobre base + zona" },
  { clave: "urgencia_horas_limite", valorEntero: 48, descripcion: "Cita en menos de X horas ⇒ urgencia" },
  { clave: "min_horas_facturables", valorEntero: 2, descripcion: "Mínimo facturable en modo hora" },
  { clave: "horas_media_jornada", valorEntero: 4, descripcion: "Duración de la media jornada (h)" },
  { clave: "horas_jornada", valorEntero: 8, descripcion: "Duración de la jornada (h)" },
  { clave: "cancelacion_horas_gratis", valorEntero: 48, descripcion: "Cancelación gratuita hasta X h antes" },
  { clave: "cancelacion_horas_mitad", valorEntero: 24, descripcion: "Cancelación con 50 % de cargo hasta X h antes" },
  { clave: "recordatorio_horas", valorEntero: 24, descripcion: "Recordatorio X h antes de la cita" },
  { clave: "retencion_docs_meses", valorEntero: 12, descripcion: "Meses de retención de documentos tras completar la gestión" },
];

const TIPOS_GESTION: { key: string; nombre: Multilingue; orden: number }[] = [
  {
    key: "medica",
    nombre: {
      es: "Gestión médica",
      en: "Medical appointment",
      fr: "Démarche médicale",
      de: "Medizinischer Termin",
      nl: "Medische afspraak",
      ru: "Медицинская поездка",
      uk: "Медична справа",
    },
    orden: 1,
  },
  {
    key: "administrativa",
    nombre: {
      es: "Gestoría / administrativa",
      en: "Administrative / gestoría",
      fr: "Démarches administratives",
      de: "Verwaltungsangelegenheit",
      nl: "Administratieve zaken",
      ru: "Административные вопросы",
      uk: "Адміністративні питання",
    },
    orden: 2,
  },
  {
    key: "notarial",
    nombre: {
      es: "Notarial",
      en: "Notary",
      fr: "Notarial",
      de: "Notariell",
      nl: "Notarieel",
      ru: "Нотариальные действия",
      uk: "Нотаріальні дії",
    },
    orden: 3,
  },
  {
    key: "itv_trafico",
    nombre: {
      es: "ITV / tráfico",
      en: "Vehicle inspection (ITV) / traffic",
      fr: "Contrôle technique (ITV) / trafic",
      de: "TÜV / Verkehr",
      nl: "APK / verkeer",
      ru: "Техосмотр / транспортные вопросы",
      uk: "Техогляд / транспорт",
    },
    orden: 4,
  },
  {
    key: "escolarizacion",
    nombre: {
      es: "Escolarización",
      en: "School enrolment",
      fr: "Scolarisation",
      de: "Schulanmeldung",
      nl: "Schoolinschrijving",
      ru: "Устройство детей в школу",
      uk: "Влаштування дітей до школи",
    },
    orden: 5,
  },
  {
    key: "empadronamiento_contratos",
    nombre: {
      es: "Empadronamiento / contratos",
      en: "Residency registration / contracts",
      fr: "Inscription municipale / contrats",
      de: "Anmeldung / Verträge",
      nl: "Inschrijving / contracten",
      ru: "Регистрация / договоры",
      uk: "Реєстрація / договори",
    },
    orden: 6,
  },
  {
    key: "otra",
    nombre: {
      es: "Otra",
      en: "Other",
      fr: "Autre",
      de: "Sonstige",
      nl: "Overig",
      ru: "Другое",
      uk: "Інша",
    },
    orden: 7,
  },
];

async function seed() {
  const rZonas = await db
    .insert(zonas)
    .values(
      ZONAS_GESTION.map((z, i) => ({
        key: z.key,
        nombre: toponimo(z.nombreEs),
        recargoCents: z.recargoCentsDefecto,
        orden: i + 1,
      }))
    )
    .onConflictDoNothing({ target: zonas.key })
    .returning({ key: zonas.key });

  const rTarifas = await db
    .insert(tarifas)
    .values(TARIFAS)
    .onConflictDoNothing({ target: tarifas.key })
    .returning({ key: tarifas.key });

  const rConfig = await db
    .insert(configPrecios)
    .values(CONFIG_PRECIOS)
    .onConflictDoNothing({ target: configPrecios.clave })
    .returning({ clave: configPrecios.clave });

  const rTipos = await db
    .insert(tiposGestion)
    .values(TIPOS_GESTION)
    .onConflictDoNothing({ target: tiposGestion.key })
    .returning({ key: tiposGestion.key });

  console.log(
    `Seed tarifas: ${rZonas.length}/${ZONAS_GESTION.length} zonas, ` +
      `${rTarifas.length}/${TARIFAS.length} tarifas, ` +
      `${rConfig.length}/${CONFIG_PRECIOS.length} config, ` +
      `${rTipos.length}/${TIPOS_GESTION.length} tipos de gestión insertados ` +
      "(el resto ya existían)."
  );
  process.exit(0);
}

seed().catch((e) => {
  console.error("Error en el seed de tarifas:", e);
  process.exit(1);
});
