// Diccionario ES — fuente de verdad. Las demás lenguas replican esta forma.
// Fase 1: chrome (cabecera, pie) + común. Se ampliará por fases.

const es = {
  nav: {
    comoFunciona: "Cómo funciona",
    servicios: "Servicios",
    paraAcompanantes: "Para acompañantes",
    paraNegocios: "Para negocios",
    directorio: "Directorio",
  },
  account: {
    login: "Entrar",
    myAccount: "Mi cuenta",
  },
  footer: {
    tagline: "A tu lado, en tu idioma.",
    location: "Estepona · Costa del Sol",
    navigate: "Navegar",
    contact: "Contacto",
    legal: "Legal",
    emailLabel: "Email:",
    rights: "© 2026 Costa Companion · Estepona, Costa del Sol",
    terminos: "Términos y condiciones",
    privacidad: "Política de privacidad",
    cookies: "Política de cookies",
    avisoIntermediacion: "Aviso de intermediación",
  },
  language: {
    label: "Idioma",
  },
  home: {
    hero: {
      eyebrow: "Acompañamiento lingüístico en la Costa del Sol",
      titleLine1: "A tu lado,",
      titleLine2: "en tu idioma",
      subtitle:
        "Alguien de confianza que te acompaña al médico, a la policía, al notario o al banco — y habla por ti cuando el idioma se interpone. Presencial o a distancia, en Estepona, Marbella, San Pedro, Benahavís, Manilva, Casares y toda la Costa del Sol occidental.",
      ctaFind: "Encontrar a mi acompañante",
      ctaHow: "Cómo funciona",
    },
    problema: {
      h2: "Vivir aquí no debería significar quedarse sin palabras",
      p1: "Conoces la sensación: llevas años en la costa, te defiendes en el día a día, pero llega el momento de explicarle unos síntomas al médico, entender un contrato o poner una denuncia, y de pronto el idioma se convierte en un muro. No es cuestión de saber más o menos español. Es que hay momentos en los que necesitas estar seguro de que te entienden y de que entiendes tú.",
      p2pre:
        "Para esos momentos existe Costa Companion: una red de acompañantes que hablan tu idioma y el de aquí, y que se sientan a tu lado en la gestión que sea. ",
      p2em: "No traducen y se van. Te acompañan.",
    },
    pasos: {
      h2: "Sencillo, desde el primer momento",
      items: [
        {
          titulo: "Elige a tu acompañante",
          texto:
            "Busca por idioma, por tipo de gestión y por zona. Cada acompañante tiene su perfil, su experiencia y las valoraciones de quienes ya han contado con él.",
        },
        {
          titulo: "Reserva la cita",
          texto:
            "Propón el día y la hora, o cuéntale lo que necesitas y deja que te proponga. Tú decides si es en persona o a distancia.",
        },
        {
          titulo: "No vas solo",
          texto:
            "El día de la gestión, tu acompañante está contigo. Antes, durante y después. Para que salgas sabiendo exactamente qué ha pasado y qué viene ahora.",
        },
      ],
    },
    servicios: {
      h2: "Para casi todo lo que la vida aquí te pide",
      subtitle:
        "Estas son algunas de las gestiones en las que nuestros acompañantes te asisten. Si lo tuyo no está en la lista, pregúntanos: casi siempre podemos ayudar.",
      verTodos: "Ver todos los servicios",
      items: [
        { titulo: "Salud", texto: "Acompañamiento al médico, a urgencias o al especialista. Explicar lo que te pasa y entender el diagnóstico, sin perderte en la consulta." },
        { titulo: "Trámites y administración", texto: "Policía, denuncias, Extranjería y NIE, empadronamiento, citas oficiales. La burocracia española, en tu idioma." },
        { titulo: "Notaría y gestoría", texto: "Firmas, poderes, documentos oficiales. Saber qué estás firmando antes de firmarlo." },
        { titulo: "Compraventa de propiedades", texto: "Visitas, negociación, firma. Acompañamiento en una de las decisiones más importantes que tomarás aquí." },
        { titulo: "Banca", texto: "Abrir o gestionar cuentas, entender las condiciones, hablar con tu oficina." },
        { titulo: "Interpretación telefónica urgente", texto: "Cuando necesitas a alguien al teléfono ahora mismo, en directo." },
        { titulo: "Preparación de entrevistas", texto: "Para llegar con seguridad a una entrevista de trabajo." },
        { titulo: "Clases de español", texto: "Adaptadas a tu nivel, desde lo básico hasta la conversación. Sueltas o en bonos." },
      ],
    },
    confianza: {
      h2: "Más que un idioma: tranquilidad",
      items: [
        { titulo: "Acompañantes de confianza", texto: "Cada persona de nuestra red entra de una en una, conocida y verificada. No somos un listado abierto: somos una red cuidada." },
        { titulo: "En tu idioma", texto: "Español, inglés, francés, alemán y neerlandés. Encuentra a alguien que hable el tuyo con naturalidad." },
        { titulo: "A tu medida", texto: "Cada acompañante pone sus servicios y sus precios. Tú eliges lo que encaja contigo, sin sorpresas." },
        { titulo: "Presencial o a distancia", texto: "En persona para lo que requiere estar allí; por teléfono o videollamada para lo que se resuelve en el momento." },
      ],
    },
    ctaDoble: {
      acomp: {
        h3: "¿Hablas idiomas y quieres acompañar?",
        texto:
          "Si conoces la costa, hablas varios idiomas y te gusta ayudar a las personas en los momentos que importan, hay un sitio para ti en Costa Companion. Trabajas a tu manera, con tus precios y tu propio perfil dentro de la plataforma.",
        cta: "Quiero ser acompañante",
      },
      negocio: {
        h3: "¿Tienes un negocio en la costa?",
        texto:
          "Llega a la comunidad internacional de la Costa del Sol occidental. Si tu negocio cuida a los residentes extranjeros —una clínica, una inmobiliaria, una gestoría, un comercio—, preséntate ante quienes te buscan.",
        cta: "Anunciar mi negocio",
      },
    },
    cierre: {
      h2: "Da el primer paso hoy",
      texto:
        "Tu próxima gestión no tiene por qué hacerse en un idioma que no dominas. Encuentra a la persona que te acompaña.",
      cta: "Encontrar a mi acompañante",
    },
  },
};

export default es;
export type Dictionary = typeof es;
