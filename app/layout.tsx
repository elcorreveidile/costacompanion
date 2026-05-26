import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.costacompanion.com'),
  title: {
    default: "Costa Companion — A tu lado, en tu idioma",
    template: "%s | Costa Companion",
  },
  description:
    "Plataforma de acompañamiento lingüístico para residentes y visitantes de la Costa del Sol.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Costa Companion — A tu lado, en tu idioma",
    description: "Plataforma de acompañamiento lingüístico para residentes y visitantes de la Costa del Sol.",
    url: "https://www.costacompanion.com",
    siteName: "Costa Companion",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-(--bone) text-(--ink) font-sans antialiased">
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
