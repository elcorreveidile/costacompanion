import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getLocale } from "@/lib/i18n/server";
import { htmlLang, alternatesFor, isLocale, type Locale } from "@/lib/i18n/config";

const OG_LOCALE: Record<Locale, string> = {
  es: "es_ES",
  en: "en_US",
  fr: "fr_FR",
  de: "de_DE",
  nl: "nl_NL",
  ru: "ru_RU",
  uk: "uk_UA",
};

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const locale = (isLocale(h.get("x-locale")) ? h.get("x-locale") : "es") as Locale;
  const pathname = h.get("x-pathname") || "/";
  const { canonical, languages } = alternatesFor(pathname, locale);

  return {
    metadataBase: new URL("https://www.costacompanion.com"),
    title: {
      default: "Costa Companion — A tu lado, en tu idioma",
      template: "%s | Costa Companion",
    },
    description:
      "Plataforma de acompañamiento lingüístico para residentes y visitantes de la Costa del Sol.",
    alternates: { canonical, languages },
    icons: {
      icon: [{ url: "/icon?v=2", type: "image/png", sizes: "32x32" }],
      shortcut: "/icon?v=2",
      apple: [{ url: "/apple-icon?v=2", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: "Costa Companion — A tu lado, en tu idioma",
      description:
        "Plataforma de acompañamiento lingüístico para residentes y visitantes de la Costa del Sol.",
      url: canonical,
      siteName: "Costa Companion",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
      locale: OG_LOCALE[locale],
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={htmlLang[locale]}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-(--bone) text-(--ink) font-sans antialiased flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
