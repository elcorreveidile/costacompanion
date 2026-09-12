import type { Dictionary } from "./es";

const fr: Dictionary = {
  nav: {
    comoFunciona: "Comment ça marche",
    servicios: "Services",
    paraAcompanantes: "Pour les accompagnateurs",
    paraNegocios: "Pour les entreprises",
    directorio: "Annuaire",
  },
  account: {
    login: "Se connecter",
    myAccount: "Mon compte",
  },
  footer: {
    tagline: "À vos côtés, dans votre langue.",
    location: "Estepona · Costa del Sol",
    navigate: "Navigation",
    contact: "Contact",
    legal: "Mentions légales",
    emailLabel: "Email :",
    rights: "© 2026 Costa Companion · Estepona, Costa del Sol",
    terminos: "Conditions générales",
    privacidad: "Politique de confidentialité",
    cookies: "Politique de cookies",
    avisoIntermediacion: "Avis d’intermédiation",
  },
  language: {
    label: "Langue",
  },
  common: {
    modalidades: { presencial: "En personne", remoto: "À distance", ambos: "Les deux" },
    badges: { destacado: "Mis en avant", interpreteJurado: "Interprète assermenté", imparteClases: "Donne des cours" },
    categoriasAnunciante: {
      inmobiliaria: "Immobilier",
      salud: "Santé",
      legal: "Juridique",
      restauracion: "Restauration",
      comercio: "Commerce",
      otros: "Autres",
    },
  },
  localPartners: {
    subtitle: "Des entreprises locales de confiance pour les résidents et visiteurs internationaux.",
    todos: "Tous",
    todaCostaDelSol: "Toute la Costa del Sol",
    ningunoFiltros: "Aucune entreprise ne correspond à ces filtres.",
    ningunoVacio: "Bientôt : des entreprises locales de confiance.",
    verTodos: "Voir tout →",
    negociosUno: "entreprise trouvée",
    negociosVarios: "entreprises trouvées",
    destacadoBadge: "★ Mis en avant",
    verFicha: "Voir la fiche",
    email: "Email",
    llamar: "Appeler",
    mapa: "Carte",
    verEnMapa: "Voir sur la carte",
    sitioWeb: "Site web",
    sobreNosotros: "À propos",
    contacto: "Contact",
    volver: "← Voir tous les Local Partners",
    verTodosDestacados: "Voir tous les Local Partners →",
  },
  ficha: {
    aniosExperiencia: "ans d’expérience",
    resenaUno: "avis",
    resenaVarios: "avis",
    cta: {
      h2: "Prêt à commencer ?",
      subtitle:
        "Réserver un rendez-vous : choisissez un service et un créneau. Demande sur mesure : décrivez votre besoin et l’accompagnateur vous propose des conditions.",
      reservar: "Réserver un rendez-vous",
      solicitud: "Demande sur mesure",
      chat: "💬 Chat direct",
      enviarMensaje: "Envoyer un message",
    },
    serviciosH2: "Services",
    paquetesTitulo: "Forfaits de séances",
    sesiones: "séances",
    resenasH2: "Avis",
    dejarResena: "Laisser un avis",
    yaResena: "Vous avez déjà laissé votre avis",
    ningunaTitulo: "Soyez le premier à laisser un avis",
    ningunaSub: "Les avis de clients vérifiés apparaîtront ici.",
    clienteVerificado: "Client vérifié",
    avisoLegal:
      "Costa Companion agit uniquement comme plateforme d’intermédiation entre les clients et des accompagnateurs linguistiques indépendants. Les services sont fournis directement par les accompagnateurs, qui sont des professionnels indépendants. Costa Companion n’est partie à aucun contrat de prestation de services entre le client et l’accompagnateur.",
  },
  directorio: {
    hero: {
      h1: "Nos accompagnateurs",
      subtitle:
        "Des professionnels de la langue à vos côtés sur la Costa del Sol. Démarches, santé, logement et plus.",
    },
    filtros: {
      idioma: "Langue",
      categoria: "Catégorie",
      zona: "Zone",
      modalidad: "Format",
      todos: "Tous",
      todas: "Toutes",
      filtrar: "Filtrer",
      limpiar: "Effacer les filtres",
    },
    resultados: {
      uno: "accompagnateur trouvé",
      varios: "accompagnateurs trouvés",
      ningunoTitulo: "Aucun accompagnateur trouvé avec ces filtres.",
      ningunoSub: "Essayez d’élargir votre recherche ou de retirer un filtre.",
      verTodos: "Voir tous les accompagnateurs",
    },
  },
  login: {
    subtitle: "Connectez-vous sans mot de passe",
    sentTitle: "Lien envoyé !",
    sentBody: "Consultez votre boîte de réception et cliquez sur le lien pour vous connecter. Cela peut prendre quelques secondes.",
    noLlego: "Vous n’avez pas reçu l’email ?",
    volver: "Réessayer",
    emailLabel: "Email",
    enviar: "Envoyer le lien magique",
    emailHelp: "Nous vous enverrons un lien de connexion par email. Aucun mot de passe nécessaire.",
    pinTitulo: "Vous avez un numéro d’utilisateur et un code PIN ?",
    numeroLabel: "Numéro d’utilisateur",
    pinLabel: "Code PIN",
    entrarPin: "Se connecter avec le PIN",
    primeraVez: "Si c’est votre première fois, nous créerons automatiquement votre compte en tant que client.",
    errores: {
      generico: "Une erreur s’est produite. Veuillez réessayer.",
      invalid_email: "Veuillez saisir un email valide.",
      send_failed: "Impossible d’envoyer le lien. Veuillez réessayer.",
      invalid_token: "Le lien a expiré ou n’est pas valide. Demandez-en un nouveau.",
      no_user: "Nous n’avons pas pu vérifier votre identité. Veuillez réessayer.",
      no_profile: "Profil introuvable. Contactez le support.",
      invalid_role: "Rôle d’utilisateur non reconnu. Contactez le support.",
      pin: "Numéro d’utilisateur ou PIN incorrect, ou compte temporairement bloqué.",
    },
  },
  serviciosPage: {
    hero: {
      h1: "Ce que nous faisons avec vous",
      subtitle:
        "Chez Costa Companion, nous ne traduisons pas des documents pour ensuite vous laisser. Nous vous accompagnons dans la démarche, quelle qu’elle soit, et nous restons jusqu’à ce que tout soit clair.",
    },
    verAcompanantes: "Voir les accompagnateurs pour : {tema}",
    cierre:
      "Vous ne voyez pas exactement ce dont vous avez besoin ? Écrivez-nous sur WhatsApp et nous vous dirons si nous pouvons aider. Presque toujours, oui.",
    whatsappBtn: "Écrire sur WhatsApp",
    proximamente: "Contact WhatsApp — bientôt disponible",
    items: [
      { titulo: "Santé", texto: "Accompagnement chez le médecin, aux urgences ou chez le spécialiste.", detalle: "Expliquer ce qui vous arrive et comprendre le diagnostic, sans vous perdre pendant la consultation. Votre accompagnateur reste avec vous, de la salle d’attente jusqu’à la sortie, quand vous savez exactement quoi faire." },
      { titulo: "Démarches et administration", texto: "Police, plaintes, Immigration et NIE, inscription à la mairie, rendez-vous officiels.", detalle: "La bureaucratie espagnole, dans votre langue. Votre accompagnateur vous aide à préparer les documents, vous accompagne au rendez-vous et vous explique ce qui s’est passé et la suite." },
      { titulo: "Notaire et gestion administrative", texto: "Signatures, procurations, documents officiels.", detalle: "Savoir ce que vous signez avant de le signer. Votre accompagnateur relit le document avec vous, vous l’explique dans votre langue et est présent lors de la signature, sans surprises." },
      { titulo: "Achat et vente de biens", texto: "Visites, négociation, signature.", detalle: "Un accompagnement pour l’une des décisions les plus importantes que vous prendrez ici. De la visite du bien à la signature chez le notaire, avec quelqu’un qui parle votre langue et celle d’ici." },
      { titulo: "Banque", texto: "Ouvrir ou gérer des comptes, comprendre les conditions, parler avec votre agence.", detalle: "Pour les opérations bancaires où la langue compte : ouvrir des comptes, comprendre des contrats, résoudre des problèmes avec votre agence ou gérer des produits financiers." },
      { titulo: "Interprétation téléphonique urgente", texto: "Quand vous avez besoin de quelqu’un au téléphone tout de suite, en direct.", detalle: "Pour ces moments où il faut appeler la sécurité sociale, la clinique ou un organisme et que la langue est un obstacle. Votre accompagnateur intervient en temps réel." },
      { titulo: "Préparation aux entretiens", texto: "Pour arriver en confiance à un entretien d’embauche.", detalle: "Nous préparons avec vous les réponses habituelles, le vocabulaire propre au secteur et le contexte culturel pour que l’entretien se passe bien." },
      { titulo: "Cours d’espagnol", texto: "Adaptés à votre niveau, des bases à la conversation. À l’unité ou en forfaits.", detalle: "Parce que parfois, la meilleure aide est de ne plus en avoir besoin. Cours individuels avec des accompagnateurs qui connaissent le quotidien de la vie sur la côte." },
    ],
  },
  home: {
    hero: {
      eyebrow: "Accompagnement linguistique sur la Costa del Sol",
      titleLine1: "À vos côtés,",
      titleLine2: "dans votre langue",
      subtitle:
        "Une personne de confiance qui vous accompagne chez le médecin, à la police, chez le notaire ou à la banque — et qui parle pour vous quand la langue devient un obstacle. En personne ou à distance, à Estepona, Marbella, San Pedro, Benahavís, Manilva, Casares et dans toute la Costa del Sol occidentale.",
      ctaFind: "Trouver mon accompagnateur",
      ctaHow: "Comment ça marche",
    },
    problema: {
      h2: "Vivre ici ne devrait pas vous laisser sans voix",
      p1: "Vous connaissez ce sentiment : vous vivez sur la côte depuis des années, vous vous débrouillez au quotidien, mais vient le moment d’expliquer des symptômes à un médecin, de comprendre un contrat ou de porter plainte, et soudain la langue devient un mur. Ce n’est pas une question de niveau d’espagnol. C’est qu’il y a des moments où vous devez être sûr d’être compris — et de comprendre.",
      p2pre:
        "C’est précisément pour ces moments qu’existe Costa Companion : un réseau d’accompagnateurs qui parlent votre langue et celle d’ici, et qui restent à vos côtés quelle que soit la démarche. ",
      p2em: "Ils ne traduisent pas puis s’en vont. Ils vous accompagnent.",
    },
    pasos: {
      h2: "Simple, dès le premier instant",
      items: [
        {
          titulo: "Choisissez votre accompagnateur",
          texto:
            "Recherchez par langue, par type de démarche et par zone. Chaque accompagnateur a son profil, son expérience et les avis de ceux qui ont déjà fait appel à lui.",
        },
        {
          titulo: "Réservez le rendez-vous",
          texto:
            "Proposez un jour et une heure, ou expliquez ce dont vous avez besoin et laissez-le vous proposer une date. C’est vous qui décidez : en personne ou à distance.",
        },
        {
          titulo: "Vous n’êtes pas seul",
          texto:
            "Le jour venu, votre accompagnateur est avec vous. Avant, pendant et après — pour que vous repartiez en sachant exactement ce qui s’est passé et ce qui vient ensuite.",
        },
      ],
    },
    servicios: {
      h2: "Pour presque tout ce que la vie ici vous demande",
      subtitle:
        "Voici quelques-unes des démarches pour lesquelles nos accompagnateurs vous aident. Si la vôtre n’y figure pas, demandez-nous : nous pouvons presque toujours vous aider.",
      verTodos: "Voir tous les services",
      items: [
        { titulo: "Santé", texto: "Accompagnement chez le médecin, aux urgences ou chez le spécialiste. Expliquer ce qui vous arrive et comprendre le diagnostic, sans vous perdre pendant la consultation." },
        { titulo: "Démarches et administration", texto: "Police, plaintes, Immigration et NIE, inscription à la mairie, rendez-vous officiels. La bureaucratie espagnole, dans votre langue." },
        { titulo: "Notaire et gestion administrative", texto: "Signatures, procurations, documents officiels. Savoir ce que vous signez avant de le signer." },
        { titulo: "Achat et vente de biens", texto: "Visites, négociation, signature. Un accompagnement pour l’une des décisions les plus importantes que vous prendrez ici." },
        { titulo: "Banque", texto: "Ouvrir ou gérer des comptes, comprendre les conditions, parler avec votre agence." },
        { titulo: "Interprétation téléphonique urgente", texto: "Quand vous avez besoin de quelqu’un au téléphone tout de suite, en direct." },
        { titulo: "Préparation aux entretiens", texto: "Pour arriver en confiance à un entretien d’embauche." },
        { titulo: "Cours d’espagnol", texto: "Adaptés à votre niveau, des bases à la conversation. À l’unité ou en forfaits." },
      ],
    },
    confianza: {
      h2: "Plus qu’une langue : la tranquillité",
      items: [
        { titulo: "Des accompagnateurs de confiance", texto: "Chaque personne de notre réseau rejoint l’équipe une par une, connue et vérifiée. Nous ne sommes pas un annuaire ouvert : nous sommes un réseau soigné." },
        { titulo: "Dans votre langue", texto: "Espagnol, anglais, français, allemand et néerlandais. Trouvez quelqu’un qui parle la vôtre avec naturel." },
        { titulo: "Sur mesure", texto: "Chaque accompagnateur fixe ses services et ses tarifs. Vous choisissez ce qui vous convient, sans surprises." },
        { titulo: "En personne ou à distance", texto: "En personne pour ce qui exige d’être sur place ; par téléphone ou visio pour ce qui se règle sur le moment." },
      ],
    },
    ctaDoble: {
      acomp: {
        h3: "Vous parlez plusieurs langues et souhaitez accompagner ?",
        texto:
          "Si vous connaissez la côte, parlez plusieurs langues et aimez aider les gens dans les moments qui comptent, il y a une place pour vous chez Costa Companion. Vous travaillez à votre manière, avec vos tarifs et votre propre profil sur la plateforme.",
        cta: "Je veux devenir accompagnateur",
      },
      negocio: {
        h3: "Vous avez une entreprise sur la côte ?",
        texto:
          "Touchez la communauté internationale de la Costa del Sol occidentale. Si votre entreprise prend soin des résidents étrangers — une clinique, une agence immobilière, un cabinet de gestion, un commerce —, présentez-vous à ceux qui vous cherchent.",
        cta: "Référencer mon entreprise",
      },
    },
    cierre: {
      h2: "Faites le premier pas aujourd’hui",
      texto:
        "Votre prochaine démarche n’a pas à se faire dans une langue que vous ne maîtrisez pas. Trouvez la personne qui vous accompagnera.",
      cta: "Trouver mon accompagnateur",
    },
  },
};

export default fr;
