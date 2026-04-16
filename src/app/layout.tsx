import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth/config";
import { IdleTimeout } from "@/components/providers/idle-timeout";
import { ThemeProvider } from "@/components/eleve/theme-provider";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ÉduRéussite — Réussite pour chaque élève",
  description:
    "Plateforme éducative adaptative pour élèves du primaire et du secondaire. IA personnalisée, alignée sur le curriculum local.",
  keywords: ["éducation", "québec", "primaire", "secondaire", "PFEQ", "IA", "apprentissage"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ÉduRéussite",
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--color-paper)]">
        <SessionProvider session={session}>
          <TRPCProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
            <IdleTimeout />
            <ServiceWorkerRegistration />
            <Analytics />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: { fontFamily: "var(--font-sans)", fontSize: "13px" },
                duration: 3500,
              }}
            />
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
