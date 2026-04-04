import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "TraceGuard | Intellectual Property Monitoring",
  description:
    "Forensic-level intellectual property monitoring. Global real-time scanning for unauthorized trademark, patent, and copyright infringements.",
  openGraph: {
    title: "TraceGuard | Intellectual Property Monitoring",
    description:
      "Forensic-level intellectual property monitoring. Global real-time scanning for unauthorized trademark, patent, and copyright infringements.",
    url: "https://trace-guard-omega.vercel.app",
    siteName: "TraceGuard",
    images: [
      {
        url: "https://trace-guard-omega.vercel.app/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TraceGuard - IP Monitoring",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TraceGuard | Intellectual Property Monitoring",
    description:
      "Forensic-level intellectual property monitoring. Global real-time scanning for unauthorized trademark, patent, and copyright infringements.",
    images: ["https://trace-guard-omega.vercel.app/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-background text-on-surface antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
