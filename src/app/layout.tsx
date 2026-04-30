import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "B738 Normal Procedure Checklist",
  description: "An interactive flow and checklist for the Boeing 737NG. Features voice control, dynamic flight briefings, and smart ILS/RNAV filtering for single-pilot simulator operations.",
  icons: {
    icon: "/icons/favicon.svg",
    apple: "/icons/favicon.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F5F7F7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#242627" media="(prefers-color-scheme: dark)" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
