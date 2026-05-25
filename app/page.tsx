import { LogoSymbol } from "@/components/icons/LogoSymbol";

const CLAIM = {
  es: "a tu lado, en tu idioma",
  en: "by your side, in your language",
  fr: "à vos côtés, dans votre langue",
  de: "an Ihrer Seite, in Ihrer Sprache",
  nl: "aan uw zijde, in uw taal",
};

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-20">
      {/* Bloque de marca "sobre verde" */}
      <div
        className="flex flex-col items-center gap-6 rounded-2xl px-12 py-14 shadow-lg"
        style={{ background: "var(--green)" }}
      >
        <LogoSymbol
          strokeColor="#F7F4EF"
          dotColor="#E0A877"
          className="w-24 h-24"
        />

        <h1
          className="font-display text-4xl sm:text-5xl font-light text-center tracking-tight"
          style={{ color: "var(--bone)" }}
        >
          Costa Companion
        </h1>

        <p
          className="font-display text-xl sm:text-2xl font-light italic text-center"
          style={{ color: "var(--terra-soft)" }}
        >
          {CLAIM.es}
        </p>

        {/* Claims multilingüe en pequeño */}
        <div className="flex flex-col items-center gap-1 pt-2">
          {(["en", "fr", "de", "nl"] as const).map((lang) => (
            <span
              key={lang}
              className="text-sm font-light text-center"
              style={{ color: "rgba(247,244,239,.55)" }}
            >
              {CLAIM[lang]}
            </span>
          ))}
        </div>
      </div>

      {/* Descripción breve */}
      <div className="mt-10 max-w-lg text-center">
        <p className="text-base leading-relaxed" style={{ color: "var(--ink)" }}>
          Plataforma de acompañamiento lingüístico para residentes y visitantes
          de la Costa del Sol.{" "}
          <span style={{ color: "var(--terra)" }} className="font-medium">
            Próximamente en Estepona y Marbella.
          </span>
        </p>
      </div>

      {/* Badge de identidad visual */}
      <div
        className="mt-8 flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm"
        style={{ borderColor: "var(--line)", color: "rgba(43,39,36,.6)" }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: "var(--green)" }}
        />
        Next.js 15 · Supabase · Tailwind v4 · Fraunces + Plus Jakarta Sans
      </div>
    </div>
  );
}
