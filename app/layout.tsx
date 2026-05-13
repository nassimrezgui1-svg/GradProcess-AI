import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AvaCoach } from "@/components/ai/ava-coach";
import { CookieBanner } from "@/components/ui/cookie-banner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GradProcess AI | AI Graduate Scheme Preparation Platform",
  description: "Prepare for graduate schemes with AI-powered CV tailoring, ATS scoring, STAR interview practice, psychometric tests, video interview simulation and sector-specific commercial awareness.",
  keywords: "graduate scheme, graduate recruitment, ATS score, STAR interview, psychometric tests, video interview, consulting, banking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <AvaCoach />
        <CookieBanner />
      </body>
    </html>
  );
}
