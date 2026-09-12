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
  common: {
    modalidades: { presencial: "Presencial", remoto: "Remoto", ambos: "Ambos" },
    badges: { destacado: "Destacado", interpreteJurado: "Intérprete jurado", imparteClases: "Imparte clases" },
  },
  ficha: {
    aniosExperiencia: "años de experiencia",
    resenaUno: "reseña",
    resenaVarios: "reseñas",
    cta: {
      h2: "¿Listo para empezar?",
      subtitle:
        "Reservar cita: elige un servicio y una franja horaria. Solicitud a medida: describe lo que necesitas y el acompañante te propone condiciones.",
      reservar: "Reservar cita",
      solicitud: "Solicitud a medida",
      chat: "💬 Chat directo",
      enviarMensaje: "Enviar mensaje",
    },
    serviciosH2: "Servicios",
    paquetesTitulo: "Paquetes de sesiones",
    sesiones: "sesiones",
    resenasH2: "Reseñas",
    dejarResena: "Dejar reseña",
    yaResena: "Ya dejaste tu reseña",
    ningunaTitulo: "Sé el primero en dejar una reseña",
    ningunaSub: "Las reseñas de clientes verificados aparecerán aquí.",
    clienteVerificado: "Cliente verificado",
    avisoLegal:
      "Costa Companion actúa exclusivamente como plataforma de intermediación entre clientes y acompañantes lingüísticos independientes. Los servicios son prestados directamente por los acompañantes, quienes son profesionales autónomos. Costa Companion no es parte de ningún contrato de prestación de servicios entre el cliente y el acompañante.",
  },
  directorio: {
    hero: {
      h1: "Nuestros acompañantes",
      subtitle:
        "Profesionales lingüísticos a tu lado en la Costa del Sol. Trámites, salud, hogar y más.",
    },
    filtros: {
      idioma: "Idioma",
      categoria: "Categoría",
      zona: "Zona",
      modalidad: "Modalidad",
      todos: "Todos",
      todas: "Todas",
      filtrar: "Filtrar",
      limpiar: "Limpiar filtros",
    },
    resultados: {
      uno: "acompañante encontrado",
      varios: "acompañantes encontrados",
      ningunoTitulo: "No encontramos acompañantes con esos filtros.",
      ningunoSub: "Prueba a ampliar tu búsqueda o eliminar algún filtro.",
      verTodos: "Ver todos los acompañantes",
    },
  },
  login: {
    subtitle: "Accede sin contraseña",
    sentTitle: "¡Enlace enviado!",
    sentBody: "Revisa tu bandeja de entrada y haz clic en el enlace para acceder. Puede tardar unos segundos.",
    noLlego: "¿No ha llegado el email?",
    volver: "Volver a intentarlo",
    emailLabel: "Email",
    enviar: "Enviar enlace mágico",
    emailHelp: "Te enviaremos un enlace de acceso a tu email. No necesitas contraseña.",
    pinTitulo: "¿Tienes número de usuario y PIN?",
    numeroLabel: "Número de usuario",
    pinLabel: "PIN",
    entrarPin: "Entrar con PIN",
    primeraVez: "Si es tu primera vez, crearemos automáticamente tu cuenta como cliente.",
    errores: {
      generico: "Ha ocurrido un error. Inténtalo de nuevo.",
      invalid_email: "Por favor, introduce un email válido.",
      send_failed: "No se pudo enviar el enlace. Inténtalo de nuevo.",
      invalid_token: "El enlace ha expirado o no es válido. Solicita uno nuevo.",
      no_user: "No se pudo verificar tu identidad. Inténtalo de nuevo.",
      no_profile: "No se encontró tu perfil. Contacta con soporte.",
      invalid_role: "Rol de usuario no reconocido. Contacta con soporte.",
      pin: "Número de usuario o PIN incorrectos, o cuenta bloqueada temporalmente.",
    },
  },
  serviciosPage: {
    hero: {
      h1: "Lo que hacemos contigo",
      subtitle:
        "En Costa Companion no traducimos documentos y nos despedimos. Te acompañamos a la gestión, sea cual sea, y nos quedamos hasta que todo está claro.",
    },
    verAcompanantes: "Ver acompañantes para {tema}",
    cierre:
      "¿No ves exactamente lo que necesitas? Escríbenos por WhatsApp y te decimos si podemos ayudarte. Casi siempre, sí.",
    whatsappBtn: "Escribir por WhatsApp",
    proximamente: "Contacto por WhatsApp — próximamente",
    items: [
      { titulo: "Salud", texto: "Acompañamiento al médico, a urgencias o al especialista.", detalle: "Explicar lo que te pasa y entender el diagnóstico, sin perderte en la consulta. Tu acompañante está contigo desde la espera hasta que salís y ya sabes exactamente qué hacer." },
      { titulo: "Trámites y administración", texto: "Policía, denuncias, Extranjería y NIE, empadronamiento, citas oficiales.", detalle: "La burocracia española, en tu idioma. Tu acompañante te ayuda a preparar la documentación, te acompaña a la cita y te explica qué ha pasado y qué tienes que hacer después." },
      { titulo: "Notaría y gestoría", texto: "Firmas, poderes, documentos oficiales.", detalle: "Saber qué estás firmando antes de firmarlo. Tu acompañante revisa contigo el documento, te lo explica en tu idioma y está presente durante la firma para que no haya sorpresas." },
      { titulo: "Compraventa de propiedades", texto: "Visitas, negociación, firma.", detalle: "Acompañamiento en una de las decisiones más importantes que tomarás aquí. Desde la visita al inmueble hasta la firma ante notario, con alguien que habla tu idioma y el de aquí." },
      { titulo: "Banca", texto: "Abrir o gestionar cuentas, entender las condiciones, hablar con tu oficina.", detalle: "Para las gestiones bancarias donde el idioma importa: abrir cuentas, entender contratos, resolver problemas con tu oficina o gestionar productos financieros." },
      { titulo: "Interpretación telefónica urgente", texto: "Cuando necesitas a alguien al teléfono ahora mismo, en directo.", detalle: "Para esos momentos en los que hay que llamar a la seguridad social, a la clínica o a cualquier organismo y el idioma es una barrera. Tu acompañante media en tiempo real." },
      { titulo: "Preparación de entrevistas", texto: "Para llegar con seguridad a una entrevista de trabajo.", detalle: "Preparamos contigo las respuestas habituales, el vocabulario específico del sector y el contexto cultural para que la entrevista salga bien." },
      { titulo: "Clases de español", texto: "Adaptadas a tu nivel, desde lo básico hasta la conversación. Sueltas o en bonos.", detalle: "Porque a veces la mejor ayuda es dejar de necesitarla. Clases individuales con acompañantes que conocen las situaciones cotidianas de la vida en la costa." },
    ],
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
