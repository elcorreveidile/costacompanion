import type { Dictionary } from "./es";

const en: Dictionary = {
  nav: {
    comoFunciona: "How it works",
    servicios: "Services",
    paraAcompanantes: "For companions",
    paraNegocios: "For businesses",
    directorio: "Directory",
  },
  account: {
    login: "Log in",
    myAccount: "My account",
  },
  footer: {
    tagline: "By your side, in your language.",
    location: "Estepona · Costa del Sol",
    navigate: "Navigate",
    contact: "Contact",
    legal: "Legal",
    emailLabel: "Email:",
    rights: "© 2026 Costa Companion · Estepona, Costa del Sol",
    terminos: "Terms and conditions",
    privacidad: "Privacy policy",
    cookies: "Cookie policy",
    avisoIntermediacion: "Intermediation notice",
  },
  language: {
    label: "Language",
  },
  common: {
    modalidades: { presencial: "In person", remoto: "Remote", ambos: "Both" },
    badges: { destacado: "Featured", interpreteJurado: "Sworn interpreter", imparteClases: "Gives lessons" },
    categoriasAnunciante: {
      inmobiliaria: "Real estate",
      salud: "Health",
      legal: "Legal",
      restauracion: "Dining",
      comercio: "Retail",
      otros: "Other",
    },
  },
  localPartners: {
    subtitle: "Trusted local businesses for international residents and visitors.",
    todos: "All",
    todaCostaDelSol: "All of the Costa del Sol",
    ningunoFiltros: "No businesses match these filters.",
    ningunoVacio: "Coming soon: trusted local businesses.",
    verTodos: "See all →",
    negociosUno: "business found",
    negociosVarios: "businesses found",
    destacadoBadge: "★ Featured",
    verFicha: "View profile",
    email: "Email",
    llamar: "Call",
    mapa: "Map",
    verEnMapa: "View on map",
    sitioWeb: "Website",
    sobreNosotros: "About us",
    contacto: "Contact",
    volver: "← See all Local Partners",
    verTodosDestacados: "See all Local Partners →",
  },
  ficha: {
    aniosExperiencia: "years of experience",
    resenaUno: "review",
    resenaVarios: "reviews",
    cta: {
      h2: "Ready to get started?",
      subtitle:
        "Book an appointment: choose a service and a time slot. Custom request: describe what you need and the companion proposes terms.",
      reservar: "Book an appointment",
      solicitud: "Custom request",
      chat: "💬 Direct chat",
      enviarMensaje: "Send a message",
    },
    serviciosH2: "Services",
    paquetesTitulo: "Session packs",
    sesiones: "sessions",
    resenasH2: "Reviews",
    dejarResena: "Leave a review",
    yaResena: "You’ve already left your review",
    ningunaTitulo: "Be the first to leave a review",
    ningunaSub: "Reviews from verified clients will appear here.",
    clienteVerificado: "Verified client",
    avisoLegal:
      "Costa Companion acts solely as an intermediation platform between clients and independent language companions. Services are provided directly by the companions, who are self-employed professionals. Costa Companion is not a party to any service contract between the client and the companion.",
  },
  directorio: {
    hero: {
      h1: "Our companions",
      subtitle:
        "Language professionals by your side on the Costa del Sol. Paperwork, health, home and more.",
    },
    filtros: {
      idioma: "Language",
      categoria: "Category",
      zona: "Area",
      modalidad: "Format",
      todos: "All",
      todas: "All",
      filtrar: "Filter",
      limpiar: "Clear filters",
    },
    resultados: {
      uno: "companion found",
      varios: "companions found",
      ningunoTitulo: "We couldn’t find companions with those filters.",
      ningunoSub: "Try broadening your search or removing a filter.",
      verTodos: "See all companions",
    },
  },
  login: {
    subtitle: "Sign in without a password",
    sentTitle: "Link sent!",
    sentBody: "Check your inbox and click the link to sign in. It may take a few seconds.",
    noLlego: "Didn’t get the email?",
    volver: "Try again",
    emailLabel: "Email",
    enviar: "Send magic link",
    emailHelp: "We’ll send a sign-in link to your email. No password needed.",
    pinTitulo: "Have a user number and PIN?",
    numeroLabel: "User number",
    pinLabel: "PIN",
    entrarPin: "Sign in with PIN",
    primeraVez: "If it’s your first time, we’ll automatically create your account as a client.",
    errores: {
      generico: "Something went wrong. Please try again.",
      invalid_email: "Please enter a valid email.",
      send_failed: "Couldn’t send the link. Please try again.",
      invalid_token: "The link has expired or is invalid. Request a new one.",
      no_user: "We couldn’t verify your identity. Please try again.",
      no_profile: "Profile not found. Please contact support.",
      invalid_role: "Unrecognized user role. Please contact support.",
      pin: "Wrong user number or PIN, or account temporarily locked.",
    },
  },
  serviciosPage: {
    hero: {
      h1: "What we do with you",
      subtitle:
        "At Costa Companion we don’t translate documents and say goodbye. We go with you to whatever you need to handle, and we stay until everything is clear.",
    },
    verAcompanantes: "See companions for {tema}",
    cierre:
      "Don’t see exactly what you need? Message us on WhatsApp and we’ll tell you if we can help. Almost always, we can.",
    whatsappBtn: "Message us on WhatsApp",
    proximamente: "WhatsApp contact — coming soon",
    items: [
      { titulo: "Health", texto: "Support at the doctor, A&E or a specialist.", detalle: "Explaining what’s wrong and understanding the diagnosis, without getting lost in the appointment. Your companion is with you from the waiting room until you leave knowing exactly what to do." },
      { titulo: "Paperwork & admin", texto: "Police, reports, Immigration and NIE, town-hall registration, official appointments.", detalle: "Spanish bureaucracy, in your language. Your companion helps you prepare the documents, goes with you to the appointment and explains what happened and what to do next." },
      { titulo: "Notary & legal admin", texto: "Signings, powers of attorney, official documents.", detalle: "Knowing what you’re signing before you sign it. Your companion reviews the document with you, explains it in your language and is present during the signing so there are no surprises." },
      { titulo: "Buying & selling property", texto: "Viewings, negotiation, signing.", detalle: "Support through one of the most important decisions you’ll make here. From the viewing to the signing at the notary, with someone who speaks your language and the local one." },
      { titulo: "Banking", texto: "Opening or managing accounts, understanding the terms, talking to your branch.", detalle: "For banking matters where language counts: opening accounts, understanding contracts, resolving issues with your branch or managing financial products." },
      { titulo: "Urgent phone interpretation", texto: "When you need someone on the phone right now, live.", detalle: "For those moments when you have to call social security, the clinic or any office and language is a barrier. Your companion mediates in real time." },
      { titulo: "Interview preparation", texto: "To walk into a job interview with confidence.", detalle: "We prepare the usual questions, the sector’s specific vocabulary and the cultural context with you so the interview goes well." },
      { titulo: "Spanish lessons", texto: "Tailored to your level, from the basics to conversation. One-off or in packs.", detalle: "Because sometimes the best help is no longer needing it. One-to-one lessons with companions who know the everyday situations of life on the coast." },
    ],
  },
  home: {
    hero: {
      eyebrow: "Language accompaniment on the Costa del Sol",
      titleLine1: "By your side,",
      titleLine2: "in your language",
      subtitle:
        "Someone you can trust who goes with you to the doctor, the police, the notary or the bank — and speaks for you when language gets in the way. In person or remotely, in Estepona, Marbella, San Pedro, Benahavís, Manilva, Casares and all of the western Costa del Sol.",
      ctaFind: "Find my companion",
      ctaHow: "How it works",
    },
    problema: {
      h2: "Living here shouldn’t mean being lost for words",
      p1: "You know the feeling: you’ve been on the coast for years, you get by day to day, but then comes the moment to explain your symptoms to a doctor, understand a contract or file a report, and suddenly language becomes a wall. It’s not about how much Spanish you know. It’s that there are moments when you need to be sure you’re understood — and that you understand.",
      p2pre:
        "That’s exactly why Costa Companion exists: a network of companions who speak your language and the local one, and who sit by your side through whatever you need to sort out. ",
      p2em: "They don’t translate and leave. They stay with you.",
    },
    pasos: {
      h2: "Simple, from the very first moment",
      items: [
        {
          titulo: "Choose your companion",
          texto:
            "Search by language, type of task and area. Each companion has their own profile, experience and reviews from the people they’ve already helped.",
        },
        {
          titulo: "Book the appointment",
          texto:
            "Suggest a day and time, or tell them what you need and let them propose one. You decide whether it’s in person or remote.",
        },
        {
          titulo: "You’re not on your own",
          texto:
            "On the day, your companion is with you. Before, during and after — so you come away knowing exactly what happened and what comes next.",
        },
      ],
    },
    servicios: {
      h2: "For almost everything life here asks of you",
      subtitle:
        "These are some of the tasks our companions help you with. If yours isn’t on the list, just ask — we can almost always help.",
      verTodos: "See all services",
      items: [
        { titulo: "Health", texto: "Support at the doctor, A&E or a specialist. Explaining what’s wrong and understanding the diagnosis, without getting lost in the appointment." },
        { titulo: "Paperwork & admin", texto: "Police, reports, Immigration and NIE, town-hall registration, official appointments. Spanish bureaucracy, in your language." },
        { titulo: "Notary & legal admin", texto: "Signings, powers of attorney, official documents. Knowing what you’re signing before you sign it." },
        { titulo: "Buying & selling property", texto: "Viewings, negotiation, signing. Support through one of the most important decisions you’ll make here." },
        { titulo: "Banking", texto: "Opening or managing accounts, understanding the terms, talking to your branch." },
        { titulo: "Urgent phone interpretation", texto: "When you need someone on the phone right now, live." },
        { titulo: "Interview preparation", texto: "To walk into a job interview with confidence." },
        { titulo: "Spanish lessons", texto: "Tailored to your level, from the basics to conversation. One-off or in packs." },
      ],
    },
    confianza: {
      h2: "More than a language: peace of mind",
      items: [
        { titulo: "Companions you can trust", texto: "Everyone in our network joins one at a time, known and verified. We’re not an open listing: we’re a carefully tended network." },
        { titulo: "In your language", texto: "Spanish, English, French, German and Dutch. Find someone who speaks yours naturally." },
        { titulo: "Made to fit you", texto: "Each companion sets their own services and prices. You choose what suits you, with no surprises." },
        { titulo: "In person or remote", texto: "In person for what needs someone there; by phone or video call for what can be sorted on the spot." },
      ],
    },
    ctaDoble: {
      acomp: {
        h3: "Do you speak languages and want to accompany others?",
        texto:
          "If you know the coast, speak several languages and enjoy helping people in the moments that matter, there’s a place for you at Costa Companion. You work your way, with your own prices and your own profile on the platform.",
        cta: "I want to be a companion",
      },
      negocio: {
        h3: "Do you run a business on the coast?",
        texto:
          "Reach the international community of the western Costa del Sol. If your business looks after foreign residents — a clinic, an estate agency, a legal office, a shop — introduce yourself to the people looking for you.",
        cta: "Advertise my business",
      },
    },
    cierre: {
      h2: "Take the first step today",
      texto:
        "Your next task doesn’t have to be done in a language you haven’t mastered. Find the person who’ll be by your side.",
      cta: "Find my companion",
    },
  },
};

export default en;
